import React from 'react';
import { site } from '../data/site';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <header>
        <a className="corner-link" href={site.site.corner_link.href} target="_blank" rel="noopener noreferrer">
          {site.site.corner_link.label}
        </a>
        <a href="/"><img src="/Bedvibe-logo.webp" alt="BedVibe Studios" className="logo" /></a>
        {/* Not an <h1>. Until 2026-09-17 this was one, on all 32 pages: it made the site
            name the first heading of every article and the ONLY heading of /articles/,
            /research/, /benchmarks/, /software/ and /engineering/ -- five pages whose
            strongest on-page signal said "BedVibe Studios — Engineering" instead of what
            the page is about. The site name belongs in the header, not in the heading
            outline; each page's own subject is now its h1. */}
        <p className="site-title">{site.site.name}</p>
      </header>
      <nav>
        {site.site.nav.map((item, i) => (
          <React.Fragment key={item.label}>
            <a href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}>
              {item.label}
            </a>
            {i < site.site.nav.length - 1 && " · "}
          </React.Fragment>
        ))}
      </nav>
      <main>
        {children}
      </main>
      {/* Every external post — dev.to, Reddit, HN — links here rather than pasting a
          link list into someone else's community. So this footer is the one place
          that has to carry the name, the company and the way back to everything.
          See PROTOCOL.md, "Every technical post carries the byline". */}
      <footer>
        <div>
          <a href={site.site.author.url} target="_blank" rel="noopener noreferrer">
            <strong>{site.site.author.name}</strong>
          </a>{" "}
          — founder, <a href="https://bedvibe.studio/" target="_blank" rel="noopener noreferrer">{site.site.org.name}</a>,
          the operating brand of <strong>{site.site.org.legal_name}</strong>, a sole proprietorship
          registered in Norway (org. no. {site.site.org.org_number.replace(/ /g, ' ')}).
        </div>
        <div style={{ marginTop: '0.6rem' }}>
          <a href="https://bedvibe.studio/" target="_blank" rel="noopener noreferrer">Main hub</a> &middot;{" "}
          <a href="https://tts.bedvibe.studio/portfolio/" target="_blank" rel="noopener noreferrer">Portfolio</a> &middot;{" "}
          <a href="/work/">Work</a> &middot;{" "}
          <a href="/">Research &amp; articles</a> &middot;{" "}
          <a href={site.site.author.url} target="_blank" rel="noopener noreferrer">About</a> &middot;{" "}
          <a href={site.site.author.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> &middot;{" "}
          <a href="https://github.com/Mormolykos" target="_blank" rel="noopener noreferrer">GitHub</a> &middot;{" "}
          <a href="https://orcid.org/0009-0007-3805-170X" target="_blank" rel="noopener noreferrer">ORCID</a>
        </div>
        <div style={{ marginTop: '0.6rem' }}>
          <a href="https://bedvibe.studio/#audit" target="_blank" rel="noopener noreferrer">
            Independent adversarial audits of AI information systems
          </a>{" "}
          — fixed scope, every finding with a reproduction.
        </div>
      </footer>
    </>
  );
};
