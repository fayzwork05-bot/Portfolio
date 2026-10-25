"use client";

import { useState } from "react";
import type { Clip } from "@/data/site";
import { PosterArt } from "./PosterArt";
import { PlayArrow } from "./Glyphs";

/** Poster first, video only on click: nothing downloads until the visitor asks. Without `src` it is a sample placeholder. */
export function VideoCard({ clip, priority = false }: { clip: Clip; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const wide = clip.ratio === "16:9";
  return (
    <figure className={"vcard " + (wide ? "vcard-wide" : "vcard-tall")}>
      <div className="vcard-frame">
        {playing && clip.src ? (
          <video src={clip.src} poster={clip.poster} controls autoPlay playsInline preload="none" />
        ) : (
          <>
            {clip.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clip.poster} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
            ) : clip.src ? (
              <video src={clip.src + "#t=0.001"} preload="metadata" muted playsInline />
            ) : (
              <PosterArt hue={clip.hue} wide={wide} />
            )}
            <button
              type="button"
              className="vcard-play"
              onClick={() => clip.src && setPlaying(true)}
              aria-label={clip.src ? `Play ${clip.title}` : `${clip.title} (sample placeholder, no video yet)`}
              aria-disabled={!clip.src}
            >
              <PlayArrow />
            </button>
            {!clip.src && <span className="vcard-sample">Sample</span>}
          </>
        )}
      </div>
      <figcaption>
        <strong>{clip.title}</strong>
        <span>{clip.client}</span>
      </figcaption>
    </figure>
  );
}
