// SAMPLE portrait: a drawn placeholder. Replace with Fayz's own illustration or cut-out photo.
// `line`  = ink line-art head and neck for the hero lockup (eyes are animated by HeroMotion via data-l / data-r).
// `color` = flat-colour bust with a red cut-out halo for the black band.

const ink = "#0c0c0c";

// Curly hair: an outer ring of big curls plus an inner ring to fill the mass.
const curls = [
  ...Array.from({ length: 26 }, (_, i) => {
    const a = Math.PI * (1.02 + (i / 25) * 0.96);
    return { x: 200 + Math.cos(a) * 104, y: 196 + Math.sin(a) * 122, r: 24 + ((i * 7) % 8) };
  }),
  ...Array.from({ length: 16 }, (_, i) => {
    const a = Math.PI * (1.1 + (i / 15) * 0.8);
    return { x: 200 + Math.cos(a) * 66, y: 190 + Math.sin(a) * 86, r: 26 + ((i * 5) % 6) };
  }),
];

function Eye({ side, x }: { side: "l" | "r"; x: number }) {
  return (
    <g className={`eye eye-${side}`} transform={`translate(${x} 222)`}>
      <ellipse className="e-w" rx="14" ry="10" fill="#fff" stroke={ink} strokeWidth="3" />
      <circle className="e-p" r="6.2" fill={ink} />
      <path className="e-lid" d="M-15-11H15V-1.5C8-4 -8-4 -15-1.5Z" fill="var(--face)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path className="e-x" d="M-14 3Q0-9 14 3" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

export function Portrait({ variant = "line", className }: { variant?: "line" | "color"; className?: string }) {
  const color = variant === "color";
  const skin = color ? "#c98a5e" : "#ececed";
  const hair = color ? "#1c120c" : ink;
  return (
    <svg
      viewBox={color ? "0 0 400 480" : "60 34 280 374"}
      className={className}
      role="img"
      aria-label="Sample portrait placeholder"
      style={{ "--face": skin } as React.CSSProperties}
    >
      {color && (
        <defs>
          <filter id="halo" x="-15%" y="-15%" width="130%" height="130%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="14" result="grow" />
            <feFlood floodColor="#d32a1f" />
            <feComposite in2="grow" operator="in" result="red" />
            <feMerge>
              <feMergeNode in="red" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g filter={color ? "url(#halo)" : undefined}>
        {color ? (
          <>
            <path d="M14 480c8-92 84-124 150-132l36 10 36-10c66 8 142 40 150 132z" fill="#15110f" />
            <path d="M166 300h68v62c-14 16-54 16-68 0z" fill="#b97b52" />
          </>
        ) : (
          <g fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round">
            <path d="M166 318c0 26-4 52-12 88" />
            <path d="M234 318c0 26 4 52 12 88" />
          </g>
        )}
        <ellipse cx="108" cy="228" rx="14" ry="26" fill={skin} stroke={color ? "none" : ink} strokeWidth="5" />
        <ellipse cx="292" cy="228" rx="14" ry="26" fill={skin} stroke={color ? "none" : ink} strokeWidth="5" />
        <path d="M112 196c0 78 36 130 88 130s88-52 88-130c0-62-36-96-88-96s-88 34-88 96z" fill={skin} stroke={color ? "none" : ink} strokeWidth="6" />
        {curls.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={hair} />
        ))}
        <path d="M118 176c16-30 124-30 164 0 0-44-34-72-82-72s-82 28-82 72z" fill={hair} />
        <g fill="none" stroke={ink} strokeLinecap="round">
          <path d="M138 196q22-12 44-2M218 194q22-10 44 2" strokeWidth="6" />
          <path d="M129 222L112 218M271 222L288 218" strokeWidth="5" />
          <circle cx="160" cy="222" r="32" strokeWidth="6" />
          <circle cx="240" cy="222" r="32" strokeWidth="6" />
          <path d="M192 218q8-6 16 0" strokeWidth="5" />
          <path d="M194 268q-6 10 2 14q6 2 10 0" strokeWidth="4" />
          <path d="M170 304q30 14 60 0" strokeWidth="5" />
          <path d="M180 312q20 8 40 0" strokeWidth="3" />
        </g>
        <Eye side="l" x={160} />
        <Eye side="r" x={240} />
      </g>
    </svg>
  );
}

// SAMPLE full-body silhouette for the About selection box.
export function Figure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 480" className={className} role="img" aria-label="Sample full-body photo placeholder">
      <circle cx="100" cy="56" r="40" fill="#1c120c" />
      <ellipse cx="100" cy="66" rx="30" ry="36" fill="#c98a5e" />
      <path d="M60 120h80l16 150h-26l-6 200h-34l-6-130-6 130H42l-6-200H44z" fill="#15110f" />
      <path d="M52 124h96l8 100H44z" fill="#d32a1f" />
    </svg>
  );
}
