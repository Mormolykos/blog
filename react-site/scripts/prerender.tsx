import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Layout } from '../src/components/Layout';
import { routes } from '../src/routes';
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

// Every route in the shared table gets a page. Adding an article means adding it
// to src/routes.ts and to site-data.json -- nothing here changes.
for (const [route, Component] of Object.entries(routes)) {
  renderPage(route, Component);
}

// Every article in site-data must have a route, or it is listed on Home/Articles
// and links to a 404. The guard reads the SAME table the pages were rendered from,
// so it cannot pass while the page is missing.
const unrendered = site.articles.filter(a => !(a.path in routes)).map(a => a.path);
if (unrendered.length) {
  throw new Error(`site-data lists articles with no route in src/routes.ts: ${unrendered.join(', ')}`);
}

// And the reverse: a route that no longer has a site-data entry is a page nothing
// links to. Not fatal -- an article can be deliberately unlisted -- but it is
// always worth seeing, because the usual cause is a typo'd path in site-data.
const unlisted = Object.keys(routes).filter(
  r => r !== '/' && r !== '/articles/' && !site.articles.some(a => a.path === r));
if (unlisted.length) {
  console.warn(`  NOTE: routed but not listed in site-data: ${unlisted.join(', ')}`);
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
${site.projects.map(p => `- ${p.name}${p.current_version ? ` v${p.current_version}` : ''}: ${p.tagline} (Repo: ${p.repo})`).join('\n')}
`;
fs.writeFileSync(path.join(distDir, 'llms.txt'), llms, 'utf8');

console.log('Prerender complete.');
