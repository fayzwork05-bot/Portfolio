// Portrait layers cut from the client's storyboard artwork (public/portrait/hf-*.webp, all the same size and aligned).
// The head tilts, and the blink / smile layers fade in over the neutral frame. See `.hf-*` in globals.css.
export function HeroFace({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="hf-head">
        {/* eslint-disable @next/next/no-img-element */}
        <img src="/portrait/hf-base.webp" alt="" width={548} height={728} />
        <img className="hf-blink" src="/portrait/hf-blink.webp" alt="" width={548} height={728} />
        <img className="hf-smile" src="/portrait/hf-smile.webp" alt="" width={548} height={728} />
      </div>
    </div>
  );
}
