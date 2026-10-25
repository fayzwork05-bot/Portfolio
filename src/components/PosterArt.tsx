// SAMPLE poster art for placeholder videos. Deterministic from the clip's hue. Replace via `poster` on the clip.
export function PosterArt({ hue, wide }: { hue: number; wide: boolean }) {
  const w = wide ? 640 : 360;
  const h = wide ? 360 : 640;
  const bg = `hsl(${hue} 55% 16%)`;
  const mid = `hsl(${hue} 70% 38%)`;
  const hi = `hsl(${(hue + 25) % 360} 85% 62%)`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden className="poster-art">
      <rect width={w} height={h} fill={bg} />
      <circle cx={w * 0.72} cy={h * 0.32} r={Math.min(w, h) * 0.34} fill={mid} />
      <path d={`M0 ${h * 0.78}L${w} ${h * 0.5}V${h}H0z`} fill={`hsl(${hue} 60% 10%)`} />
      <rect x={w * 0.08} y={h * 0.14} width={w * 0.34} height={h * 0.035} fill={hi} />
      <rect x={w * 0.08} y={h * 0.2} width={w * 0.2} height={h * 0.035} fill={hi} opacity=".6" />
      <g stroke="#fff" strokeOpacity=".08">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${(w / 8) * i} 0V${h}`} />
        ))}
      </g>
    </svg>
  );
}
