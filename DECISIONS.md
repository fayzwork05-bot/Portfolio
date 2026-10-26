# DECISIONS.md — Project Memory

> Every session's changes, bugs, fixes, and decisions are logged here automatically
> by the `session-handoff` Claude Code skill.
>
> 📖 **New to this project?** Read from the bottom up for full history, or just read
> the first (newest) entry to get current status.
>
> 🤖 **Starting a Claude Code session?** Run `/session-start` — Claude reads this
> file and briefs you in under 60 seconds.
>
> Install the skill: https://github.com/s9b/session-handoff

---
<!-- ENTRIES_START — Claude inserts new entries right below this line -->
---

## [2026-10-26] — hero-face-keyed-alpha-video-s0a7c (hero face = transparent video)

**Team member:** AKL (printoutpakistan@gmail.com)
**Status:** Done (hero swap finished; user still to watch a full loop and judge the result)

### Task
Make the hero face animate like the reference clip `refernece/Face-Only.mp4` (still head, eyes glance / blink / half-lid) using the client's own face, and finally replace the hero face with the user's new clip `Downloads/Man_blinking_and_smiling_20261026224953.mp4` with its background removed.

### Changes made
| File / Module | What changed | Why |
|--------------|-------------|-----|
| `src/components/HeroFace.tsx` | Rewritten as a client component: muted looping `<video>` (`/portrait/face.webm`, poster `face-poster.webp`), `play()` after 3.8s (hero intro), no play for reduced motion | Final hero: the user's clip, face only |
| `src/app/globals.css` | Removed the old `.hf-tilt/.hf-blink/.hf-smile` keyframe loop; added `.hf-video` (absolute, contain, bottom aligned) | Old CSS loop no longer used |
| `public/portrait/face.webm` (new) | VP9 + alpha, 542x720, 24fps, 7.17s (frames 20-191 of the source; face fade-in frames 0-19 dropped), 843 KB | Transparent face video |
| `public/portrait/face-poster.webp` (new) | First frame with alpha | Shown before play / reduced motion / Safari |
| `refernece/keyframes/` (new) | 7 labelled key frames E01-E07 from Face-Only.mp4, `CLIENT-base.png`, `PROMPTS.md`, contact sheet | Prompts for ChatGPT/Gemini pose generation |
| `public/portrait/gen/` (new, from user) | 7 generated pose images of the client (E01-E07) | Input for the eye-patch version (now superseded) |
| `public/portrait/eye/E02-E07.webp` (new) | Eye-area patches of the poses, registered to hf-base and feathered | Earlier eye-swap hero (superseded by the video, still in repo) |
| `.env.local` | User added `GEMINI_API_KEY` (git-ignored) | Option B; the key has no image-generation quota (free tier), so the poses were made in ChatGPT/Gemini apps |

### Problems & fixes
| Problem | Root cause | Fix applied |
|---------|-----------|-------------|
| First try (cut-out irises moved by GSAP + clipped closed-eye overlay) looked fake to the user | Half-lid/wink from a hard-clipped overlay; sclera fill is synthetic | Abandoned; moved to generated poses |
| Gemini API returned 429 on all image models, with two different keys | Free tier has `limit: 0` for image generation | User generated frames in the ChatGPT/Gemini apps from my prompts instead |
| Video's grey enclosed in the turned-head glasses lens stayed solid | Enclosed bg-coloured area is not connected to the border | Treat any bg-coloured enclosed area >= 250px as transparent; tolerance 10 (compression noise made a grey halo at 3) |
| Headless screenshots blank with `--virtual-time-budget` | GSAP intro does not advance in virtual time | `shot.mjs` over CDP with real time (Node 24 global WebSocket, port 9333) |

### Decisions made
- Reference clip Face-Only.mp4 only looks centre -> viewer's left (never right) and has no true one-eye wink, so no right-glance/wink poses were made.
- Final hero uses the user's own clip (alpha WebM) instead of the eye-patch overlays; patch assets kept in repo but unused.
- Safari does not render VP9-alpha WebM, so it shows the poster only. A HEVC-alpha .mov would be the fix but cannot be encoded on this PC.
- Key = flat grey (130,130,130) background flood-filled from the border, biggest blob + near thin parts kept, 1px erode + 0.8px blur. A faint grey fringe at the top-left of the hair remains.

### Current state
Hero shows the transparent face video on the site grid (verified in real-time Chrome frames: neutral, blink, head turn). Dev server was left running on :3002 (:3000 is another process). Changes to `HeroFace.tsx` and `globals.css` are not committed; only the docs are committed by this handoff.

