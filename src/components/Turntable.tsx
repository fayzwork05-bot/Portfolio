"use client";

import { useEffect, useRef } from "react";

// Four photos a quarter-turn apart. Angle 0 = front, then clockwise seen from above: right, back, left.
const VIEWS = ["front", "right", "back", "left"] as const;
const AUTO = 16; // deg/s while idle (one full turn in ~22s)
const IDLE_MS = 1800; // wait after the last touch before auto-rotating again
const DRAG = 0.45; // deg per px dragged
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Drag-to-rotate figure. Not a 3D model: it blends the four photos by angle and narrows the figure mid-turn. */
export function Turntable({ alt, className }: { alt: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const el = root.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let angle = 0, vel = 0, last = performance.now(), idleAt = 0, dragging = false, px = 0, visible = true, raf = 0;

    const paint = () => {
      const a = ((angle % 360) + 360) % 360, i = Math.floor(a / 90), f = (a % 90) / 90;
      const lo = i % 4, hi = (i + 1) % 4;
      // Each photo holds until the quarter-turn is mostly done; only the middle fifth blends, so ghosting is brief.
      const u = smooth(Math.min(1, Math.max(0, (f - 0.4) / 0.2)));
      // Foreshortening: the figure narrows only while one photo swaps for the next.
      const sx = 1 - 0.28 * Math.sin(Math.PI * u);
      imgs.current.forEach((img, k) => {
        if (!img) return;
        img.style.opacity = k === lo ? "1" : k === hi ? String(u) : "0";
        img.style.transform = `scaleX(${sx})`;
      });
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        if (!still && now > idleAt) vel += (AUTO - vel) * Math.min(1, dt * 2); // ease back to the idle speed
        else vel *= Math.pow(0.04, dt); // inertia
        angle += vel * dt;
      }
      paint();
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

    const down = (e: PointerEvent) => { dragging = true; px = e.clientX; vel = 0; el.setPointerCapture(e.pointerId); el.dataset.drag = ""; };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const d = (e.clientX - px) * DRAG; px = e.clientX;
      angle -= d; vel = -d / Math.max(0.016, (performance.now() - last) / 1000);
      vel = Math.max(-240, Math.min(240, vel)); paint();
    };
    const up = () => { dragging = false; idleAt = performance.now() + IDLE_MS; delete el.dataset.drag; };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault(); angle += e.key === "ArrowRight" ? 15 : -15; vel = 0; idleAt = performance.now() + IDLE_MS; wake();
    };

    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake(); });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("keydown", key);
    paint(); wake();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", wake);
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div ref={root} className={className} tabIndex={0} role="img" aria-label={`${alt}. Drag, or use the left and right arrow keys, to turn the figure.`}>
      {VIEWS.map((v, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={v} ref={(n) => { imgs.current[k] = n; }} src={`/portrait/turn-${v}.webp`} alt="" width={540} height={1100} draggable={false} style={{ opacity: k === 0 ? 1 : 0 }} />
      ))}
    </div>
  );
}
