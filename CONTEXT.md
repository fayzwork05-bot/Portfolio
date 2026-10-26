# CONTEXT.md — Current Status

> Last updated: 2026-10-26

## What are we building?
A single-page portfolio for video editor Fayz Mehmood in a Behance-reference style (grid paper, black bands, tall glitch lettering) with the client's real portrait and a rotating full-body figure.

## Just completed
- Hero face is now the user's own clip (`Man_blinking_and_smiling_...mp4`) with the grey background keyed out: `public/portrait/face.webm` (VP9 + alpha) + `face-poster.webp`, played by `src/components/HeroFace.tsx` after the intro. Verified in real-time Chrome frames (neutral, blink, head turn) on the site background.
- Earlier attempts this session (iris/eyelid cut-outs; eye-patch swaps from generated poses) are superseded; their assets are still in the repo.
- Key frames and prompts from `refernece/Face-Only.mp4` are in `refernece/keyframes/`.

## Up next
- User watches a full loop; tune the start delay, the faint grey fringe at the top-left of the hair, or Safari support.
- Clean up unused assets (`public/portrait/eye/`, `gen/`, `hf-*.webp`, stray WhatsApp jpegs) and the dead `setEyes` code in `Motion.tsx`.
- Still open from before: smooth 360 turntable for About.

## ⚠️ Gotchas — read before touching code
- Safari cannot show VP9-alpha WebM: it shows the poster only. A HEVC-alpha .mov is the fix but can't be encoded on this PC.
- `--emw` in `globals.css` assumes portrait ratio .753 (542x720 matches).
- Headless Chrome virtual time does not run the GSAP intro/video; use CDP in real time.
- The Gemini key in `.env.local` has no image-generation quota (429 on the free tier).
- `HeroFace.tsx` / `globals.css` / new portrait assets are not committed; only the docs are.
- Port 3000 is another process; `next dev` used :3002. The dev server may still be running.
- Next dev shows a pre-existing hydration warning on `<html>` font classes.

---

## Starting a new Claude Code session?

Run `/session-start`, or: Read CLAUDE.md, then the latest entry in DECISIONS.md, then CONTEXT.md.