### Next steps
- [ ] User watches a full loop; tune start delay, edge fringe, or Safari support if needed
- [ ] Delete unused assets: `public/portrait/eye/`, `gen/`, `hf-{base,blink,smile}.webp`, the stray WhatsApp jpegs, if not wanted
- [ ] Remove dead `setEyes`/`EYES` face code in `src/components/Motion.tsx`
- [ ] Pre-existing: Next dev hydration warning on `<html>` font classes ("1 Issue" overlay)

---

---

## [2026-10-21] — Hero portrait from client artwork + About turntable

**Team member:** AKL (printoutpakistan@gmail.com)
**Status:** In Progress

### Task
Replace the placeholder hero face with the real client's portrait, animate it subtly, and give the About section a drag-to-rotate full-body figure like the Behance reference.

### Changes made
| File / Module | What changed | Why |
|--------------|-------------|-----|
| `src/components/HeroFace.tsx` | Now 3 stacked `<img>` layers (base, blink, smile) inside `.hf-head`; the old hand-drawn SVG is gone | Hand-drawn SVGs looked nothing like the client |
| `public/portrait/hf-base/blink/smile.webp` | Transparent cutouts from `Downloads/Minimalist Portrait Expression Storyboard.png` (frames 1, 4, 5), aligned on the face; blink and smile layers cover only the eye / mouth windows | Keeps the client's likeness exact and glasses frames still |
| `src/app/globals.css` | `.hf-*` 8s loop (tilt 1.4deg about the neck, blink 150/200ms, faint smile), reduced-motion safe; `--emw` portrait ratio .753; lockup `gap: 0`; `.selbox*` restyled for the turntable; old eye/SVG rules removed | Hero animation and tighter face-to-letter gap |
| `src/components/Turntable.tsx` (new) | Drag / auto-rotate / arrow-key figure that blends 4 photos by angle | About-section 360 figure |
| `public/portrait/turn-{front,right,back,left}.webp` | Cutouts of `refernece/client/Fours_sides/*.jpeg` (GrabCut + HSV), normalised to 540x1100 | Turntable inputs |
| `src/app/page.tsx` | Hero uses `<HeroFace>`; About uses `<Turntable>` instead of `Turnaround` + `body.webp` | Wiring |

### Problems & fixes
| Problem | Root cause | Fix applied |
|---------|-----------|-------------|
| Right side of hero head looked cut off | GrabCut ate the shaded cheek/hair | Flood-fill the smooth background from the edges (gradient threshold 18) plus a neck polygon |
| Headless screenshots blank / animation frames identical | Hero GSAP intro and virtual time do not advance in headless Chrome | Use `--force-prefers-reduced-motion` for static shots, negative `animation-delay` to freeze CSS frames, CDP script (`scratchpad/cdp.mjs`) to scroll and drag |
| Orange door removal erased skin | Skin hue is close to the door | Only remove S>175 and V>130 |
| Mid-turn blend ghosts | Only 4 views | Narrow blend window (f 0.4-0.6) and squeeze only during the swap |

### Decisions made
- Hand-drawn / auto-traced vector faces were abandoned; the client's AI storyboard artwork is the face source.
- The turntable is a 4-photo blend, not a 3D model. Image-to-3D (Hunyuan3D etc.) is not viable on this laptop (AMD Vega 8, no CUDA, 15 GB RAM) and is generative anyway.
- The reference wants a smooth 360 frame sequence. Recommended path: client films one slow 360 turn on a tripod, then extract about 90-120 frames, cut out, and swap them into `Turntable`.
- Tilt is a real CSS rotation of the neutral frame (the storyboard tilt frame does not align and would ghost).

### Current state
Hero shows the client artwork with a looping tilt, blink and faint smile, tight against the lettering. About has a working drag / auto-rotate 4-photo turntable, which the user does not consider good enough. The smile frame in the storyboard is nearly identical to the neutral frame, so the smile is barely visible. Not a git repo.

### Next steps
- [ ] Get a slow 360 turn video of the client; build the frame-sequence turntable (about 90-120 cutouts, same drag / auto / reduced-motion behaviour)
- [ ] Optional: higher-resolution portrait art (current face is about 230 px, upscaled 2x)
- [ ] Remove dead code: eye loop in `Motion.tsx`, unused `Portrait.tsx`, `public/portrait/hero.webp|body.webp|bust.webp`, `Turnaround` export
- [ ] Check real phone widths (headless Chrome minimum is 500 px) and the "1 Issue" hydration warning on `<html>` className (pre-existing)

---
