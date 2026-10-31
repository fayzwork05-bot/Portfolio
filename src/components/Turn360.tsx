"use client";

import { useEffect, useRef } from "react";

// About figure: public/portrait/turn360.webm is the client's 360 orbit clip with the grey studio backdrop keyed out (VP9 + alpha, 450x800,
// 7s, one full turn that loops). turn360-poster.webp is its first frame, shown for reduced motion and by browsers without VP9 alpha (Safari).
export function Turn360({ label }: { label: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.current?.play().catch(() => {});
  }, []);
  return (
    <video ref={v} muted loop playsInline preload="auto" poster="/portrait/turn360-poster.webp" width={450} height={800} aria-label={label}>
      <source src="/portrait/turn360.webm" type="video/webm" />
    </video>
  );
}
