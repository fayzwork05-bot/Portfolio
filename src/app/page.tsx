import { Nav } from "@/components/Nav";
import { VideoSections } from "@/components/VideoSections";
import { getContent } from "@/lib/store";
import { GlitchWord, RollYear, BlurDefs } from "@/components/GlitchWord";
import { HeroFace } from "@/components/HeroFace";
import { Turntable } from "@/components/Turntable";
import { Marquee } from "@/components/Marquee";
import { VideoCard } from "@/components/VideoCard";
import { Sunburst, PlayTile, Sparkle, Quatrefoil, Arrow } from "@/components/Glyphs";
import { HeroMotion, ScrubMarquee, DropIn } from "@/components/Motion";
import { MountainRim, tearMask } from "@/lib/tear";
import { site, tools, services, experience, education, showreel, reels, commercial, youtube } from "@/data/site";

const tear = (seed: number, flip = false) => ({ "--tear": tearMask(seed, flip) }) as React.CSSProperties;

export default async function Home() {
  const content = await getContent();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        {/* HERO */}
        <section id="top" className="paper hero">
          <h1 className="sr-only">
            Portfolio of {site.name}, {site.role}
          </h1>
          <BlurDefs count={12} />
          <HeroMotion className="hero-inner hero-desk">
            <p className="hero-cap hero-cap-top hero-fade">{site.role}</p>
            <p className="hero-year">
              <RollYear text={site.year} />
            </p>
            <div className="lockup" aria-hidden>
              <GlitchWord text="PORTF" />
              <HeroFace className="hero-portrait" />
              <GlitchWord text="LIO" />
            </div>
            <p className="hero-cap hero-cap-bottom hero-fade">{site.role}</p>
            <div className="trio hero-fade" aria-hidden>
              <span className="tr tr-burst">
                <Sunburst />
              </span>
              <span className="tr tr-mid">
                <Sparkle className="m-spark" />
                <PlayTile className="m-tile" />
              </span>
              <span className="tr tr-clover">
                <Quatrefoil />
              </span>
            </div>
          </HeroMotion>
          {/* phones only */}
          <div className="mhero" aria-hidden>
            <p className="mhero-cap">{site.role.split(" &")[0]}</p>
            <p className="mhero-title">
              PORTF
              <br />
              OLIO
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mhero-face" src="/portrait/ink.webp" alt="" width={1130} height={955} />
            <Sparkle className="mhero-spark" />
            <Quatrefoil className="mhero-club" />
            <p className="mhero-cap2">
              <i />
              {site.role.split(" &")[0]}
              <i />
            </p>
          </div>
        </section>

        <Marquee texts={["ABOUT ME"]} className="band band-wide" />

        {/* ABOUT */}
        <section id="about" className="paper about over tear-b" style={tear(3)}>
          <div className="about-grid">
            <div className="about-figure">
              <div className="selbox">
                <Turntable className="selbox-turn" alt={`${site.name}, full length`} />
                <i className="h h-tl" />
                <i className="h h-tr" />
                <i className="h h-bl" />
                <i className="h h-br" />
                <i className="h h-tm" />
                <i className="h h-bm" />
              </div>
            </div>
            <div className="about-copy">
              <h2 className="h-hello">Hello</h2>
              <p className="about-lead">Hi, I&rsquo;m {site.name}.</p>
              <p>{site.intro}</p>
              <p>{site.intro2}</p>
              <h3 className="h-sub">Education</h3>
              {education.map((e) => (
                <p key={e.what} className="about-line">
                  {e.what}
                  <br />
                  {e.detail}
                </p>
              ))}
            </div>
            <div className="about-side">
              <h3 className="h-sub">Skills</h3>
              <ul className="tools">
                {tools.map((t) => (
                  <li key={t.abbr} aria-label={t.name} title={t.name} style={{ "--tool": t.color } as React.CSSProperties}>
                    {"img" in t ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.img} alt="" width={459} height={465} />
                    ) : (
                      t.abbr
                    )}
                  </li>
                ))}
              </ul>
              <h3 className="h-sub">Experience</h3>
              {experience.map((e) => (
                <p key={e.when} className="about-line">
                  {e.when}
                  <br />
                  {e.what}
                  <br />
                  {e.detail}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* CUT-OUT BAND */}
        <section className="black cutout" aria-label={site.role}>
          <MountainRim seed={5} />
          <ScrubMarquee className="cutout-band" distance={28}>
            <Marquee texts={["VIDEO EDITOR", "MOTION DESIGNER"]} className="band-fraktur" repeat={3} />
          </ScrubMarquee>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cutout-photo" src="/portrait/graphic-novel.webp" alt={`${site.name}, portrait`} width={1214} height={1135} loading="lazy" />
        </section>

        {/* SERVICES */}
        <section id="services" className="paper services over tear-t" style={tear(7, true)}>
          <h2 className="services-title">Services</h2>
          <DropIn className="notes-wrap">
            <ul className="notes">
              {services.map((s) => (
                <li className="note" key={s}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sticker.webp" alt="" width={1156} height={1360} loading="lazy" />
                  <p>{s}</p>
                </li>
              ))}
            </ul>
          </DropIn>
        </section>

        {/* VIDEO SECTIONS: managed at /admin */}
        <VideoSections sections={content.sections} />

        {/* CONTACT */}
        <section id="contact" className="black contact">
          <Marquee texts={["LET'S WORK TOGETHER"]} className="band band-wide band-line" />
          <div className="wrap contact-body">
            <h2>Have a video in mind?</h2>
            <p>Send the brief, the footage and the deadline. I reply within one working day.</p>
            <div className="contact-actions">
              <a className="btn btn-red btn-big" href={`mailto:${site.email}`}>
                {site.email} <Arrow />
              </a>
              <a className="btn btn-paper btn-big" href={site.whatsapp}>
                WhatsApp {site.phone} <Arrow />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="foot">
        <span>
          &copy; {site.year} {site.name}
        </span>
        <a href="#top">Back to top</a>
      </footer>
    </>
  );
}
