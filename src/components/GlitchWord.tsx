/**
 * Hero lettering. Every character is a mask (`.gl` / `.yr`) around a vertical strip (`.gl-g` / `.yr-g`) of three identical cells.
 * The strip rests on the middle cell. Rolling it one cell down brings a copy in from the top as the original leaves at the bottom;
 * rolling it back up returns the original from below while the copy leaves through the top. The mask is cut exactly to the ink,
 * so nothing ever resizes or leaves its place. Decorative: the h1 and the sr-only text carry the content.
 */
const cells = [0, 1, 2];

export function GlitchWord({ text }: { text: string }) {
  return (
    <span className="gword" aria-hidden>
      {[...text].map((ch, i) => (
        <span className="gl" key={i}>
          <span className="gl-g">
            {cells.map((c) => (
              <span className="gl-c" key={c}>
                <span className="gl-i">{ch}</span>
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/** The year, with the same rolling strips as the lettering. */
export function RollYear({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="yw" aria-hidden>
        {[...text].map((ch, i) => (
          <span className="yr" key={i}>
            <span className="yr-g">
              {cells.map((c) => (
                <span className="yr-c" key={c}>
                  <span className="yr-i">{ch}</span>
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </>
  );
}

/**
 * One vertical-only blur filter per rolling strip (#mb0, #mb1, ...). HeroMotion drives each one's stdDeviation from that strip's
 * speed, so the seam between a leaving letter and its incoming copy smears together while moving and is razor sharp at rest.
 */
export function BlurDefs({ count }: { count: number }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>
        {Array.from({ length: count }, (_, i) => (
          <filter key={i} id={`mb${i}`} x="-2%" y="-6%" width="104%" height="112%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="0 0" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
