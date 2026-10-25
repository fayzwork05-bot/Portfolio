import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { FILE_RE, normalize, seedContent, type Content } from "./content";

// Local-disk storage: data/content.json plus data/uploads/*. This does NOT survive on Vercel (read-only, ephemeral disk).
// For production, replace the functions in this file with Vercel Blob (files) + a database or KV (content.json). Nothing else touches the disk.
const DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOADS = path.join(DIR, "uploads");
const FILE = path.join(DIR, "content.json");

export async function getContent(): Promise<Content> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8"));
    const r = normalizeStored(raw);
    if (r) return r;
  } catch {}
  return seedContent();
}

// stored content already carries file names, so it is read as-is after a shape check
function normalizeStored(raw: Content): Content | null {
  if (!Array.isArray(raw?.sections)) return null;
  const base = normalize(raw, raw);
  if (!base.ok) return null;
  // normalize keeps file names from `current`, which is the stored copy itself, so only file names that pass the pattern survive
  for (const s of base.content.sections) for (const v of s.videos) {
    if (v.file && !FILE_RE.test(v.file)) v.file = null;
    if (v.poster && !FILE_RE.test(v.poster)) v.poster = null;
  }
  return base.content;
}

let chain: Promise<unknown> = Promise.resolve();
/** Runs one read-modify-write at a time so two requests cannot overwrite each other. */
export function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

export async function saveContent(content: Content) {
  await fs.mkdir(UPLOADS, { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(content, null, 2));
  await fs.rename(tmp, FILE);
  // delete uploads nothing refers to any more
  const used = new Set<string | null>([...content.sections.flatMap((s) => s.videos.flatMap((v) => [v.file, v.poster])), ...content.about.skills.map((k) => k.icon)]);
  for (const f of await fs.readdir(UPLOADS)) if (FILE_RE.test(f) && !used.has(f)) await fs.unlink(path.join(UPLOADS, f)).catch(() => {});
}
