> Last synced: 2026-10-21

# Fayz Mehmood portfolio
Next.js 16 (App Router) + TypeScript + Tailwind v4 + GSAP. Single-page video-editor portfolio modelled on a Behance reference (visual language only). See PRODUCT.md. Content lives in `src/data/`, tokens in CSS variables.

## Portrait assets (client likeness)
- Hero: `src/components/HeroFace.tsx` stacks `public/portrait/hf-{base,blink,smile}.webp` (same size, aligned). Loop is CSS only (`.hf-*` in `globals.css`); `.hero-portrait` keeps the GSAP clip reveal. Portrait aspect 548/728 is also hard-coded in `--emw` (.753).
- About: `src/components/Turntable.tsx` blends `public/portrait/turn-{front,right,back,left}.webp` (540x1100) by angle; drag, auto-rotate, arrow keys, reduced-motion = no autoplay.
- Source art lives outside the repo (`Downloads/Minimalist Portrait Expression Storyboard.png`) and in `refernece/client/`. Never overwrite the originals.
- Unused leftovers: `Portrait.tsx`, `hero.webp`, `body.webp`, `bust.webp`, `Turnaround` in `Motion.tsx`.

## Testing notes
Headless Chrome: use `--force-prefers-reduced-motion` for static hero shots; the GSAP intro does not run. Scroll/drag tests need CDP. Dev server runs on :3000. Not a git repo.
