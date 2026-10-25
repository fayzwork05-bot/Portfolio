import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { LIMITS, uploadedCount } from "@/lib/content";
import { UPLOADS, getContent, saveContent, withLock } from "@/lib/store";

const TYPES: Record<string, { ext: string; kind: "video" | "poster" }> = {
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
  "image/jpeg": { ext: "jpg", kind: "poster" },
  "image/png": { ext: "png", kind: "poster" },
  "image/webp": { ext: "webp", kind: "poster" },
};

// the first bytes must match the type the browser claims
function looksRight(head: Buffer, ext: string) {
  const at = (o: number, s: string) => head.subarray(o, o + s.length).toString("latin1") === s;
  if (ext === "mp4" || ext === "mov") return at(4, "ftyp") || at(4, "moov") || at(4, "mdat") || at(4, "wide") || at(4, "free");
  if (ext === "webm") return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
  if (ext === "jpg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (ext === "png") return head[0] === 0x89 && at(1, "PNG");
  return at(0, "RIFF") && at(8, "WEBP");
}

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** PUT /api/admin/upload?id=<video id>&kind=video|poster with the raw file as the body. */
export async function PUT(req: Request) {
  if (!isAdmin(req)) return fail("Not signed in.", 401);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const kind = url.searchParams.get("kind");
  const type = TYPES[req.headers.get("content-type")?.split(";")[0] ?? ""];
  if (!type || type.kind !== kind) return fail(kind === "poster" ? "Poster must be JPG, PNG or WebP." : "Video must be MP4, WebM or MOV.", 415);
  const max = kind === "video" ? LIMITS.videoBytes : LIMITS.posterBytes;
  if (Number(req.headers.get("content-length")) > max) return fail(`File is too large (max ${max / 1024 / 1024} MB).`, 413);
  if (!req.body) return fail("Empty upload.", 400);

  const precheck = await getContent();
  const slot = precheck.sections.flatMap((s) => s.videos).find((v) => v.id === id);
  if (!slot) return fail("Video slot not found. Wait for the page to finish saving, then try again.", 404);
  if (kind === "video" && !slot.file && uploadedCount(precheck) >= LIMITS.uploads) return fail(`Limit reached: ${LIMITS.uploads} videos. Remove a video file first.`, 409);

  await fs.mkdir(UPLOADS, { recursive: true });
  const tmp = path.join(UPLOADS, `.tmp-${randomBytes(6).toString("hex")}`);
  let bytes = 0;
  try {
    await pipeline(
      Readable.fromWeb(req.body as never),
      new Transform({
        transform(chunk, _e, cb) {
          bytes += chunk.length;
          cb(bytes > max ? new Error("too large") : null, chunk);
        },
      }),
      createWriteStream(tmp),
    );
    const fh = await fs.open(tmp, "r");
    const head = Buffer.alloc(16);
    await fh.read(head, 0, 16, 0);
    await fh.close();
    if (!looksRight(head, type.ext)) throw new Error("bad type");
  } catch (e) {
    await fs.unlink(tmp).catch(() => {});
    return fail((e as Error).message === "too large" ? "File is too large." : "That file is not a valid " + type.ext.toUpperCase() + ".", 400);
  }

  return withLock(async () => {
    const content = await getContent();
    const video = content.sections.flatMap((s) => s.videos).find((v) => v.id === id);
    if (!video || (kind === "video" && !video.file && uploadedCount(content) >= LIMITS.uploads)) {
      await fs.unlink(tmp).catch(() => {});
      return fail(video ? "Video limit reached." : "Video slot was removed.", video ? 409 : 404);
    }
    const name = `${id}-${randomBytes(3).toString("hex")}.${type.ext}`;
    await fs.rename(tmp, path.join(UPLOADS, name));
    if (kind === "video") video.file = name;
    else video.poster = name;
    await saveContent(content); // also deletes the file this replaced
    revalidatePath("/");
    return Response.json({ content });
  });
}

/** DELETE /api/admin/upload?id=<video id>&kind=video|poster removes the file but keeps the slot. */
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return fail("Not signed in.", 401);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const kind = url.searchParams.get("kind");
  return withLock(async () => {
    const content = await getContent();
    const video = content.sections.flatMap((s) => s.videos).find((v) => v.id === id);
    if (!video || (kind !== "video" && kind !== "poster")) return fail("Not found.", 404);
    if (kind === "video") video.file = null;
    else video.poster = null;
    await saveContent(content);
    revalidatePath("/");
    return Response.json({ content });
  });
}
