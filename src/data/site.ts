// All copy and media here is SAMPLE content. Replace with Fayz's real material.
// Set `src` (mp4 URL) and `poster` (image URL) on a clip to swap placeholder art for real video.

export const site = {
  name: "Fayz Mehmood",
  role: "Video Editor & Motion Designer",
  year: "2026",
  tagline: "Cuts that hold attention",
  email: "hello@example.com", // placeholder
  phone: "+00 000 000 0000", // placeholder
  whatsapp: "https://wa.me/0000000000", // placeholder
  intro:
    "I cut stories that keep people watching, from the first frame to the last. Short-form, commercials and long-form YouTube, paced, sound-designed and graded to feel finished.",
  intro2:
    "Every project starts with the viewer: what should they feel in the first three seconds, and what should they do after the last one.",
};

export const experience = [
  { when: "2022 – Present", what: "Freelance Video Editor & Motion Designer", detail: "Commercial videos, reels and YouTube content for brands and creators. [Replace with real clients and results]" },
];

export const education = [
  { what: "[University name]", detail: "[Degree] · [Years]" },
];

export const tools = [
  { abbr: "Pr", name: "Premiere Pro", color: "#a99bff" },
  { abbr: "Ae", name: "After Effects", color: "#c3a4ff" },
  { abbr: "Ps", name: "Photoshop", color: "#6fc3ff" },
  { abbr: "Ai", name: "Illustrator", color: "#ffb347" },
  { abbr: "Au", name: "Audition", color: "#5ee6c4" },
  { abbr: "Dv", name: "DaVinci Resolve", color: "#ff7a7a", img: "/davinci.webp" },
  { abbr: "Cc", name: "CapCut", color: "#7fe3ff" }, // test skill
];

export const services = [
  "Short-Form Content",
  "Commercial Ads",
  "Motion Graphics",
  "Color Grading",
  "YouTube Editing",
  "UGC Ads",
];

export type Clip = {
  id: string;
  title: string;
  client: string;
  ratio: "9:16" | "16:9";
  hue: number;
  src?: string;
  poster?: string;
};

export const showreel: Clip = {
  id: "showreel",
  title: "Showreel 2026",
  client: "Sample showreel",
  ratio: "16:9",
  hue: 8,
};

// exactly two or three: they share one player (see ReelGroup)
export const reels: [Clip, Clip] | [Clip, Clip, Clip] = [
  { id: "r1", title: "Product launch reel", client: "Sample client", ratio: "9:16", hue: 8 },
  { id: "r2", title: "Food promo", client: "Sample client", ratio: "9:16", hue: 28 },
  { id: "r3", title: "Event recap", client: "Sample client", ratio: "9:16", hue: 350 },
];

export const commercial: Clip[] = [
  { id: "c1", title: "Brand launch film", client: "Sample client", ratio: "16:9", hue: 215 },
  { id: "c2", title: "Store opening", client: "Sample client", ratio: "16:9", hue: 160 },
  { id: "c3", title: "Event highlights", client: "Sample client", ratio: "16:9", hue: 280 },
  { id: "c4", title: "Product spot", client: "Sample client", ratio: "16:9", hue: 40 },
];

export const youtube: Clip[] = [
  { id: "y1", title: "Documentary edit", client: "Sample channel", ratio: "16:9", hue: 200 },
  { id: "y2", title: "Explainer with motion graphics", client: "Sample channel", ratio: "16:9", hue: 330 },
  { id: "y3", title: "Talking-head edit", client: "Sample channel", ratio: "16:9", hue: 120 },
  { id: "y4", title: "Vlog edit", client: "Sample channel", ratio: "16:9", hue: 20 },
];

export const nav = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];
