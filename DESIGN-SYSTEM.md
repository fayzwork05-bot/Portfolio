# Fayz Mehmood portfolio: fonts, sizes and colours

Source of truth: `src/app/globals.css` (tokens at the top, "final type" block near the bottom) and `src/app/layout.tsx` (font loading).
Sizes written as `clamp(min, fluid, max)` scale with the screen width.

## Fonts

| Font | Style | Where it's loaded from |
|---|---|---|
| League Gothic | tall, thin, condensed | Google Fonts (`--font-league`) |
| Barlow Condensed | clean condensed sans, 500/600/700 | Google Fonts (`--font-barlow`) |
| Bebas Neue | condensed caps | Google Fonts (`--font-bebas`) |
| Days One | heavy, wide | Google Fonts (`--font-days`) |
| Dela Gothic One | heavy display | Google Fonts (`--font-dela`) |
| Sancreek | western blackletter | Google Fonts (`--font-sancreek`) |
| Acumin Pro | neutral grotesque | Adobe Fonts kit (`NEXT_PUBLIC_ADOBE_KIT_ID`); falls back to Helvetica / Arial |
| Anton, Bebas Neue (local) | | loaded but not used by the page |

## Type by part of the page

| Part | Font | Size | Weight |
|---|---|---|---|
| Body text, nav links, buttons, footer | Barlow Condensed | clamp(1.1rem, 1.15vw, 1.25rem) | 500 (links and buttons 700) |
| Nav logo "FAYZ MEHMOOD" | Acumin Pro | 12px | 400 |
| Hero lettering "PORTFOLIO" | League Gothic, stretched tall | clamp(3rem, ~85% of screen width, 27rem) | 400 |
| Hero captions (VIDEO EDITOR & MOTION DESIGNER) | Acumin Pro | clamp(.95rem, 1.7vw, 1.6rem) | 600 |
| Hero year "2026" | Bebas Neue | same as captions | 400 |
| Moving bars (ABOUT ME, wide bars) | Days One | 50px, tight spacing (-.09em) | 400 |
| Moving bars (other) | Days One | clamp(1.6rem, 3.6vw, 3.4rem) | 400 |
| Blackletter bar in the photo band | Sancreek | clamp(4.5rem, 10.5vw, 9.5rem) | 400 |
| Blackletter bars between video sections | Sancreek | clamp(2.4rem, 5vw, 4.6rem) | 400 |
| About: "Hello" | Acumin Pro | clamp(3rem, 7vw, 6.5rem) | 900 |
| About: sub-headings and "Hi, I'm…" | Acumin Pro | clamp(1.3rem, 2.1vw, 1.9rem) | 900 |
| About: paragraphs | Acumin Pro | 16px | 600 |
| Skills badges | Barlow Condensed | 1.8rem | 700 |
| Services title (vertical) | Dela Gothic One | clamp(4rem, 9vw, 129px) | 900 |
| Services note cards | Acumin Pro | clamp(1.05rem, 2vw, 1.8rem) | 800 |
| Contact heading | League Gothic | clamp(2.4rem, 7vw, 61px) | 400 |
| Contact paragraph | Barlow Condensed | body size | 500 |
| Video titles / client names | Barlow Condensed | .9em (client) | 700 / 500 |
| Admin page (/admin) | Acumin Pro | h1 clamp(1.6rem, 4vw, 2.4rem) | |

## Colours

| Name | Value | Used for |
|---|---|---|
| Paper | `#e4e4e4` | light page background |
| Grid line | `#dbdbdd` | 48px grid on paper sections |
| Ink | `#0c0c0c` | text on paper, nav border, dark buttons |
| Black | `#030303` | dark sections, moving bars |
| Footer black | `#000000` | footer |
| Red | `#d32a1f` | accents, hover, buttons, Services title, selection box |
| Red (bright) | `#ff5446` | red on black: focus rings, progress bars |
| Amber | `#f8a410` | Services title shadow |
| Maroon | `#2a0709` | dark red gradient behind the reels section |
| Kraft | `#d4b680` (paper grain `#dcb77c`) | Services note cards |
| Note shade | `#e0481a` | shadow under the note cards |
| Tape | `#dacb70` (tape body `#cdc55b`) | tape on the note cards |
| Muted grey | `#b8b8b8` | secondary text on black |
| White | `#ffffff` | text on black |
| Nav logo blue | `#0057ff` | "FAYZ MEHMOOD" logo |
| Portrait orange | `#ff7a1a` | border around the photo in the cut-out band |
| Video frame | `#111111` | video card backgrounds |
| Saved green | `#1a7a3a` | admin "saved" status |

Theme in short: light grey graph-paper sections alternating with near-black sections, red as the accent, kraft-paper notes in orange and amber, and one orange border on the portrait.
