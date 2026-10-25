# CONTEXT.md — Current Status

> Last updated: 2026-10-21

## What are we building?
A single-page portfolio for video editor Fayz Mehmood in a Behance-reference style (grid paper, black bands, tall glitch lettering) with the client's real portrait and a rotating full-body figure.

## Just completed
- Hero face now uses the client's storyboard artwork (transparent cutout) with a CSS tilt, blink and faint smile loop; gap to the letters reduced.
- About section has a drag / auto-rotate / keyboard turntable built from the client's 4 full-body photos.

## Up next
- Film a slow 360 turn of the client, then replace the 4-photo blend with a smooth frame sequence like the Behance reference video.
- Clean up unused portrait files and old eye-animation code.

## ⚠️ Gotchas — read before touching code
- The 4-photo turntable ghosts mid-turn; the user finds it unacceptable. Real 3D (Hunyuan3D etc.) will not run on this laptop (AMD Vega 8, no CUDA).
- Smile layer is nearly invisible because the source smile frame is almost identical to neutral.
- `--emw` in `globals.css` assumes portrait ratio .753; change it if the hero image changes.
- Headless Chrome cannot run the GSAP hero intro or advance CSS animations in virtual time.
- Not a git repo: nothing is committed.

---

## Starting a new Claude Code session?

Run `/session-start`, or: Read CLAUDE.md, then the latest entry in DECISIONS.md, then CONTEXT.md.
