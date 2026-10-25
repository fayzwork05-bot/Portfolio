// Deterministic torn-paper edge. The path fills the area ABOVE the jagged line within a 1440x40 box.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tearPath(seed: number, drop = 0) {
  const r = rng(seed);
  let d = "M0 0H1440V" + (22 + drop);
  for (let x = 1440; x >= 0; x -= 18 + Math.floor(r() * 22)) {
    d += `L${x} ${(14 + drop + r() * 18).toFixed(1)}`;
  }
  return d + `L0 ${22 + drop}Z`;
}

/** CSS mask image: opaque above the tear, transparent below. `flip` puts the tear on the top edge instead. */
export function tearMask(seed: number, flip = false) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 40" preserveAspectRatio="none"><path d="${tearPath(seed)}" fill="#000" ${flip ? 'transform="translate(0 40) scale(1 -1)"' : ""}/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Pale fibre rim that peeks out under a tear when drawn on the surface beneath it. */
export function TearRim({ seed, flip = false }: { seed: number; flip?: boolean }) {
  return (
    <svg className={"tear-rim" + (flip ? " tear-rim-flip" : "")} viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden>
      <path d={tearPath(seed, 5)} fill="#f4f3ee" />
    </svg>
  );
}

const RIDGE_TOP = 130; // y of the section top in the 1440x240 ridge box
/** Base profile (height above the section top): high at both edges, one smooth dip in the middle. The roughness comes from the jitter below. */
const ridgeAt = (x: number) => 88 - 68 * Math.sin((Math.PI * x) / 1440) ** 1.4;

/** Rough torn-surface black ridge: broad profile plus sine and seeded jitter, smoothed with Catmull-Rom. Sits on top of a black section, so it never dips below the section top. */
export function MountainRim({ seed }: { seed: number }) {
  const r = rng(seed);
  const pts: number[][] = [];
  for (let x = 0; x <= 1440; x += 24) {
    const rough = 6 * Math.sin(x / 61) + 5 * Math.sin(x / 19 + 1) + (r() - 0.5) * 22;
    pts.push([x, RIDGE_TOP - Math.max(ridgeAt(x) + rough, 0)]);
  }
  let d = `M0 ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(i - 1, 0)], pts[i], pts[i + 1], pts[Math.min(i + 2, pts.length - 1)]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1].toFixed(1)}`;
  }
  return (
    <svg className="mountain-rim" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden>
      <path d={d + "V240H0Z"} style={{ fill: "var(--black)" }} />
    </svg>
  );
}
