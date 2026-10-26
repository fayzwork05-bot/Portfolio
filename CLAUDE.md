> Last synced: 2026-10-26

# Fayz Mehmood portfolio
Next.js 16 (App Router) + TypeScript + Tailwind v4 + GSAP. Single-page video-editor portfolio modelled on a Behance reference (visual language only). See PRODUCT.md. Content lives in `src/data/`, tokens in CSS variables.

## Portrait assets (client likeness)
- Hero: `src/components/HeroFace.tsx` plays `public/portrait/face.webm` (VP9 + alpha, 542x720, 7.2s loop; grey background keyed out) with `face-poster.webp` as the still. Starts after the hero intro (3.8s); reduced motion = poster only; Safari has no VP9 alpha = poster only. `.hero-portrait` keeps the GSAP clip reveal. Portrait aspect 548/728 is also hard-coded in `--emw` (.753); 542/720 keeps it.
- About: `src/components/Turntable.tsx` blends `public/portrait/turn-{front,right,back,left}.webp` (540x1100) by angle; drag, auto-rotate, arrow keys, reduced-motion = no autoplay.
- Source art lives outside the repo (`Downloads/Minimalist Portrait Expression Storyboard.png`) and in `refernece/client/`. Never overwrite the originals.
- Unused leftovers: `Portrait.tsx`, `hero.webp`, `body.webp`, `bust.webp`, `hf-*.webp`, `eye/`, `gen/` (earlier eye-swap hero), `Turnaround` and the dead `setEyes`/`EYES` face code in `Motion.tsx`.
- Pose keyframes + ChatGPT/Gemini prompts from `Face-Only.mp4` live in `refernece/keyframes/`. `GEMINI_API_KEY` in `.env.local` has no image quota (free tier); poses were generated in the apps.

## Testing notes
Headless Chrome `--virtual-time-budget` does not run the GSAP intro or video; drive Chrome over CDP in real time instead (Node 24 has a global WebSocket; screenshot at ~6-12s after load). Scroll/drag tests need CDP. Port 3000 may be taken by another process, so `next dev` can land on :3002. Git repo (branch main); portrait/hero asset changes may be uncommitted.
