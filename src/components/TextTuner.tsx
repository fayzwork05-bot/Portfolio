"use client";

import { useEffect, useRef, useState } from "react";

// Design-review aid: click any text, change its font, weight, size and spacing live. Remove <TextTuner /> from page.tsx when the type is final.
const FONTS = [
  ["League Gothic", "var(--font-league), 'Arial Narrow', sans-serif"],
  ["Anton", "var(--font-anton), Impact, sans-serif"],
  ["Bebas Neue", "var(--font-bebas-local), 'Arial Narrow', sans-serif"],
  ["Days One", "var(--font-days), 'Arial Black', sans-serif"],
  ["Dela Gothic One", "var(--font-dela), 'Arial Black', sans-serif"],
  ["Sancreek", "var(--font-sancreek), serif"],
  ["Barlow Condensed", "var(--font-barlow), 'Arial Narrow', sans-serif"],
  ["Acumin Pro", "acumin-pro, 'Acumin Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif"],
] as const;
const KEY = "textTuner";
type Props = Record<string, string>;
type Saved = Record<string, Props>;

const pathOf = (el: Element) => {
  const parts: string[] = [];
  for (let e: Element | null = el; e && e !== document.body; e = e.parentElement)
    parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...e.parentElement!.children].indexOf(e) + 1})`);
  return "body > " + parts.join(" > ");
};
const load = (): Saved => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};
const put = (s: Saved) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
};
// letters, marquee copies and the hero caption pieces act as one element
const unit = (t: Element) => (t.closest(".lockup, .marquee") ?? t.closest("h1,h2,h3,h4,p,li,a,button,figcaption") ?? t.closest("span,div")) as HTMLElement | null;

export function TextTuner() {
  const [on, setOn] = useState(false);
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [v, setV] = useState({ family: "", weight: "400", size: 16, spacing: 0, sx: 1, sy: 1 });
  const saved = useRef<Saved>({});
  const hero = !!el?.matches(".lockup");

  const apply = (target: HTMLElement, p: Props) => {
    for (const k in p) {
      // hero lettering takes its font through --hf so its measured fit stays correct, and its size through --lock
      if (target.matches(".lockup") && k === "fontFamily") target.closest<HTMLElement>(".hero")!.style.setProperty("--hf", p[k]);
      else if (target.matches(".lockup") && k === "fontSize") continue;
      else target.style.setProperty(k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()), p[k]);
    }
  };

  useEffect(() => {
    saved.current = load();
    for (const sel in saved.current) {
      const t = document.querySelector<HTMLElement>(sel);
      if (t) apply(t, saved.current[sel]);
    }
  }, []);

  useEffect(() => {
    if (!on) return;
    const pick = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest(".tt, .fswitch")) return;
      e.preventDefault();
      e.stopPropagation();
      const u = unit(t);
      if (!u) return;
      el?.removeAttribute("data-tt-sel");
      u.setAttribute("data-tt-sel", "");
      const cs = getComputedStyle(u);
      const [sx = 1, sy = sx] = (saved.current[pathOf(u)]?.scale ?? "").split(" ").map(Number);
      setV({ sx, sy, family: "", weight: String(Math.round(+cs.fontWeight / 100) * 100), size: Math.round(parseFloat(cs.fontSize)), spacing: +(parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) || 0).toFixed(2) });
      setEl(u);
    };
    document.addEventListener("click", pick, true);
    document.body.classList.add("tt-on");
    return () => {
      document.removeEventListener("click", pick, true);
      document.body.classList.remove("tt-on");
    };
  }, [on, el]);

  const set = (patch: Partial<typeof v>, css: Props) => {
    if (!el) return;
    setV((p) => ({ ...p, ...patch }));
    apply(el, css);
    const sel = pathOf(el);
    saved.current[sel] = { ...saved.current[sel], ...css };
    put(saved.current);
    window.dispatchEvent(new Event("resize"));
  };
  // stretch uses the independent CSS `scale` property so it stacks with any transform the element already has.
  // The origin is pinned to where the text sits (its left edge, centre or right edge) so stretching never pushes the text off screen.
  const stretch = (sx: number, sy: number) => {
    if (!el) return;
    const css: Props = { scale: `${sx} ${sy}` };
    if (getComputedStyle(el).display === "inline") css.display = "inline-block";
    if (!saved.current[pathOf(el)]?.transformOrigin) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const t = range.getBoundingClientRect(), b = el.getBoundingClientRect();
      const mid = (t.left + t.right) / 2 / window.innerWidth;
      css.transformOrigin = `${(mid < 0.4 ? t.left : mid > 0.6 ? t.right : (t.left + t.right) / 2) - b.left}px 50%`;
    }
    css.translate = "none";
    set({ sx, sy }, css);
    // if the stretched text still runs past a screen edge (wide or rotated text), slide it back in
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect(), W = window.innerWidth;
    const dx = r.width > W - 16 || r.left < 8 ? 8 - r.left : r.right > W - 8 ? W - 8 - r.right : 0;
    if (dx) set({}, { translate: `${dx}px 0` });
  };
  const close = () => {
    el?.removeAttribute("data-tt-sel");
    setEl(null);
    setOn(false);
  };
  const reset = () => {
    localStorage.removeItem(KEY);
    location.reload();
  };
  const copy = () => {
    const css = Object.entries(saved.current)
      .map(([s, p]) => `${s} {\n${Object.entries(p).map(([k, x]) => `  ${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}: ${x};`).join("\n")}\n}`)
      .join("\n\n");
    navigator.clipboard?.writeText(css);
  };

  if (!on)
    return (
      <button type="button" className="tt-open" onClick={() => setOn(true)}>
        Edit text
      </button>
    );
  return (
    <div className="tt" role="group" aria-label="Text editor">
      <div className="tt-head">
        <strong>{el ? (hero ? "Hero lettering" : (el.textContent || "").trim().slice(0, 24) || el.tagName) : "Click any text"}</strong>
        <button type="button" onClick={close}>Done</button>
      </div>
      {el && (
        <>
          <label>
            Font
            <select value={v.family} onChange={(e) => set({ family: e.target.value }, { fontFamily: e.target.value })}>
              <option value="" disabled>current</option>
              {FONTS.map(([n, f]) => <option key={n} value={f}>{n}</option>)}
            </select>
          </label>
          <label>
            Weight <b>{v.weight}</b>
            <input type="range" min={100} max={900} step={100} value={v.weight} onChange={(e) => set({ weight: e.target.value }, { fontWeight: e.target.value })} />
          </label>
          {!hero && (
            <label>
              Size <b>{v.size}px</b>
              <input type="range" min={8} max={400} value={v.size} onChange={(e) => set({ size: +e.target.value }, { fontSize: e.target.value + "px" })} />
            </label>
          )}
          <label>
            Spacing <b>{v.spacing}em</b>
            <input type="range" min={-0.1} max={0.6} step={0.01} value={v.spacing} onChange={(e) => set({ spacing: +e.target.value }, { letterSpacing: e.target.value + "em" })} />
          </label>
          <label>
            Stretch width <b>{v.sx}×</b>
            <input type="range" min={0.5} max={3} step={0.05} value={v.sx} onChange={(e) => stretch(+e.target.value, v.sy)} />
          </label>
          <label>
            Stretch height <b>{v.sy}×</b>
            <input type="range" min={0.5} max={3} step={0.05} value={v.sy} onChange={(e) => stretch(v.sx, +e.target.value)} />
          </label>
        </>
      )}
      <div className="tt-foot">
        <button type="button" onClick={copy}>Copy CSS</button>
        <button type="button" onClick={reset}>Reset all</button>
      </div>
    </div>
  );
}
