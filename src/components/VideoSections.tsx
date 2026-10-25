import type { Clip } from "@/data/site";
import type { Content, Section, Video } from "@/lib/content";
import { Marquee } from "./Marquee";
import { VideoCard } from "./VideoCard";
import { FeatureVideo, ReelGroup } from "./Players";

const toClip = (v: Video, ratio: Clip["ratio"], i: number): Clip => ({
  id: v.id,
  title: v.title || "Untitled",
  client: v.client,
  ratio,
  hue: (i * 47 + 8) % 360,
  src: v.file ? `/media/${v.file}` : undefined,
  poster: v.poster ? `/media/${v.poster}` : undefined,
});

function Body({ s }: { s: Section }) {
  if (s.type === "full")
    return (
      <>
        <div className="features">
          {s.videos.map((v, i) => (
            <FeatureVideo key={v.id} clip={toClip(v, "16:9", i)} />
          ))}
        </div>
      </>
    );
  if (s.type === "reels")
    return (
      <div className="wrap reels">
        <ReelGroup clips={s.videos.map((v, i) => toClip(v, "9:16", i)) as [Clip, Clip]} />
      </div>
    );
  return (
    <div className="wrap wides">
      {s.videos.map((v, i) => (
        <VideoCard key={v.id} clip={toClip(v, "16:9", i)} />
      ))}
    </div>
  );
}

/** Every video section on the page, in the order set in the admin panel (/admin). */
export function VideoSections({ sections }: Pick<Content, "sections">) {
  return (
    <>
      {sections.map((s, i) => (
        <section
          key={s.id}
          id={i === 0 ? "work" : undefined}
          className={(s.type === "reels" ? "maroon work-sec" : s.type === "grid" ? "black work-sec" : "black reel")}
          aria-label={s.marquee}
        >
          <Marquee
            texts={[s.marquee || " "]}
            className={(s.type === "full" ? "band band-wide" : "band band-fraktur-sm") + (i ? " band-line" : "")}
            reverse={i % 2 === 1}
          />
          <Body s={s} />
        </section>
      ))}
    </>
  );
}
