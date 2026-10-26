import { revalidatePath } from "next/cache";
import { del, head } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";
import { FILE_RE, KINDS, LIMITS, uploadedCount, type UploadKind } from "@/lib/content";
import { blobAuth, blobOn } from "@/lib/blobstore";
import { getContent, saveContent, withLock } from "@/lib/store";

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** POST {id, kind, name}: after the browser has uploaded uploads/<name> to Blob, check it and attach it to its video or skill. */
export async function POST(req: Request) {
  if (!blobOn()) return fail("Blob storage is not configured.", 501);
  if (!isAdmin(req)) return fail("Not signed in.", 401);
  const { id, kind, name } = (await req.json().catch(() => ({}))) as { id?: string; kind?: UploadKind; name?: string };
  const k = kind && KINDS[kind];
  if (!k || !id || !name || !FILE_RE.test(name) || !name.startsWith(id + "-")) return fail("Bad request.", 400);
  const ext = name.split(".")[1];
  if (!(Object.values(k.types) as string[]).includes(ext)) return fail("Wrong file type for this slot.", 415);

  const reject = async (msg: string) => {
    await del(`uploads/${name}`, blobAuth()).catch(() => {});
    return fail(msg, 400);
  };
  const blob = await head(`uploads/${name}`, blobAuth()).catch(() => null);
  if (!blob) return fail("The upload did not arrive. Try again.", 404);
  if (blob.size > k.max()) return reject("File is too large.");
  if (kind === "icon") {
    // PNG header: width and height are at bytes 16 to 24
    const head32 = Buffer.from(await (await fetch(blob.url, { headers: { Range: "bytes=0-31" } })).arrayBuffer());
    if (head32.subarray(1, 4).toString("latin1") !== "PNG") return reject("That file is not a valid PNG.");
    const w = head32.readUInt32BE(16), h = head32.readUInt32BE(20);
    if (w !== h) return reject(`Icon must be square (this one is ${w}×${h}px).`);
    if (w < LIMITS.iconMin || w > LIMITS.iconMax) return reject(`Icon must be ${LIMITS.iconMin} to ${LIMITS.iconMax}px (this one is ${w}px).`);
  }

  return withLock(async () => {
    const content = await getContent();
    const slot = kind === "icon" ? content.about.skills.find((s) => s.id === id) : content.sections.flatMap((s) => s.videos).find((v) => v.id === id);
    if (!slot) return reject("That slot was removed.");
    if (kind === "video" && !(slot as { file: string | null }).file && uploadedCount(content) >= LIMITS.uploads) return reject("Video limit reached.");
    if (kind === "icon") (slot as { icon: string | null }).icon = name;
    else if (kind === "video") (slot as { file: string | null }).file = name;
    else (slot as { poster: string | null }).poster = name;
    await saveContent(content); // also deletes the file this replaced
    revalidatePath("/");
    return Response.json({ content });
  });
}
