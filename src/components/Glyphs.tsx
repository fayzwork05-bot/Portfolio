import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

export const Club = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="7" r="4.6" />
    <circle cx="6.6" cy="14" r="4.6" />
    <circle cx="17.4" cy="14" r="4.6" />
    <path d="M12 11l-3 11h6z" />
  </svg>
);

export const Diamond = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 1l9 11-9 11L3 12z" />
  </svg>
);

const burst = Array.from({ length: 20 }, (_, i) => {
  const r = i % 2 ? 6.4 : 11.6;
  const a = (i / 20) * Math.PI * 2;
  return `${(12 + Math.sin(a) * r).toFixed(2)},${(12 - Math.cos(a) * r).toFixed(2)}`;
}).join(" ");

export const Sunburst = (p: P) => (
  <svg {...base} {...p}>
    <polygon points={burst} />
  </svg>
);

export const Clover = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="7" r="4.6" />
    <circle cx="12" cy="17" r="4.6" />
    <circle cx="7" cy="12" r="4.6" />
    <circle cx="17" cy="12" r="4.6" />
    <path d="M13 15l5 8h-3z" />
  </svg>
);

export const PlayTile = (p: P) => (
  <svg {...base} {...p}>
    <rect x="1.5" y="1.5" width="21" height="21" rx="4" />
    <path d="M9.5 7.2v9.6l8-4.8z" fill="var(--paper)" />
  </svg>
);

export const PlayArrow = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 4v16l14-8z" />
  </svg>
);

export const Arrow = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

/** Concave four-point sparkle (hero trio, centre icon at rest). */
export const Sparkle = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 .5C12.8 7.6 16.4 11.2 23.5 12 16.4 12.8 12.8 16.4 12 23.5 11.2 16.4 7.6 12.8.5 12 7.6 11.2 11.2 7.6 12 .5Z" />
  </svg>
);

/** Four round petals, no stem (hero trio, right icon). */
export const Quatrefoil = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="6.4" r="5.4" />
    <circle cx="12" cy="17.6" r="5.4" />
    <circle cx="6.4" cy="12" r="5.4" />
    <circle cx="17.6" cy="12" r="5.4" />
    <rect x="7" y="7" width="10" height="10" />
  </svg>
);
