import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { handleUploadPresigned } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { FILE_RE, KINDS, LIMITS, uploadedCount, type UploadKind } from "@/lib/content";
import { blobAuth, blobOn } from "@/lib/blobstore";
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

/**
 * POST: Vercel Blob mode. The browser asks here for permission to upload straight to Blob (a video cannot pass through a serverless function),
 * and gets a short-lived, single-file, size- and type-limited token. The file is attached to its slot afterwards by /api/admin/attach.
 */
export async function POST(req: Request) {
  if (!blobOn()) return fail("Blob storage is not configured.", 501);
  if (!isAdmin(req)) return fail("Not signed in.", 401);
  try {
    const body = await req.json();
    const result = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname, clientPayload) => {
        const { id, kind } = JSON.parse(clientPayload ?? "{}") as { id?: string; kind?: UploadKind };
        const k = kind && KINDS[kind];
        const name = pathname.slice("uploads/".length);
        if (!k || !id || !pathname.startsWith("uploads/") || !FILE_RE.test(name) || !name.startsWith(id + "-")) throw new Error("Bad upload request.");
        const content = await getContent();
        const slot = kind === "icon" ? content.about.skills.find((s) => s.id === id) : content.sections.flatMap((s) => s.videos).find((v) => v.id === id);
        if (!slot) throw new Error("Slot not found. Wait for the page to finish saving, then try again.");
        if (kind === "video" && !(slot as { file: string | null }).file && uploadedCount(content) >= LIMITS.uploads) throw new Error(`Limit reached: ${LIMITS.uploads} videos.`);
        const token = await issueSignedToken({ pathname, operations: ["put"], allowedContentTypes: Object.keys(k.types), maximumSizeInBytes: k.max(), validUntil: Date.now() + 15 * 60 * 1000, ...blobAuth() });
        return { token, urlOptions: { allowOverwrite: false, addRandomSuffix: false } };
      },
    });
    return Response.json(result);
  } catch (e) {
    return fail((e as Error).message, 400);
  }
}

/** PUT /api/admin/upload?id=<video or skill id>&kind=video|poster|icon with the raw file as the body. */
export async function PUT(req: Request) {
  if (!isAdmin(req)) return fail("Not signed in.", 401);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const kind = url.searchParams.get("kind");
  const type = TYPES[req.headers.get("content-type")?.split(";")[0] ?? ""];
  const okType = kind === "icon" ? type?.ext === "png" : type && type.kind === kind;
  if (!type || !okType) return fail(kind === "icon" ? "Icon must be a PNG." : kind === "poster" ? "Poster must be JPG, PNG or WebP." : "Video must be MP4, WebM or MOV.", 415);
  const max = kind === "video" ? LIMITS.videoBytes : kind === "icon" ? LIMITS.iconBytes : LIMITS.posterBytes;
  if (Number(req.headers.get("content-length")) > max) return fail(`File is too large (max ${max / 1024 / 1024} MB).`, 413);
  if (!req.body) return fail("Empty upload.", 400);

  const precheck = await getContent();
  const slot = kind === "icon" ? precheck.about.skills.find((k) => k.id === id) : precheck.sections.flatMap((s) => s.videos).find((v) => v.id === id);
  if (!slot) return fail("Slot not found. Wait for the page to finish saving, then try again.", 404);
  if (kind === "video" && !(slot as { file: string | null }).file && uploadedCount(precheck) >= LIMITS.uploads) return fail(`Limit reached: ${LIMITS.uploads} videos. Remove a video file first.`, 409);

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
    const head = Buffer.alloc(32);
    await fh.read(head, 0, 32, 0);
    await fh.close();
    if (!looksRight(head, type.ext)) throw new Error("bad type");
    if (kind === "icon") {
      const w = head.readUInt32BE(16), h = head.readUInt32BE(20); // PNG IHDR
      if (w !== h) throw new Error(`Icon must be square (this one is ${w}×${h}px).`);
      if (w < LIMITS.iconMin || w > LIMITS.iconMax) throw new Error(`Icon must be ${LIMITS.iconMin} to ${LIMITS.iconMax}px (this one is ${w}px).`);
    }
  } catch (e) {
    await fs.unlink(tmp).catch(() => {});
    const m = (e as Error).message;
    return fail(m === "too large" ? "File is too large." : m === "bad type" ? "That file is not a valid " + type.ext.toUpperCase() + "." : m, 400);
  }

  return withLock(async () => {
    const content = await getContent();
    const video = kind === "icon" ? content.about.skills.find((k) => k.id === id) : content.sections.flatMap((s) => s.videos).find((v) => v.id === id);
    if (!video || (kind === "video" && !(video as { file: string | null }).file && uploadedCount(content) >= LIMITS.uploads)) {
      await fs.unlink(tmp).catch(() => {});
      return fail(video ? "Video limit reached." : "Video slot was removed.", video ? 409 : 404);
    }
    const name = `${id}-${randomBytes(3).toString("hex")}.${type.ext}`;
    await fs.rename(tmp, path.join(UPLOADS, name));
    if (kind === "icon") (video as { icon: string | null }).icon = name;
    else if (kind === "video") (video as { file: string | null }).file = name;
    else (video as { poster: string | null }).poster = name;
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
    if (kind === "icon") {
      const skill = content.about.skills.find((k) => k.id === id);
      if (!skill) return fail("Not found.", 404);
      skill.icon = null;
    } else {
      const video = content.sections.flatMap((s) => s.videos).find((v) => v.id === id);
      if (!video || (kind !== "video" && kind !== "poster")) return fail("Not found.", 404);
      if (kind === "video") video.file = null;
      else video.poster = null;
    }
    await saveContent(content);
    revalidatePath("/");
    return Response.json({ content });
  });
}
