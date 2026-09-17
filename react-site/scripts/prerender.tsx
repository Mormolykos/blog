import crypto from 'crypto';
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

// Content hash of the stylesheet, so a changed stylesheet ships on a URL no CDN has
// seen before. See the note above buildHead: Cloudflare holds /style.css for four
// hours, and the deploy reports success the whole time.
const stylePath = path.join(distDir, 'style.css');
const styleVersion = fs.existsSync(stylePath)
  ? crypto.createHash('sha256').update(fs.readFileSync(stylePath)).digest('hex').slice(0, 10)
  : '';
if (!styleVersion) {
  throw new Error('dist/style.css missing after the public/ copy — the build would ship unstyled pages');
}

function renderPage(route: string, Component: React.FC) {
  const headHtml = buildHead(route, styleVersion);
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
// Category pages are routes with no articles[] entry by design, so they are excluded
// here rather than left to warn on every build -- a warning that always fires is one
// nobody reads, and this one exists to catch a typo'd path in site-data.
const notArticleRoutes = new Set(['/', '/articles/', ...site.categories.map(c => c.path)]);
const unlisted = Object.keys(routes).filter(
  r => !notArticleRoutes.has(r) && !site.articles.some(a => a.path === r));
if (unlisted.length) {
  console.warn(`  NOTE: routed but not listed in site-data: ${unlisted.join(', ')}`);
}

// Three ways the category layer can ship something wrong and still build, so all three
// throw. A category with no route is a nav link and a sitemap URL pointing at a 404. A
// category id on an article that no category declares silently drops that article out of
// every section page while it still counts in the archive. A declared category with no
// members renders a page that says nothing and enters the sitemap anyway.
const declaredCategoryIds = new Set(site.categories.map(c => c.id));
const categoriesWithoutRoute = site.categories.filter(c => !(c.path in routes)).map(c => c.path);
if (categoriesWithoutRoute.length) {
  throw new Error(`site-data declares categories with no route in src/routes.ts: ${categoriesWithoutRoute.join(', ')}`);
}
const unknownCategory = site.articles
  .filter(a => a.category && !declaredCategoryIds.has(a.category))
  .map(a => `${a.path} -> "${a.category}"`);
if (unknownCategory.length) {
  throw new Error(`articles carry a category no category declares: ${unknownCategory.join(', ')}`);
}
const emptyCats = site.categories
  .filter(c => !site.articles.some(a => a.category === c.id))
  .map(c => c.id);
if (emptyCats.length) {
  throw new Error(`categories with no articles would render an empty page: ${emptyCats.join(', ')}`);
}

// Sitemap + llms.txt are generated from the data, so new articles need no edits here.
//
// lastmod is each article's own date_modified. Without it Google gets no freshness
// signal at all and has no reason to re-crawl -- all 27 URLs shipped bare until
// 2026-09-07. Home and the article index both re-render whenever an article lands,
// so they carry the newest article's date rather than a date of their own.
const newestModified = site.articles
  .map(a => a.date_modified)
  .filter(Boolean)
  .sort()
  .at(-1);
if (!newestModified) {
  throw new Error('no article carries date_modified; sitemap lastmod would be invented');
}
// A category page re-renders whenever an article in it changes, so it carries the
// newest date of its own members rather than the site-wide one -- a section nothing
// has landed in for a month should not claim to be as fresh as the front page.
const sitemapEntries = [
  { loc: site.site.base_url, lastmod: newestModified },
  { loc: `${site.site.base_url}articles/`, lastmod: newestModified },
  ...site.categories.map(c => {
    const members = site.articles.filter(a => a.category === c.id).map(a => a.date_modified).sort();
    return { loc: c.canonical, lastmod: members.at(-1) ?? newestModified };
  }),
  ...site.articles.map(a => ({ loc: a.canonical, lastmod: a.date_modified })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(e => `  <url><loc>${e.loc}</loc><lastmod>${e.lastmod}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

// Sectioned to match the site. The flat "## Articles" list said the 25 pieces were one
// kind of thing, which is the same claim the /articles/ bucket used to make in HTML.
// Uncategorised articles are still listed -- being outside a section must never mean
// being dropped from the file.
const uncategorised = site.articles.filter(a => !a.category);
const llms = `# ${site.site.name}

${site.site.tagline}

Author: ${site.site.author.name} (${site.site.author.url})
Publisher: BedVibe Studios (${site.site.org_url})
Full archive, newest first: ${site.site.base_url}articles/ (${site.articles.length} articles)

${site.categories.map(c => {
  const items = site.articles.filter(a => a.category === c.id);
  return `## ${c.label} — ${c.canonical}

${c.description}

${items.map(a => `- [${a.title}](${a.canonical}) — ${a.dek}`).join('\n')}`;
}).join('\n\n')}
${uncategorised.length ? `
## Other pages

${uncategorised.map(a => `- [${a.title}](${a.canonical}) — ${a.dek}`).join('\n')}
` : ''}
## Projects
${site.projects.map(p => `- ${p.name}${p.current_version ? ` v${p.current_version}` : ''}: ${p.tagline} (Repo: ${p.repo})`).join('\n')}
`;
fs.writeFileSync(path.join(distDir, 'llms.txt'), llms, 'utf8');

console.log('Prerender complete.');
