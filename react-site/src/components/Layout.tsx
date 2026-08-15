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
      <footer>
        <a href={site.site.author.url} target="_blank" rel="noopener noreferrer">{site.site.author.name} — BedVibe Studios</a> &middot;{" "}
        <a href={site.site.author.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </footer>
    </>
  );
};
