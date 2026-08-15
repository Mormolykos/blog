import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Layout } from '../src/components/Layout';
import { Home } from '../src/pages/Home';
import { Articles } from '../src/pages/Articles';
import { TtsproofArticle } from '../src/pages/articles/TtsproofArticle';
import { TrainproofArticle } from '../src/pages/articles/TrainproofArticle';
import { AiAuthorshipArticle } from '../src/pages/articles/AiAuthorshipArticle';
import { CorruptedDataArticle } from '../src/pages/articles/CorruptedDataArticle';
import { EosCollisionArticle } from '../src/pages/articles/EosCollisionArticle';
import { PhotopeaArticle } from '../src/pages/articles/PhotopeaArticle';
import { CanonStateArticle } from '../src/pages/articles/CanonStateArticle';
import { GreybodyArticle } from '../src/pages/articles/GreybodyArticle';
import { FemKirschArticle } from '../src/pages/articles/FemKirschArticle';
import { SpeakerDriftArticle } from '../src/pages/articles/SpeakerDriftArticle';
import { ObservationTimeArticle } from '../src/pages/articles/ObservationTimeArticle';
import { buildHead } from '../src/head/head';
import { site } from '../src/data/site';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const publicDir = path.resolve('public');
if (fs.existsSync(publicDir)) {
  for (const file of fs.readdirSync(publicDir)) {
    fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
  }
}

function renderPage(route: string, Component: React.FC) {
  const headHtml = buildHead(route);
  const element = (
    <Layout>
      <Component />
    </Layout>
  );
  const bodyHtml = renderToStaticMarkup(element);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${headHtml}
</head>
<body>
${bodyHtml}
</body>
</html>`;

  // Clean URLs: each route becomes a directory holding index.html.
  // "/" -> dist/index.html ; "/trainproof/" -> dist/trainproof/index.html
  const outDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\/+|\/+$/g, ''));
  fs.mkdirSync(outDir, { recursive: true });
  const filepath = path.join(outDir, 'index.html');
  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`Rendered ${filepath}`);
}

renderPage('/', Home);
renderPage('/articles/', Articles);
renderPage('/ttsproof/', TtsproofArticle);
renderPage('/trainproof/', TrainproofArticle);
renderPage('/ai-authorship/', AiAuthorshipArticle);
renderPage('/corrupted-training-data/', CorruptedDataArticle);
renderPage('/eos-collision/', EosCollisionArticle);
renderPage('/photopea-scripting/', PhotopeaArticle);
renderPage('/canon-state/', CanonStateArticle);
renderPage('/greybody/', GreybodyArticle);
renderPage('/speaker-drift/', SpeakerDriftArticle);
renderPage('/fem-kirsch/', FemKirschArticle);
renderPage('/observation-time/', ObservationTimeArticle);

// Every article in site-data must have a page registered above, or it is listed on
// Home/Articles and links to a 404. Catch that here rather than on the live site.
const registered = new Set(['/ttsproof/', '/trainproof/', '/ai-authorship/', '/corrupted-training-data/',
  '/eos-collision/', '/photopea-scripting/', '/canon-state/', '/greybody/',
  '/speaker-drift/', '/fem-kirsch/', '/observation-time/']);
const unrendered = site.articles.filter(a => !registered.has(a.path)).map(a => a.path);
if (unrendered.length) {
  throw new Error(`site-data lists articles with no renderPage() call: ${unrendered.join(', ')}`);
}

// Sitemap + llms.txt are generated from the data, so new articles need no edits here.
const sitemapUrls = [
  site.site.base_url,
  `${site.site.base_url}articles/`,
  ...site.articles.map(a => a.canonical),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

const llms = `# ${site.site.name}

${site.site.tagline}

## Articles
${site.articles.map(a => `- [${a.title}](${a.canonical}) — ${a.dek}`).join('\n')}

## Projects
${site.projects.map(p => `- ${p.name} v${p.current_version}: ${p.tagline} (Repo: ${p.repo})`).join('\n')}
`;
fs.writeFileSync(path.join(distDir, 'llms.txt'), llms, 'utf8');

console.log('Prerender complete.');
