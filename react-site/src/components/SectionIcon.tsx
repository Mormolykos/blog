import React from 'react';

// Decorative glyphs that say what a section is at a glance: a reader scanning the
// index should be able to tell research from a released library without reading the
// label. Added 2026-09-17.
//
// Inline SVG, not PNG, for three reasons that are specific to this estate:
//   - every raster asset here is served from Cloudflare with a stable name and a
//     four-hour cache, which is exactly how a changed file stayed invisible for four
//     hours on 2026-09-15. A glyph compiled into the HTML has no cache of its own.
//   - stroke="currentColor" means one definition works in any theme and any context;
//     a PNG needs one file per colour.
//   - no extra request, at any viewport, at any pixel density.
//
// aria-hidden and focusable="false": the heading beside each icon already carries the
// name, so announcing the glyph would repeat it. These are never the only label.

const paths: Record<string, React.ReactNode> = {
  // Research -- a beaker. Something measured under controlled conditions.
  research: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5V3" />
      <path d="M7.2 14h9.6" />
    </>
  ),
  // Benchmarks -- bars of unequal height. A comparison, not a single number.
  benchmarks: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  // Software -- a package. These are things you can install, not things you read.
  software: (
    <>
      <path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" />
      <path d="M3 7l9 4.5L21 7" />
      <path d="M12 11.5V21" />
    </>
  ),
  // Engineering -- nodes joined into a running system.
  engineering: (
    <>
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M5 8.2V11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.2" />
      <path d="M12 13v2.8" />
    </>
  ),
  // Articles -- a written page.
  articles: (
    <>
      <path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
};

export const SectionIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      className={className ? `section-icon ${className}` : 'section-icon'}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {d}
    </svg>
  );
};
