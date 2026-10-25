import { showreel, reels, commercial, youtube, type Clip } from "@/data/site";

// Shared by the server (validation, storage) and the admin panel (limits shown in the UI). No Node APIs here.

export type SectionType = "full" | "reels" | "grid";
export type Video = { id: string; title: string; client: string; file: string | null; poster: string | null };
export type Section = { id: string; type: SectionType; marquee: string; heading: string; videos: Video[] };
export type Content = { sections: Section[] };

export const LIMITS = {
  uploads: 20, // uploaded video files in total, across every section
  sections: 12,
  videoBytes: 500 * 1024 * 1024,
  posterBytes: 8 * 1024 * 1024,
  // videos per section
  rules: { full: { min: 1, max: 3 }, reels: { min: 2, max: 3 }, grid: { min: 4, max: 4 } },
} as const;

export const TYPE_LABEL: Record<SectionType, string> = {
  full: "Full width (videos stack, 1 to 3)",
  reels: "Reels (one shared player, 2 or 3)",
  grid: "Grid (each has its own player, exactly 4)",
};

export const ID_RE = /^[a-z0-9]{2,16}$/;
export const FILE_RE = /^[a-z0-9]{2,16}-[a-z0-9]{6}\.(mp4|webm|mov|jpg|png|webp)$/;

export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);
export const emptyVideo = (): Video => ({ id: newId(), title: "", client: "", file: null, poster: null });
export const uploadedCount = (c: Content) => c.sections.reduce((n, s) => n + s.videos.filter((v) => v.file).length, 0);

const seedVideo = (c: Clip): Video => ({ id: c.id, title: c.title, client: c.client, file: null, poster: null });

/** What the site shows before anything is saved: the sample placeholders. */
export const seedContent = (): Content => ({
  sections: [
    { id: "secshow", type: "full", marquee: "SHOWREEL", heading: "Showreel", videos: [seedVideo(showreel)] },
    { id: "secreels", type: "reels", marquee: "SOCIAL MEDIA & REELS", heading: "", videos: reels.map(seedVideo) },
    { id: "seccomm", type: "grid", marquee: "COMMERCIAL, LAUNCHES & EVENTS", heading: "", videos: commercial.map(seedVideo) },
    { id: "secyt", type: "grid", marquee: "YOUTUBE VIDEOS", heading: "", videos: youtube.map(seedVideo) },
  ],
});

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Checks what the panel sends. Section types, counts and text are taken from the client; file names never are:
 * a video keeps whatever file the server already has for that id, and a new video starts empty. Files only change through the upload route.
 */
export function normalize(input: unknown, current: Content): { ok: true; content: Content } | { ok: false; error: string } {
  const sections = (input as Content | null)?.sections;
  if (!Array.isArray(sections)) return { ok: false, error: "Invalid content." };
  if (sections.length > LIMITS.sections) return { ok: false, error: `At most ${LIMITS.sections} sections.` };

  const known = new Map<string, Video>();
  current.sections.forEach((s) => s.videos.forEach((v) => known.set(v.id, v)));
  const ids = new Set<string>();
  const out: Section[] = [];

  for (const s of sections as Section[]) {
    if (!ID_RE.test(s?.id) || ids.has(s.id)) return { ok: false, error: "Invalid section id." };
    ids.add(s.id);
    if (!(s.type in LIMITS.rules)) return { ok: false, error: "Unknown section type." };
    const rule = LIMITS.rules[s.type];
    if (!Array.isArray(s.videos) || s.videos.length < rule.min || s.videos.length > rule.max)
      return { ok: false, error: `A ${s.type} section needs ${rule.min === rule.max ? rule.min : `${rule.min} to ${rule.max}`} videos.` };
    const videos: Video[] = [];
    for (const v of s.videos) {
      if (!ID_RE.test(v?.id) || ids.has(v.id)) return { ok: false, error: "Invalid video id." };
      ids.add(v.id);
      const old = known.get(v.id);
      videos.push({ id: v.id, title: str(v.title, 80), client: str(v.client, 80), file: old?.file ?? null, poster: old?.poster ?? null });
    }
    out.push({ id: s.id, type: s.type, marquee: str(s.marquee, 60), heading: s.type === "full" ? str(s.heading, 40) : "", videos });
  }
  return { ok: true, content: { sections: out } };
}
