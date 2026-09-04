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
        <h1>{site.site.name}</h1>
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
          — founder, <a href="https://bedvibe.studio/" target="_blank" rel="noopener noreferrer">BedVibe Studios</a>,
          a registered Norwegian studio (org. no. 935&nbsp;267&nbsp;897).
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
