"use client";

import { useEffect, useRef } from "react";

// Portrait animation: public/portrait/face.webm is the client's generated clip with its grey background keyed out (VP9 + alpha, 542x720,
// 7.2s, starts and ends on the neutral stare so it loops). face-poster.webp is its first frame (shown until the hero intro lands, and
// for reduced motion). Browsers without VP9 alpha (Safari) keep the poster.
export function HeroFace({ className }: { className?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => v.current?.play().catch(() => {}), 3800); // the hero intro lands at ~4s
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={className} aria-hidden>
      <video ref={v} className="hf-video" muted loop playsInline preload="auto" poster="/portrait/face-poster.webp" width={542} height={720}>
        <source src="/portrait/face.webm" type="video/webm" />
      </video>
    </div>
  );
}
