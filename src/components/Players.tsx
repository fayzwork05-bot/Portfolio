"use client";

import { useEffect, useRef, useState } from "react";
import type { Clip } from "@/data/site";
import { PosterArt } from "./PosterArt";
import { PlayArrow } from "./Glyphs";

const SAMPLE_LEN = 8; // seconds each placeholder clip "plays" for, so the controls can be reviewed before real videos exist

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const Pause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

/** One timeline over a list of clips: they all play together; the bar spans the longest clip. A clip without `src` is simulated. */
function useSequence(clips: readonly Clip[]) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [durs, setDurs] = useState(() => clips.map(() => SAMPLE_LEN));
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const fake = useRef<number[]>(clips.map(() => 0)); // clock of each placeholder clip
  const total = Math.max(...durs);

  // put every clip at time t (a clip shorter than t rests on its last frame); resume the ones that still have footage
  const place = (t: number, run: boolean) => {
    clips.forEach((_, i) => {
      const at = Math.min(t, durs[i]);
      fake.current[i] = at;
      const v = vids.current[i];
      if (!v) return;
      v.currentTime = at;
      if (run && t < durs[i]) v.play().catch(() => setPlaying(false));
      else v.pause();
    });
  };

  useEffect(() => {
    if (!playing) return;
    let last = performance.now(),
      raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let e = 0,
        done = true;
      clips.forEach((c, i) => {
        const v = vids.current[i];
        const t = c.src && v ? v.currentTime : (fake.current[i] = Math.min(durs[i], fake.current[i] + dt));
        e = Math.max(e, t);
        if (!(c.src && v ? v.ended || t >= durs[i] - 0.05 : t >= durs[i])) done = false;
      });
      if (done) {
        setElapsed(total);
        setPlaying(false);
      } else {
        setElapsed(e);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, durs]);

  const toggle = () => {
    if (playing) {
      vids.current.forEach((v) => v?.pause());
      setPlaying(false);
      return;
    }
    const from = elapsed >= total - 0.05 ? 0 : elapsed; // a finished run starts over
    place(from, true);
    setElapsed(from);
    setPlaying(true);
  };

  const seek = (t: number) => {
    const at = Math.min(Math.max(t, 0), total);
    place(at, playing);
    setElapsed(at);
  };

  const videoProps = (i: number) => ({
    ref: (el: HTMLVideoElement | null) => {
      vids.current[i] = el;
    },
    preload: "metadata" as const,
    playsInline: true,
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const len = e.currentTarget.duration; // read now: currentTarget is gone by the time the updater runs
      if (Number.isFinite(len) && len > 0) setDurs((d) => d.map((x, k) => (k === i ? len : x)));
    },
  });

  return { playing, total, elapsed, toggle, seek, videoProps };
}

type Seq = ReturnType<typeof useSequence>;

function Bar({ s, label }: { s: Seq; label: string }) {
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    s.seek(((e.clientX - r.left) / r.width) * s.total);
  };
  return (
    <div
      className="seq-bar"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(s.total)}
      aria-valuenow={Math.round(s.elapsed)}
      aria-valuetext={`${fmt(s.elapsed)} of ${fmt(s.total)}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        at(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons) at(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") s.seek(s.elapsed + 5);
        if (e.key === "ArrowLeft") s.seek(s.elapsed - 5);
      }}
    >
      <i className="seq-fill" style={{ width: `${(s.elapsed / s.total) * 100}%` }} />
    </div>
  );
}

function Frame({ clip, s, i }: { clip: Clip; s: Seq; i: number }) {
  return clip.src ? (
    <video src={clip.src + "#t=0.001"} muted={clip.muted} poster={clip.poster} {...s.videoProps(i)} />
  ) : (
    <>
      {clip.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={clip.poster} alt="" />
      ) : (
        <PosterArt hue={clip.hue} wide={clip.ratio === "16:9"} />
      )}
      <span className="vcard-sample">Sample</span>
    </>
  );
}

/** Type 1: one video across the full screen width, play button in the bottom-left corner. */
export function FeatureVideo({ clip }: { clip: Clip }) {
  const s = useSequence([clip]);
  return (
    <figure className="feature">
      <div className="feature-frame">
        <Frame clip={clip} s={s} i={0} />
        <button type="button" className="feature-play" onClick={s.toggle} aria-label={`${s.playing ? "Pause" : "Play"} ${clip.title}`}>
          {s.playing ? <Pause /> : <PlayArrow />}
        </button>
        <Bar s={s} label={`${clip.title} timeline`} />
      </div>
    </figure>
  );
}

/** Type 2: two or three vertical reels that share one play button and one time bar and play together. */
export function ReelGroup({ clips }: { clips: readonly [Clip, Clip] | readonly [Clip, Clip, Clip] }) {
  const s = useSequence(clips);
  return (
    <div className="reelgrp" style={{ "--n": clips.length } as React.CSSProperties}>
      <div className="reelgrp-row">
        {clips.map((c, i) => (
          <figure key={c.id} className="reelgrp-item">
            <div className="reelgrp-frame">
              <Frame clip={c} s={s} i={i} />
            </div>
            <figcaption>
              <strong>{c.title}</strong>
              <span>{c.client}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="reelgrp-ctl">
        <button type="button" className="reelgrp-play" onClick={s.toggle} aria-label={s.playing ? "Pause reels" : "Play reels"}>
          {s.playing ? <Pause /> : <PlayArrow />}
        </button>
        <Bar s={s} label="All reels timeline" />
        <span className="reelgrp-time">
          {fmt(s.elapsed)} / {fmt(s.total)}
        </span>
      </div>
    </div>
  );
}
