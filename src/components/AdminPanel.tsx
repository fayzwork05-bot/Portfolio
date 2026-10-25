"use client";

import { useEffect, useRef, useState } from "react";
import { LIMITS, TYPE_LABEL, emptyVideo, newId, uploadedCount, type Content, type Section, type SectionType } from "@/lib/content";

const mb = (n: number) => `${n / 1024 / 1024} MB`;

export function AdminLogin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.reload();
    else setErr((await r.json().catch(() => ({}))).error ?? "Could not sign in.");
  };
  return (
    <main className="adm adm-narrow">
      <h1>Admin</h1>
      <form onSubmit={submit} className="adm-form">
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        <button className="adm-btn adm-primary" type="submit">Sign in</button>
        {err && <p className="adm-err" role="alert">{err}</p>}
      </form>
    </main>
  );
}

type Status = "saved" | "saving" | "error";

export function AdminPanel({ initial }: { initial: Content }) {
  const [content, setContent] = useState(initial);
  const [status, setStatus] = useState<Status>("saved");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const latest = useRef(content);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef<Promise<void>>(Promise.resolve());

  const save = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    setStatus("saving");
    inflight.current = inflight.current.then(async () => {
      const r = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: latest.current }) });
      if (r.ok) {
        setStatus("saved");
        setError("");
      } else {
        setStatus("error");
        setError((await r.json().catch(() => ({}))).error ?? "Could not save.");
      }
    });
    return inflight.current;
  };
  // every edit saves itself 0.7s after the last keystroke
  const edit = (fn: (c: Content) => Content) => {
    latest.current = fn(latest.current);
    setContent(latest.current);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const setSection = (id: string, fn: (s: Section) => Section) => edit((c) => ({ sections: c.sections.map((s) => (s.id === id ? fn(s) : s)) }));
  // adopt only the file names the server reports; text the visitor is typing stays as it is
  const adoptFiles = (server: Content) => {
    const files = new Map(server.sections.flatMap((s) => s.videos).map((v) => [v.id, v]));
    latest.current = { sections: latest.current.sections.map((s) => ({ ...s, videos: s.videos.map((v) => ({ ...v, file: files.get(v.id)?.file ?? null, poster: files.get(v.id)?.poster ?? null })) })) };
    setContent(latest.current);
  };

  const upload = async (id: string, kind: "video" | "poster", file: File) => {
    setError("");
    if (timer.current) await save();
    await inflight.current;
    const key = id + kind;
    await new Promise<void>((done) => {
      const x = new XMLHttpRequest();
      x.open("PUT", `/api/admin/upload?id=${id}&kind=${kind}`);
      x.setRequestHeader("Content-Type", file.type);
      x.upload.onprogress = (e) => e.lengthComputable && setProgress((p) => ({ ...p, [key]: e.loaded / e.total }));
      x.onloadend = () => {
        setProgress(({ [key]: _, ...rest }) => rest);
        let body: { content?: Content; error?: string } = {};
        try {
          body = JSON.parse(x.responseText);
        } catch {}
        if (x.status === 200 && body.content) adoptFiles(body.content);
        else setError(body.error ?? "Upload failed.");
        done();
      };
      x.send(file);
    });
  };
  const removeFile = async (id: string, kind: "video" | "poster") => {
    if (timer.current) await save();
    const r = await fetch(`/api/admin/upload?id=${id}&kind=${kind}`, { method: "DELETE" });
    const body = await r.json().catch(() => ({}));
    if (r.ok) adoptFiles(body.content);
    else setError(body.error ?? "Could not remove the file.");
  };

  const used = uploadedCount(content);
  const full = used >= LIMITS.uploads;
  const [newType, setNewType] = useState<SectionType>("grid");
  const [newText, setNewText] = useState("");
  const addSection = () => {
    const rule = LIMITS.rules[newType];
    edit((c) => ({ sections: [...c.sections, { id: newId(), type: newType, marquee: newText.trim().toUpperCase() || "NEW SECTION", heading: "", videos: Array.from({ length: rule.min }, emptyVideo) }] }));
    setNewText("");
  };
  const move = (i: number, d: number) =>
    edit((c) => {
      const a = [...c.sections];
      [a[i], a[i + d]] = [a[i + d], a[i]];
      return { sections: a };
    });
  const signOut = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    location.reload();
  };

  return (
    <main className="adm">
      <header className="adm-top">
        <div>
          <h1>Video sections</h1>
          <p>
            <b>{used} / {LIMITS.uploads}</b> videos uploaded.{" "}
            {full ? "Limit reached: remove a video file to upload another." : `${LIMITS.uploads - used} left.`}
          </p>
        </div>
        <div className="adm-top-r">
          <span className={"adm-status adm-" + status} role="status">{status === "saved" ? "All changes saved" : status === "saving" ? "Saving…" : "Not saved"}</span>
          <a className="adm-btn" href="/" target="_blank" rel="noreferrer">View site</a>
          <button className="adm-btn" type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>
      {error && <p className="adm-err" role="alert">{error}</p>}

      {content.sections.map((s, i) => {
        const rule = LIMITS.rules[s.type];
        const n = s.videos.length;
        return (
          <section className="adm-sec" key={s.id}>
            <div className="adm-sec-head">
              <span className="adm-tag">{TYPE_LABEL[s.type]}</span>
              <span className="adm-spacer" />
              <button className="adm-btn" type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move section up">↑</button>
              <button className="adm-btn" type="button" disabled={i === content.sections.length - 1} onClick={() => move(i, 1)} aria-label="Move section down">↓</button>
              <button
                className="adm-btn adm-danger"
                type="button"
                onClick={() => confirm(`Delete this section and its ${n} video slot(s), including uploaded files?`) && edit((c) => ({ sections: c.sections.filter((x) => x.id !== s.id) }))}
              >
                Delete section
              </button>
            </div>
            <div className="adm-row">
              <label>
                Running text
                <input value={s.marquee} maxLength={60} onChange={(e) => setSection(s.id, (x) => ({ ...x, marquee: e.target.value }))} />
              </label>
              {s.type === "full" && (
                <label>
                  Big heading (optional)
                  <input value={s.heading} maxLength={40} onChange={(e) => setSection(s.id, (x) => ({ ...x, heading: e.target.value }))} />
                </label>
              )}
            </div>

            <ul className="adm-videos">
              {s.videos.map((v, k) => (
                <li key={v.id} className="adm-video">
                  <div className="adm-row">
                    <label>
                      Title
                      <input value={v.title} maxLength={80} onChange={(e) => setSection(s.id, (x) => ({ ...x, videos: x.videos.map((y) => (y.id === v.id ? { ...y, title: e.target.value } : y)) }))} />
                    </label>
                    <label>
                      Client / label
                      <input value={v.client} maxLength={80} onChange={(e) => setSection(s.id, (x) => ({ ...x, videos: x.videos.map((y) => (y.id === v.id ? { ...y, client: e.target.value } : y)) }))} />
                    </label>
                  </div>
                  <div className="adm-files">
                    <File label={`Video ${k + 1}`} accept="video/mp4,video/webm,video/quicktime" current={v.file} progress={progress[v.id + "video"]} disabled={!v.file && full} hint={`MP4, WebM or MOV, up to ${mb(LIMITS.videoBytes)}`} onPick={(f) => upload(v.id, "video", f)} onRemove={() => removeFile(v.id, "video")} />
                    <File label="Poster image (optional)" accept="image/jpeg,image/png,image/webp" current={v.poster} progress={progress[v.id + "poster"]} hint={`JPG, PNG or WebP, up to ${mb(LIMITS.posterBytes)}`} onPick={(f) => upload(v.id, "poster", f)} onRemove={() => removeFile(v.id, "poster")} />
                    <button
                      className="adm-btn adm-danger"
                      type="button"
                      disabled={n <= rule.min}
                      title={n <= rule.min ? `A ${s.type} section needs at least ${rule.min}` : "Delete this video slot"}
                      onClick={() => setSection(s.id, (x) => ({ ...x, videos: x.videos.filter((y) => y.id !== v.id) }))}
                    >
                      Delete slot
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button className="adm-btn" type="button" disabled={n >= rule.max} onClick={() => setSection(s.id, (x) => ({ ...x, videos: [...x.videos, emptyVideo()] }))}>
              Add video slot ({n}/{rule.max}
              {rule.min !== rule.max ? `, min ${rule.min}` : ""})
            </button>
          </section>
        );
      })}

      <section className="adm-sec adm-new">
        <h2>Add a section</h2>
        <div className="adm-row">
          <label>
            Type
            <select value={newType} onChange={(e) => setNewType(e.target.value as SectionType)}>
              {(Object.keys(TYPE_LABEL) as SectionType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </label>
          <label>
            Running text
            <input value={newText} maxLength={60} placeholder="e.g. WEDDING FILMS" onChange={(e) => setNewText(e.target.value)} />
          </label>
        </div>
        <button className="adm-btn adm-primary" type="button" disabled={content.sections.length >= LIMITS.sections} onClick={addSection}>
          Add section
        </button>
        <p className="adm-note">New sections start with the minimum number of empty slots. Upload videos into them below.</p>
      </section>
    </main>
  );
}

function File({ label, accept, current, progress, hint, disabled, onPick, onRemove }: { label: string; accept: string; current: string | null; progress?: number; hint: string; disabled?: boolean; onPick: (f: File) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="adm-file">
      <span className="adm-file-label">{label}</span>
      {progress !== undefined ? (
        <progress value={progress} max={1} aria-label={`Uploading ${label}`} />
      ) : current ? (
        <span className="adm-file-name">
          Uploaded <a href={`/media/${current}`} target="_blank" rel="noreferrer">preview</a>
        </span>
      ) : (
        <span className="adm-file-name adm-muted">{disabled ? "Limit reached" : "Nothing yet (sample shown)"}</span>
      )}
      <div className="adm-file-actions">
        <input ref={input} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onPick(f); }} />
        <button className="adm-btn" type="button" disabled={disabled || progress !== undefined} onClick={() => input.current?.click()}>
          {current ? "Replace" : "Upload"}
        </button>
        {current && (
          <button className="adm-btn" type="button" disabled={progress !== undefined} onClick={onRemove}>
            Remove file
          </button>
        )}
      </div>
      <span className="adm-muted adm-hint">{hint}</span>
    </div>
  );
}
