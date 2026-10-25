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
