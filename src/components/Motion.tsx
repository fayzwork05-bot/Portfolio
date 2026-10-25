"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";

// Timing below is read off the client's hero reference recording (hero.mp4, ~24fps), then tuned by hand.
// One loop = 4.87s. Times are seconds into the loop.
const LOOP = 4.87;
// Eye keyframes, deliberately sparse (one wink, one slow half-blink): wl = left-eye wink, r/l = look right/left, h = half-lidded, c = centred.
const EYES: [number, string][] = [
  [0.1, "c"], [0.65, "r"], [1.45, "c"], [1.95, "wl"], [2.45, "c"], [3.0, "l"], [3.75, "c"], [4.25, "h"], [4.55, "c"],
];
const BEAT_AT = 2.2; // the letter roll lands where the reference glitches

// Strip positions as yPercent of the 3-cell strip (one cell = 33.333%). The strip rests on its middle cell.
const REST = 0;
const DOWN = 100 / 3; // rolled one cell down: a copy has come in from the top
const BELOW = 200 / 3; // parked below the mask, nothing visible

// One tempo for EVERY rolling character, the lettering and the year digits alike. A character's index is its place in the
// sequence (the year's digits share indexes 0-3 with the first letters, so they move in step).
//  - delay: the gap between neighbours starts at TEMPO.gap and shrinks by TEMPO.ratio each step (short, and tighter toward the end)
//  - speed: each later character is TEMPO.speedUp faster than the first, so it starts slow and finishes fast
const TEMPO = { gap: 0.06, ratio: 0.8, speedUp: 0.4, count: 8 };
const slot = (i: number) => {
  let delay = 0, gap = TEMPO.gap;
  for (let k = 0; k < i; k++) { delay += gap; gap *= TEMPO.ratio; }
  const scale = 1 - (TEMPO.speedUp * Math.min(i, TEMPO.count - 1)) / (TEMPO.count - 1);
  return { delay, scale };
};
const INTRO = { dur: 1.6, ease: "power4.inOut" }; // very slow start, then it gathers speed
const ROLL = { down: 0.75, downEase: "power4.in", back: 0.32, backEase: "expo.out" };
// Motion blur: vertical smear in px = BLUR.k * (strip speed in px per frame), capped. Zero at rest.
const BLUR = { k: 0.2, max: 12, floor: 0.35 };

