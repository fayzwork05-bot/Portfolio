import { Club, Diamond } from "./Glyphs";

/** Decorative scrolling band. The same words appear as a real heading in the section, so this is hidden from assistive tech. */
export function Marquee({ texts, className = "", reverse = false, repeat = 4 }: { texts: string[]; className?: string; reverse?: boolean; repeat?: number }) {
  const group = (
    <ul className="marquee-group">
      {Array.from({ length: repeat }, () => texts).flat().map((t, i) => (
        <li key={i}>
          <span>{t}</span>
          <Club className="mq-glyph" />
          <Diamond className="mq-glyph" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee ${className}`} aria-hidden>
      <div className={"marquee-track" + (reverse ? " reverse" : "")}>
        {group}
        {group}
      </div>
    </div>
  );
}
