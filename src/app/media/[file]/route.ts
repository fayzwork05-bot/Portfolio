import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { FILE_RE } from "@/lib/content";
import { UPLOADS } from "@/lib/store";

const MIME: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Serves uploaded files with Range support, so video can seek and start before it has fully downloaded. */
export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  const full = path.join(UPLOADS, file);
  const stat = await fs.stat(full).catch(() => null);
  if (!stat) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": MIME[file.split(".")[1]],
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable", // every upload gets a new name
    "X-Content-Type-Options": "nosniff",
  };
  const m = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0, end = stat.size - 1, status = 200;
  if (m && (m[1] || m[2])) {
    if (m[1]) {
      start = Number(m[1]);
      if (m[2]) end = Math.min(Number(m[2]), end);
    } else {
      start = Math.max(stat.size - Number(m[2]), 0); // "bytes=-N": the last N bytes
    }
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  return new Response(Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream, { status, headers });
}
