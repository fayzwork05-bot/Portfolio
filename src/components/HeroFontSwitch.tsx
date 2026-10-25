"use client";

import { useEffect, useState } from "react";

const HERO = [
  { id: "league", label: "League Gothic" },
  { id: "anton", label: "Anton" },
  { id: "bebas", label: "Bebas Neue" },
  { id: "acumin", label: "Acumin Pro" },
] as const;
const SITE = [
  { id: "default", label: "Original fonts" },
  { id: "acumin", label: "Acumin Pro" },
] as const;

const resize = () => requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
const save = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

/** Acumin has no hand-measured numbers: read cap top, baseline, widths and side bearings from the loaded font, same definitions as the per-font values in globals.css. */
async function fitAcumin() {
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!hero) return;
  const stack = getComputedStyle(hero).getPropertyValue("--hf") || "Arial";
  await document.fonts.load(`400 1000px ${stack}`, "PORTFLIO").catch(() => {});
  const c = document.createElement("canvas").getContext("2d")!;
  c.font = `400 1000px ${stack}`;
  const m = (t: string) => c.measureText(t);
  const P = m("P"), O = m("O");
  const base = (0.8 - (P.fontBoundingBoxAscent + P.fontBoundingBoxDescent) / 1000) / 2 + P.fontBoundingBoxAscent / 1000;
  const cap = P.actualBoundingBoxAscent / 1000;
  const adv = m("PORTFLIO").width / 1000;
  const k = Math.min(4, Math.max(1, adv / (2.05 * (cap + 0.04)))); // keep League Gothic's word proportion (width / height ~ 2.05)
  const v: Record<string, number> = { "--k": k, "--ct": base - cap, "--cb": base, "--adv": adv, "--lsb": -P.actualBoundingBoxLeft / 1000, "--rsb": (O.width - O.actualBoundingBoxRight) / 1000 };
  for (const n in v) hero.style.setProperty(n, String(v[n]));
  resize();
}
const unfit = () => ["--k", "--ct", "--cb", "--adv", "--lsb", "--rsb"].forEach((n) => document.querySelector<HTMLElement>(".hero")?.style.removeProperty(n));

function Pill<T extends string>({ label, options, value, onPick, className }: { label: string; options: readonly { id: T; label: string }[]; value: T; onPick: (id: T) => void; className?: string }) {
  return (
    <div className={`fswitch ${className ?? ""}`} role="group" aria-label={label}>
      <span>{label}</span>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onPick(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Design-review aid: two live font switches (hero lettering, whole site). Choices are remembered and linkable: ?font=anton, ?sitefont=acumin. */
export function HeroFontSwitch() {
  const [hero, setHero] = useState<(typeof HERO)[number]["id"]>("league");
  const [site, setSite] = useState<(typeof SITE)[number]["id"]>("default");

  useEffect(() => {
    const d = document.documentElement.dataset;
    setHero((d.heroFont as typeof hero) || "league");
    setSite((d.siteFont as typeof site) || "default");
    if (d.heroFont === "acumin") fitAcumin();
  }, []);

  const pickHero = (id: typeof hero) => {
    setHero(id);
    document.documentElement.dataset.heroFont = id;
    save("heroFont", id);
    if (id === "acumin") fitAcumin();
    else {
      unfit();
      resize();
    }
  };
  const pickSite = (id: typeof site) => {
    setSite(id);
    if (id === "default") delete document.documentElement.dataset.siteFont;
    else document.documentElement.dataset.siteFont = id;
    save("siteFont", id);
    // hero lettering uses --f-note captions: re-measure after the swap
    resize();
  };

  return (
    <>
      <Pill label="Hero font" options={HERO} value={hero} onPick={pickHero} />
      <Pill label="Site font" options={SITE} value={site} onPick={pickSite} className="fswitch-site" />
    </>
  );
}
