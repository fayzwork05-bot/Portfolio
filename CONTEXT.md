# CONTEXT.md — Current Status

> Last updated: 2026-11-04

## What are we building?
A single-page portfolio for video editor Fayz Mehmood in a Behance-reference style (grid paper, black bands, tall glitch lettering) with the client's real portrait and a rotating full-body figure.

## Just completed
- Hero face is now the user's own clip (`Man_blinking_and_smiling_...mp4`) with the grey background keyed out: `public/portrait/face.webm` (VP9 + alpha) + `face-poster.webp`, played by `src/components/HeroFace.tsx` after the intro. Verified in real-time Chrome frames (neutral, blink, head turn) on the site background.
- Earlier attempts this session (iris/eyelid cut-outs; eye-patch swaps from generated poses) are superseded; their assets are still in the repo.
- Key frames and prompts from `refernece/Face-Only.mp4` are in `refernece/keyframes/`.

- 2026-10-27: hero swapped to `Animating_portrait_image_eyes_...mp4` (keyed, looping); `public/portrait/figure.mp4` = cropped turning full-body figure from the Behance recording (not used on any page yet).

- 2026-11-02: contact details are now editable in `/admin` > Contact (email, phone, WhatsApp, extra links); pushed to origin/main (cb2712a).

- 2026-11-04: hero face video re-keyed clean (no ear/hair fringe). Big screens: the page scales with the viewport from 1500px up to 6000px (root font-size follows width, rules at the end of `globals.css`); the temporary A/B/C switch was removed after the client chose Scale up.

## Up next
- Confirm the host deployed the latest commit, then enter real contact details in `/admin`.
- Decide if `figure.mp4` replaces the About turntable / needs its grid background keyed out.
- User watches a full loop; tune the start delay or Safari support (the fringe is fixed).
- Clean up unused assets (`public/portrait/eye/`, `gen/`, `hf-*.webp`, stray WhatsApp jpegs) and the dead `setEyes` code in `Motion.tsx`.
- Still open from before: smooth 360 turntable for About.

## ⚠️ Gotchas — read before touching code
- Safari cannot show VP9-alpha WebM: it shows the poster only. A HEVC-alpha .mov is the fix but can't be encoded on this PC.
- `--emw` in `globals.css` assumes portrait ratio .753 (542x720 matches).
- Headless Chrome virtual time does not run the GSAP intro/video; use CDP in real time.
- The Gemini key in `.env.local` has no image-generation quota (429 on the free tier).
- Contact section shows placeholder email/phone until real values are saved in `/admin`.
- Port 3000 is another process; `next dev` used :3002. The dev server may still be running.
- Next dev may show a hydration warning on `<html>` (font classes + the inline `js` script); `suppressHydrationWarning` is set.
- Big screens: rem-based. New fixed-px sizes will NOT scale above 1500px; use rem. Scaling caps at 6000px.

---

## Starting a new Claude Code session?

Run `/session-start`, or: Read CLAUDE.md, then the latest entry in DECISIONS.md, then CONTEXT.md.
