# Fayz Mehmood portfolio

Next.js (App Router) + TypeScript + Tailwind v4 + GSAP. `npm run dev` / `npm run build`.

## Sample content to replace
- Copy, tools, services, clips, contact: `src/data/site.ts` (email/phone/WhatsApp are placeholders).
- Real videos: set `src` (mp4) and `poster` (image) on a clip. No `src` = a "Sample" placeholder card.
- Hero portrait, cut-out portrait, About figure: drawn placeholders in `src/components/Portrait.tsx`.
- Set `NEXT_PUBLIC_SITE_URL` on Vercel for correct social-preview URLs.

## Where things live
- Colours/fonts/tokens: top of `src/app/globals.css` and `src/app/layout.tsx`.
- Motion (GSAP): `src/components/Motion.tsx`. Marquees are CSS. Everything respects `prefers-reduced-motion`.
