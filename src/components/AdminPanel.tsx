"use client";

import { useEffect, useRef, useState } from "react";
import { uploadPresigned } from "@vercel/blob/client";
import { ICON_RULES, LIMITS, TYPE_LABEL, emptyVideo, newId, uploadedCount, type About, type Content, type Section, type SectionType } from "@/lib/content";

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

export function AdminPanel({ initial, blob }: { initial: Content; blob: boolean }) {
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

  const setSection = (id: string, fn: (s: Section) => Section) => edit((c) => ({ ...c, sections: c.sections.map((s) => (s.id === id ? fn(s) : s)) }));
  // adopt only the file names the server reports; text the visitor is typing stays as it is
  const adoptFiles = (server: Content) => {
    const files = new Map(server.sections.flatMap((s) => s.videos).map((v) => [v.id, v]));
    const icons = new Map(server.about.skills.map((k) => [k.id, k.icon]));
    latest.current = {
      sections: latest.current.sections.map((s) => ({ ...s, videos: s.videos.map((v) => ({ ...v, file: files.get(v.id)?.file ?? null, poster: files.get(v.id)?.poster ?? null })) })),
      about: { ...latest.current.about, skills: latest.current.about.skills.map((k) => ({ ...k, icon: icons.get(k.id) ?? null })) },
    };
    setContent(latest.current);
  };

  const upload = async (id: string, kind: "video" | "poster" | "icon", file: File) => {
    setError("");
    if (timer.current) await save();
    await inflight.current;
    const key = id + kind;
    if (blob) return uploadToBlob(id, kind, file, key);
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
  // Vercel Blob: the browser sends the file straight to storage (a server function cannot take a big video), then the server attaches it to its slot
  const uploadToBlob = async (id: string, kind: "video" | "poster" | "icon", file: File, key: string) => {
    const ext = ({ "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[file.type];
    const allowed = kind === "video" ? ["mp4", "webm", "mov"] : kind === "icon" ? ["png"] : ["jpg", "png", "webp"];
    if (!ext || !allowed.includes(ext)) return setError(kind === "icon" ? "Icon must be a PNG." : kind === "poster" ? "Poster must be JPG, PNG or WebP." : "Video must be MP4, WebM or MOV.");
    if (file.size > (kind === "video" ? LIMITS.videoBytes : kind === "icon" ? LIMITS.iconBytes : LIMITS.posterBytes)) return setError("File is too large.");
    const name = `${id}-${Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, "0")).join("")}.${ext}`;
    setProgress((p) => ({ ...p, [key]: 0.01 }));
    try {
      await uploadPresigned(`uploads/${name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        clientPayload: JSON.stringify({ id, kind }),
        contentType: file.type,
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: (e) => setProgress((p) => ({ ...p, [key]: Math.max(0.01, e.percentage / 100) })),
      });
      const r = await fetch("/api/admin/attach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, kind, name }) });
      const body = await r.json().catch(() => ({}));
      if (r.ok) adoptFiles(body.content);
      else setError(body.error ?? "Upload failed.");
    } catch (e) {
      setError((e as Error).message || "Upload failed.");
    } finally {
      setProgress(({ [key]: _, ...rest }) => rest);
    }
  };
  const removeFile = async (id: string, kind: "video" | "poster" | "icon") => {
    if (timer.current) await save();
    const r = await fetch(`/api/admin/upload?id=${id}&kind=${kind}`, { method: "DELETE" });
    const body = await r.json().catch(() => ({}));
    if (r.ok) adoptFiles(body.content);
    else setError(body.error ?? "Could not remove the file.");
  };

  const used = uploadedCount(content);
  const full = used >= LIMITS.uploads;
  const [tab, setTab] = useState<"videos" | "about">("videos");
  const setAbout = (fn: (a: About) => About) => edit((c) => ({ ...c, about: fn(c.about) }));
  const [newType, setNewType] = useState<SectionType>("grid");
  const [newText, setNewText] = useState("");
  const addSection = () => {
    const rule = LIMITS.rules[newType];
    edit((c) => ({ ...c, sections: [...c.sections, { id: newId(), type: newType, marquee: newText.trim().toUpperCase() || "NEW SECTION", heading: "", videos: Array.from({ length: rule.min }, emptyVideo) }] }));
    setNewText("");
  };
  const move = (i: number, d: number) =>
    edit((c) => {
      const a = [...c.sections];
      [a[i], a[i + d]] = [a[i + d], a[i]];
      return { ...c, sections: a };
    });
  const signOut = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    location.reload();
  };

  return (
    <main className="adm">
      <header className="adm-top">
        <div>
          <h1>{tab === "videos" ? "Video sections" : "About section"}</h1>
          <div className="adm-tabs" role="tablist">
            <button className={"adm-btn" + (tab === "videos" ? " adm-primary" : "")} type="button" role="tab" aria-selected={tab === "videos"} onClick={() => setTab("videos")}>Video sections</button>
            <button className={"adm-btn" + (tab === "about" ? " adm-primary" : "")} type="button" role="tab" aria-selected={tab === "about"} onClick={() => setTab("about")}>About section</button>
          </div>
          {tab === "videos" && (
            <p>
              <b>{used} / {LIMITS.uploads}</b> videos uploaded.{" "}
              {full ? "Limit reached: remove a video file to upload another." : `${LIMITS.uploads - used} left.`}
            </p>
          )}
        </div>
        <div className="adm-top-r">
          <span className={"adm-status adm-" + status} role="status">{status === "saved" ? "All changes saved" : status === "saving" ? "Saving…" : "Not saved"}</span>
          <a className="adm-btn" href="/" target="_blank" rel="noreferrer">View site</a>
          <button className="adm-btn" type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>
      {error && <p className="adm-err" role="alert">{error}</p>}

      {tab === "about" && <AboutEditor about={content.about} setAbout={setAbout} progress={progress} upload={upload} removeFile={removeFile} />}

      {tab === "videos" && content.sections.map((s, i) => {
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
                onClick={() => confirm(`Delete this section and its ${n} video slot(s), including uploaded files?`) && edit((c) => ({ ...c, sections: c.sections.filter((x) => x.id !== s.id) }))}
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

      {tab === "videos" && <section className="adm-sec adm-new">
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
      </section>}
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

function AboutEditor({ about, setAbout, progress, upload, removeFile }: { about: About; setAbout: (fn: (a: About) => About) => void; progress: Record<string, number>; upload: (id: string, kind: "icon", f: File) => void; removeFile: (id: string, kind: "icon") => void }) {
  const set = <K extends keyof About>(k: K, v: About[K]) => setAbout((a) => ({ ...a, [k]: v }));
  const upd = <T,>(list: T[], i: number, patch: Partial<T>) => list.map((x, j) => (j === i ? { ...x, ...patch } : x));
  return (
    <>
      <section className="adm-sec">
        <h2>Text</h2>
        <div className="adm-row">
          <label>Big greeting<input value={about.hello} maxLength={20} onChange={(e) => set("hello", e.target.value)} /></label>
          <label>Line under it<input value={about.lead} maxLength={80} onChange={(e) => set("lead", e.target.value)} /></label>
        </div>
        <label>First paragraph<textarea value={about.intro} maxLength={600} rows={4} onChange={(e) => set("intro", e.target.value)} /></label>
        <label>Second paragraph<textarea value={about.intro2} maxLength={600} rows={3} onChange={(e) => set("intro2", e.target.value)} /></label>
      </section>

      <section className="adm-sec">
        <h2>Education</h2>
        {about.education.map((e, i) => (
          <div className="adm-video" key={i}>
            <div className="adm-row">
              <label>School / course<input value={e.what} maxLength={100} onChange={(ev) => set("education", upd(about.education, i, { what: ev.target.value }))} /></label>
              <label>Degree and years<input value={e.detail} maxLength={100} onChange={(ev) => set("education", upd(about.education, i, { detail: ev.target.value }))} /></label>
            </div>
            <button className="adm-btn adm-danger" type="button" onClick={() => set("education", about.education.filter((_, j) => j !== i))}>Delete entry</button>
          </div>
        ))}
        <button className="adm-btn" type="button" disabled={about.education.length >= LIMITS.listItems} onClick={() => set("education", [...about.education, { what: "", detail: "" }])}>Add education ({about.education.length}/{LIMITS.listItems})</button>
      </section>

      <section className="adm-sec">
        <h2>Experience</h2>
        {about.experience.map((e, i) => (
          <div className="adm-video" key={i}>
            <div className="adm-row">
              <label>Years<input value={e.when} maxLength={40} onChange={(ev) => set("experience", upd(about.experience, i, { when: ev.target.value }))} /></label>
              <label>Role<input value={e.what} maxLength={100} onChange={(ev) => set("experience", upd(about.experience, i, { what: ev.target.value }))} /></label>
            </div>
            <label>Details<textarea value={e.detail} maxLength={300} rows={2} onChange={(ev) => set("experience", upd(about.experience, i, { detail: ev.target.value }))} /></label>
            <button className="adm-btn adm-danger" type="button" onClick={() => set("experience", about.experience.filter((_, j) => j !== i))}>Delete entry</button>
          </div>
        ))}
        <button className="adm-btn" type="button" disabled={about.experience.length >= LIMITS.listItems} onClick={() => set("experience", [...about.experience, { when: "", what: "", detail: "" }])}>Add experience ({about.experience.length}/{LIMITS.listItems})</button>
      </section>

      <section className="adm-sec">
        <h2>Skills</h2>
        <p className="adm-note">Icon rules: {ICON_RULES} Without an icon the badge shows the short letters instead.</p>
        <ul className="adm-videos">
          {about.skills.map((k, i) => (
            <li className="adm-video" key={k.id}>
              <div className="adm-row">
                <label>Name<input value={k.name} maxLength={40} onChange={(e) => set("skills", upd(about.skills, i, { name: e.target.value }))} /></label>
                <label>Letters (no icon)<input value={k.abbr} maxLength={3} onChange={(e) => set("skills", upd(about.skills, i, { abbr: e.target.value }))} /></label>
                <label>Letter colour<input type="color" value={k.color} onChange={(e) => set("skills", upd(about.skills, i, { color: e.target.value }))} /></label>
              </div>
              <div className="adm-files">
                {k.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="adm-icon" src={k.icon.startsWith("/") ? k.icon : `/media/${k.icon}`} alt="" width={64} height={64} />
                )}
                <File label="Icon" accept="image/png" current={k.icon} progress={progress[k.id + "icon"]} hint="PNG, square" onPick={(f) => upload(k.id, "icon", f)} onRemove={() => removeFile(k.id, "icon")} />
                <button className="adm-btn adm-danger" type="button" onClick={() => set("skills", about.skills.filter((s) => s.id !== k.id))}>Delete skill</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="adm-btn" type="button" disabled={about.skills.length >= LIMITS.skills} onClick={() => set("skills", [...about.skills, { id: newId(), name: "", abbr: "", color: "#ffffff", icon: null }])}>Add skill ({about.skills.length}/{LIMITS.skills})</button>
      </section>
    </>
  );
}
