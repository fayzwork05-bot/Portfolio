import { showreel, reels, commercial, youtube, site, tools, education, experience, services, type Clip } from "@/data/site";

// Shared by the server (validation, storage) and the admin panel (limits shown in the UI). No Node APIs here.

export type SectionType = "full" | "reels" | "grid";
export type Video = { id: string; title: string; client: string; file: string | null; poster: string | null };
export type Section = { id: string; type: SectionType; marquee: string; heading: string; videos: Video[] };
export type Skill = { id: string; name: string; abbr: string; color: string; icon: string | null }; // icon: an uploaded file name, or a bundled "/path" image
export type About = {
  hello: string;
  lead: string;
  intro: string;
  intro2: string;
  education: { what: string; detail: string }[];
  experience: { when: string; what: string; detail: string }[];
  skills: Skill[];
};
export type Content = { sections: Section[]; about: About; services: string[] };

export const LIMITS = {
  uploads: 20, // uploaded video files in total, across every section
  sections: 12,
  videoBytes: 500 * 1024 * 1024,
  iconBytes: 1024 * 1024,
  iconMin: 128, // px, square
  iconMax: 1024,
  skills: 12,
  services: 12, // service stickers
  listItems: 4, // education / experience entries
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

export const ICON_RULES = `Square PNG (same width and height), ${LIMITS.iconMin} to ${LIMITS.iconMax}px, up to ${LIMITS.iconBytes / 1024 / 1024} MB. A transparent background looks best. It is never stretched: it is fitted inside a square badge.`;

/** Which file types each upload kind accepts (shared by the panel and both upload paths). */
export const KINDS = {
  video: { types: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" }, max: () => LIMITS.videoBytes },
  poster: { types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }, max: () => LIMITS.posterBytes },
  icon: { types: { "image/png": "png" }, max: () => LIMITS.iconBytes },
} as const;
export type UploadKind = keyof typeof KINDS;

export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);
export const emptyVideo = (): Video => ({ id: newId(), title: "", client: "", file: null, poster: null });
export const uploadedCount = (c: Content) => c.sections.reduce((n, s) => n + s.videos.filter((v) => v.file).length, 0);

const seedVideo = (c: Clip): Video => ({ id: c.id, title: c.title, client: c.client, file: null, poster: null });

export const seedAbout = (): About => ({
  hello: "Hello",
  lead: `Hi, I'm ${site.name}.`,
  intro: site.intro,
  intro2: site.intro2,
  education: education.map((e) => ({ ...e })),
  experience: experience.map((e) => ({ ...e })),
  skills: tools.map((t) => ({ id: "sk" + t.abbr.toLowerCase(), name: t.name, abbr: t.abbr, color: t.color, icon: (t as { img?: string }).img ?? null })),
});

/** What the site shows before anything is saved: the sample placeholders. */
export const seedContent = (): Content => ({
  about: seedAbout(),
  services: [...services],
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
  const about = normalizeAbout((input as Content).about, current.about ?? seedAbout());
  if (!about.ok) return about;
  let svc = current.services ?? [...services];
  const given = (input as Content).services;
  if (given !== undefined) {
    if (!Array.isArray(given) || given.length < 1 || given.length > LIMITS.services) return { ok: false, error: `Services: 1 to ${LIMITS.services} stickers.` };
    svc = given.map((s) => str(s, 40));
  }
  return { ok: true, content: { sections: out, about: about.about, services: svc } };
}

/** An icon name is only kept if the server already had it (uploads go through the upload route) and still looks like one of ours. */
const keepIcon = (i: string | null | undefined) => (i && (FILE_RE.test(i) || i === "/davinci.webp") ? i : null);

function normalizeAbout(input: unknown, current: About): { ok: true; about: About } | { ok: false; error: string } {
  const a = input as About | undefined;
  if (!a) return { ok: true, about: current };
  if (!Array.isArray(a.skills) || a.skills.length > LIMITS.skills) return { ok: false, error: `At most ${LIMITS.skills} skills.` };
  if (!Array.isArray(a.education) || a.education.length > LIMITS.listItems || !Array.isArray(a.experience) || a.experience.length > LIMITS.listItems)
    return { ok: false, error: `At most ${LIMITS.listItems} education and experience entries.` };
  const old = new Map((current.skills ?? []).map((s) => [s.id, s]));
  const ids = new Set<string>();
  const skills: Skill[] = [];
  for (const s of a.skills) {
    if (!ID_RE.test(s?.id) || ids.has(s.id)) return { ok: false, error: "Invalid skill id." };
    ids.add(s.id);
    skills.push({ id: s.id, name: str(s.name, 40), abbr: str(s.abbr, 3), color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : "#ffffff", icon: keepIcon(old.get(s.id)?.icon) });
  }
  return {
    ok: true,
    about: {
      hello: str(a.hello, 20),
      lead: str(a.lead, 80),
      intro: str(a.intro, 600),
      intro2: str(a.intro2, 600),
      education: a.education.map((e) => ({ what: str(e?.what, 100), detail: str(e?.detail, 100) })),
      experience: a.experience.map((e) => ({ when: str(e?.when, 40), what: str(e?.what, 100), detail: str(e?.detail, 300) })),
      skills,
    },
  };
}
