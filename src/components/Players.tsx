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

/** One timeline over a list of clips: they play one after another, never together. A clip without `src` is simulated. */
function useSequence(clips: readonly Clip[]) {
  const [idx, setIdx] = useState(0);
  const [local, setLocal] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [durs, setDurs] = useState(() => clips.map(() => SAMPLE_LEN));
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const localRef = useRef(0);
  const put = (v: number) => {
    localRef.current = v;
    setLocal(v);
  };

  const total = durs.reduce((a, b) => a + b, 0);
  const elapsed = durs.slice(0, idx).reduce((a, b) => a + b, 0) + local;

  const next = () => {
    if (idx < clips.length - 1) {
      setIdx(idx + 1);
      put(0);
    } else {
      setPlaying(false);
      setIdx(0);
      put(0);
    }
  };

  // the active clip starts at `local`, every other clip is paused
  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) v.currentTime = localRef.current;
      else v.pause();
    });
  }, [idx]);

  useEffect(() => {
    const v = vids.current[idx];
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [idx, playing]);

  // placeholder clips: advance a fake clock
  useEffect(() => {
    if (!playing || clips[idx].src) return;
    let last = performance.now(),
      raf = 0;
    const tick = (now: number) => {
      put(localRef.current + (now - last) / 1000);
      last = now;
      if (localRef.current >= durs[idx]) next();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx]);

  const seek = (t: number) => {
    let rest = Math.min(Math.max(t, 0), total - 0.01),
      j = 0;
    while (j < durs.length - 1 && rest >= durs[j]) rest -= durs[j++];
    put(rest);
    if (j === idx) {
      const v = vids.current[j];
      if (v) v.currentTime = rest;
    } else setIdx(j);
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
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (i === idx) put(e.currentTarget.currentTime);
    },
    onEnded: () => {
      if (i === idx) next();
    },
  });

  return { idx, playing, total, elapsed, durs, toggle: () => setPlaying((p) => !p), seek, videoProps };
}

type Seq = ReturnType<typeof useSequence>;

function Bar({ s, marks, label }: { s: Seq; marks?: boolean; label: string }) {
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    s.seek(((e.clientX - r.left) / r.width) * s.total);
  };
  const cum = s.durs.slice(0, -1).reduce<number[]>((a, d) => [...a, (a.at(-1) ?? 0) + d], []);
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
      {marks && cum.map((c, i) => <b key={i} className="seq-mark" style={{ left: `${(c / s.total) * 100}%` }} />)}
    </div>
  );
}

function Frame({ clip, s, i }: { clip: Clip; s: Seq; i: number }) {
  return clip.src ? (
    <video src={clip.src + "#t=0.001"} poster={clip.poster} {...s.videoProps(i)} />
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

/** Type 2: two or three vertical reels that share one play button and one time bar and play in order. */
export function ReelGroup({ clips }: { clips: readonly [Clip, Clip] | readonly [Clip, Clip, Clip] }) {
  const s = useSequence(clips);
  return (
    <div className="reelgrp" style={{ "--n": clips.length } as React.CSSProperties}>
      <div className="reelgrp-row">
        {clips.map((c, i) => (
          <figure key={c.id} className={"reelgrp-item" + (s.playing && i !== s.idx ? " is-dim" : "")}>
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
        <Bar s={s} marks label="All reels timeline" />
        <span className="reelgrp-time">
          {fmt(s.elapsed)} / {fmt(s.total)}
        </span>
      </div>
    </div>
  );
}
