import { nav, site } from "@/data/site";

export function Nav() {
  return (
    <header className="nav">
      <a className="nav-mark" href="#top" aria-label={`${site.name}, back to top`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt={site.name} width={1132} height={619} />
      </a>
      <nav aria-label="Main">
        <ul>
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href}>{n.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <a className="btn btn-ink" href="#contact">
        Hire me
      </a>
      {/* phones: menu button (details = no JS) */}
      <details className="nav-burger">
        <summary aria-label="Menu">
          <span />
          <span />
          <span />
        </summary>
        <ul>
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href}>{n.label}</a>
            </li>
          ))}
          <li>
            <a href="#contact">Hire me</a>
          </li>
        </ul>
      </details>
    </header>
  );
}