/** Hero: letters rise in from behind their masks, then a looping idle (eyes, letter beat, icon trio) timed to the reference. */
export function HeroMotion({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current!;
        const q = gsap.utils.selector(el);
        const rand = gsap.utils.random;
        const face = el.querySelector<SVGElement>(".hero-portrait");
        
        // ---- face eyes
        const setEyes = (s: string) => {
          if (!face) return;
          face.dataset.l = s === "wl" ? "wink" : s === "r" ? "look-r" : s === "l" ? "look-l" : s === "o" ? "wide" : s === "h" ? "half" : "open";
          face.dataset.r = s === "wl" ? "open" : face.dataset.l;
        };

        // ---- letters and year: parked below their masks, then rolled up into place one after another
        const letters = q(".gl-g"), year = q(".yr-g"), movers = [...letters, ...year];
        gsap.set(movers, { yPercent: BELOW, opacity: 1 });
        gsap.set(q(".hero-portrait"), { clipPath: "inset(100% 0% 0% 0%)" });
        gsap.set(q(".hero-fade"), { opacity: 0, y: 14 });
        gsap.set(q(".m-tile"), { opacity: 0, scale: 0.5, rotate: -25, transformOrigin: "50% 50%" });
        const intro = gsap.timeline({ delay: 0.2 });
        [letters, year].forEach((group) =>
          group.forEach((t, i) => {
            const { delay, scale } = slot(i);
            intro.to(t, { yPercent: REST, duration: INTRO.dur * scale, ease: INTRO.ease }, delay);
          }),
        );
        intro.to(q(".hero-portrait"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.0, ease: "expo.out" }, 0.9);
        intro.to(q(".hero-fade"), { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.1 }, 1.3);

        // ---- the loop's beat: each strip rolls one cell down (copy in from the top, original out the bottom),
        // then snaps back (original up from below, copy out through the top).
        const beat = gsap.timeline({ paused: true });
        [letters, year].forEach((group) =>
          group.forEach((t, i) => {
            const { delay, scale } = slot(i);
            beat.to(t, { yPercent: DOWN, duration: ROLL.down * scale, ease: ROLL.downEase }, delay);
            beat.to(t, { yPercent: REST, duration: ROLL.back * scale, ease: ROLL.backEase }, delay + ROLL.down * scale);
          }),
        );

        // ---- motion blur on the seam between the leaving letter and its incoming copy, driven by each strip's real speed
        const strips = [...letters, ...year] as HTMLElement[];
        const nodes = strips.map((_, i) => document.getElementById(`mb${i}`)?.querySelector("feGaussianBlur") ?? null);
        let heights = strips.map((t) => t.offsetHeight);
        const lastY = strips.map(() => gsap.getProperty(strips[0], "yPercent") as number);
        strips.forEach((t, i) => (lastY[i] = gsap.getProperty(t, "yPercent") as number));
        const onRefresh = () => { heights = strips.map((t) => t.offsetHeight); };
        ScrollTrigger.addEventListener("refresh", onRefresh);
        const smear = () => {
          const px = strips.map((t, i) => {
            const y = gsap.getProperty(t, "yPercent") as number;
            const v = (Math.abs(y - lastY[i]) / 100) * heights[i];
            lastY[i] = y;
            return Math.min(BLUR.max, v * BLUR.k);
          });
          strips.forEach((t, i) => {
            nodes[i]?.setAttribute("stdDeviation", `0 ${px[i].toFixed(2)}`);
            t.style.filter = px[i] > BLUR.floor ? `url(#mb${i})` : "none";
          });
        };
        gsap.ticker.add(smear);

        // ---- idle loop
        const burst = q(".tr-burst"), mid = q(".tr-mid"), spark = q(".m-spark"), tile = q(".m-tile"), clover = q(".tr-clover");
        const loop = gsap.timeline({ repeat: -1, paused: true, defaults: { immediateRender: false } });
        EYES.forEach(([t, s]) => loop.call(setEyes, [s], t));
        const toTile = (t: number) => {
          loop.fromTo(spark, { opacity: 1, scale: 1, rotate: 0 }, { opacity: 0, scale: 0.4, rotate: 90, duration: 0.16, ease: "power2.in" }, t);
          loop.fromTo(tile, { opacity: 0, scale: 0.5, rotate: -25 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.24, ease: "back.out(2.2)" }, t + 0.06);
        };
        const toSpark = (t: number) => {
          loop.fromTo(tile, { opacity: 1, scale: 1, rotate: 0 }, { opacity: 0, scale: 0.5, rotate: 25, duration: 0.14, ease: "power2.in" }, t);
          loop.fromTo(spark, { opacity: 0, scale: 0.4, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.24, ease: "back.out(1.8)" }, t + 0.05);
        };
        toTile(0.06); toSpark(0.75); toTile(0.95); toSpark(1.92);
        // clover: a quarter turn twice per loop (4 petals, so 90deg looks like a reset)
        loop.fromTo(clover, { rotate: 0 }, { rotate: 90, duration: 0.55, ease: "power2.inOut" }, 1.35);
        loop.fromTo(clover, { rotate: 0 }, { rotate: 90, duration: 1.0, ease: "power2.inOut" }, 3.4);
        // wave, left to right: burst up, sparkle up, clover dips then rises
        loop.fromTo(burst, { yPercent: 0 }, { yPercent: -55, duration: 0.4, ease: "sine.out", yoyo: true, repeat: 1 }, 3.25);
        loop.fromTo(mid, { yPercent: 0 }, { yPercent: -45, duration: 0.4, ease: "sine.out", yoyo: true, repeat: 1 }, 3.62);
        loop.fromTo(clover, { yPercent: 0 }, { yPercent: 28, duration: 0.3, ease: "sine.inOut" }, 3.3);
        loop.to(clover, { yPercent: -55, duration: 0.4, ease: "sine.out" }, 3.6);
        loop.to(clover, { yPercent: 0, duration: 0.4, ease: "sine.inOut" }, 4.0);
        loop.call(() => beat.restart(), [], BEAT_AT);
        loop.to({}, { duration: 0.001 }, LOOP - 0.001); // pad the loop to its exact length
        intro.eventCallback("onComplete", () => loop.play(0));

        const st = ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (!intro.isActive()) self.isActive ? loop.play() : loop.pause();
          },
        });
        return () => {
          st.kill(); intro.kill(); loop.kill(); beat.kill();
          gsap.ticker.remove(smear);
          ScrollTrigger.removeEventListener("refresh", onRefresh);
          strips.forEach((t) => (t.style.filter = ""));
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

/** Scrubs the marquee inside it horizontally with scroll instead of free-running. */
export function ScrubMarquee({ children, className, distance = 30 }: { children: ReactNode; className?: string; distance?: number }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const track = root.current?.querySelector(".marquee-track");
        if (!track) return;
        gsap.fromTo(
          track,
          { xPercent: 0 },
          {
            xPercent: -distance,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className={className} data-scrub="">
      {children}
    </div>
  );
}

/** Sways the figure left and right while its section scrolls past. */
export function Turnaround({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          root.current,
          { rotateY: -24 }, // a flat photo has no back: it sways instead of turning all the way round
          {
            rotateY: 24,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: "bottom 15%", scrub: 0.8 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

/** Notes pinned to the board: each drops in with a small swing the first time the grid scrolls into view. */
export function DropIn({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const notes = gsap.utils.toArray<HTMLElement>(".note", root.current);
        gsap.set(notes, { opacity: 0, y: -60, rotate: () => gsap.utils.random(-9, 9), transformOrigin: "50% 0%" });
        gsap.to(notes, {
          opacity: 1,
          y: 0,
          rotate: (i: number) => [-1.6, 1.2, -0.8, 1.5, -1.1, 0.9][i % 6],
          duration: 0.9,
          ease: "back.out(1.6)",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
