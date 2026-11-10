"use client";

import { useEffect, useRef } from "react";

// About figure: public/portrait/figure-turn.webm is the client green-screen turn clip keyed to alpha (VP9 + alpha, 540x960, 8s loop, camera push-in stabilised so the figure keeps a constant size; per-pixel green-dominance key + despill, see git history).
export function Turn360({ label }: { label: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.current?.play().catch(() => {});
  }, []);
  return (
    <video ref={v} muted loop playsInline preload="auto" poster="/portrait/figure-turn-poster.webp" width={540} height={960} aria-label={label}>
      <source src="/portrait/figure-turn.webm" type="video/webm" />
    </video>
  );
}
