import { site, getArticle, getCategoryByPath, articlesInCategory } from '../data/site';
import type { Article } from '../data/types';

// Every article was BlogPosting. That is true of all of them and useful about none:
// a reproduction of a 1976 calculation with a DOI, a released library's manual and a
// CV are not the same kind of document, and the one type said so for all three.
// Chosen from the data, so an article cannot be given a category and keep the wrong
// type. /work/ is the CV -- og_type has said "profile" since it was published.
function articleType(a: Article): string {
  if (a.og_type === 'profile') return 'ProfilePage';
  if (a.category === 'research' && a.citation) return 'ScholarlyArticle';
  return 'TechArticle';
}

// Home > Section > Article. Emitted for category pages and for every article that has
// a category; the CV and anything uncategorised get Home > Page, because inventing an
// intermediate crumb that no page links through would describe a path that does not exist.
function breadcrumb(trail: { name: string; url: string }[]): string {
  return `{
      "@type": "BreadcrumbList",
      "itemListElement": [
${trail.map((t, i) => `        { "@type": "ListItem", "position": ${i + 1}, "name": "${t.name.replace(/"/g, '\\"')}", "item": "${t.url}" }`).join(',\n')}
      ]
    }`;
}

// The publisher, written out in full on every page instead of referenced by @id alone.
// Until 2026-09-17 each page emitted `"publisher": { "@id": ".../#organization" }` and
// defined that node nowhere: schema.org consumers parse a document at a time and do not
// follow an @id to another host, so the publisher was an unnamed node on all 32 pages
// and `BED VIBE GKILIS` -- the name a registry, a contracting officer or a funder starts
// from -- was absent from the markup of every one of them. The reference stays where it
// is; this adds the definition beside it, in the same @graph, so the reference resolves
// within the document.
function orgNode(): string {
  const o = site.site.org;
  return `{
      "@type": "Organization",
      "@id": "${site.site.org_id}",
      "name": "${o.name}",
      "legalName": "${o.legal_name}",
      "alternateName": "${o.legal_name}",
      "url": "${site.site.org_url}",
      "logo": "${o.logo}",
      "email": "${o.email}",
      "foundingDate": "${o.founding_date}",
      "address": { "@type": "PostalAddress", "addressLocality": "${o.locality}", "addressCountry": "${o.country}" },
      "identifier": { "@type": "PropertyValue", "name": "Organization number (Enhetsregisteret, Brønnøysundregistrene)", "value": "${o.org_number}" },
      "founder": { "@id": "${site.site.author.person_id}" },
      "sameAs": [${o.same_as.map(u => `"${u}"`).join(', ')}]
    }`;
}

// Cache-busting fingerprint for /style.css, computed from the file's bytes by
// prerender.tsx and passed in (head.ts must stay importable by the dev bundle, so
// it cannot read the filesystem itself).
//
// Added 2026-09-15 after a stylesheet change was deployed, verified at the origin,
// and still invisible to every visitor. This host is behind Cloudflare, which caches
// /style.css with max-age=14400 -- four hours of the old stylesheet on a URL that
// never changes. deploy.ps1 checks that the homepage returns 200 and reports
// DEPLOYED, so the whole pipeline goes green while the page a reader sees is stale.
// A content hash in the query string makes a changed stylesheet a different URL,
// which no edge can serve from cache. It is not a purge step someone has to remember.
export function buildHead(path: string, styleVersion = ''): string {
  let title = site.site.name;
  let description = site.site.short_description;
  let canonical = site.site.base_url;
  let ogType = 'website';
  let jsonLd = '';
  let ogImage = '';

  if (path === '/articles/') {
    // This page used to fall through to the site-wide description and to the
    // Blog JSON-LD below -- which carries @id "<base>#blog". Two URLs then
    // declared themselves to be the same entity, with identical meta
    // descriptions: a duplicate-content signal on a site whose entire purpose is
    // being read and cited by crawlers. It is a CollectionPage about the blog,
    // which is what it actually is.
    title = 'All Articles - ' + site.site.name;
    description = `The complete archive of ${site.articles.length} engineering articles on ${site.site.name} — what was built, what broke, and what the numbers actually showed.`;
    canonical = site.site.base_url + 'articles/';
    jsonLd = `
    { "@context": "https://schema.org", "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "${site.site.base_url}articles/#archive",
      "name": "All Articles - ${site.site.name.replace(/"/g, '\\"')}",
      "url": "${site.site.base_url}articles/",
      "description": "${description.replace(/"/g, '\\"')}",
      "isPartOf": { "@id": "${site.site.base_url}#blog" },
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" },
      "hasPart": [
${site.articles.map(a => `        { "@type": "${articleType(a)}", "@id": "${a.canonical}#article", "headline": "${a.title.replace(/"/g, '\\"')}", "url": "${a.canonical}", "datePublished": "${a.date_published}" }`).join(',\n')}
      ]
    },
    ${orgNode()}
    ] }`;
  } else if (getCategoryByPath(path)) {
    const category = getCategoryByPath(path)!;
    const items = articlesInCategory(category.id);
    title = `${category.label} - ` + site.site.name;
    description = category.description;
    canonical = category.canonical;
    jsonLd = `
    { "@context": "https://schema.org", "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "${category.canonical}#collection",
      "name": "${category.label.replace(/"/g, '\\"')} - ${site.site.name.replace(/"/g, '\\"')}",
      "url": "${category.canonical}",
      "description": "${description.replace(/"/g, '\\"')}",
      "isPartOf": { "@id": "${site.site.base_url}#blog" },
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": ${items.length},
        "itemListElement": [
${items.map((a, i) => `          { "@type": "ListItem", "position": ${i + 1}, "url": "${a.canonical}", "name": "${a.title.replace(/"/g, '\\"')}" }`).join(',\n')}
        ]
      }
    },
    ${breadcrumb([
      { name: 'Home', url: site.site.base_url },
      { name: category.label, url: category.canonical },
    ])},
    ${orgNode()}
    ] }`;
  } else if (site.articles.some(a => a.path === path)) {
    // Resolved from the data, not a hardcoded path list. The previous version
    // named its two articles inline, so a third article would have silently
    // rendered with the site-wide title and no BlogPosting markup at all --
    // published, indexed, and invisible as an article.
    const article = getArticle(site.articles.find(a => a.path === path)!.id);
    title = article.title;
    description = article.dek;
    canonical = article.canonical;
    ogType = article.og_type;
    ogImage = article.image || '';

    const category = article.category ? site.categories.find(c => c.id === article.category) : undefined;
    const type = articleType(article);
    const trail = [{ name: 'Home', url: site.site.base_url }];
    if (category) trail.push({ name: category.label, url: category.canonical });
    trail.push({ name: article.title, url: article.canonical });

    jsonLd = `
    { "@context": "https://schema.org", "@graph": [
    {
      "@type": "${type}",
      "@id": "${article.canonical}#article",
      "headline": "${article.title.replace(/"/g, '\\"')}",
      "name": "${article.title.replace(/"/g, '\\"')}",
      "description": "${article.dek.replace(/"/g, '\\"')}",
      "url": "${article.canonical}",
      "mainEntityOfPage": "${article.canonical}",${ogImage ? `\n      "image": "${ogImage}",` : ''}
      "datePublished": "${article.date_published}",
      "dateModified": "${article.date_modified}",
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" },
      "isPartOf": ${category ? `{ "@id": "${category.canonical}#collection" }` : `{ "@id": "${site.site.base_url}#blog" }`}${type === 'ProfilePage' ? `,\n      "mainEntity": { "@id": "${site.site.author.person_id}" }` : ''}${article.project_id ? `,\n      "about": { "@type": "SoftwareApplication", "name": "${article.project_id}", "url": "${getProject(article.project_id).repo}" }` : ''}${article.citation ? `,\n      "citation": "${article.citation}"` : ''}
    },
    ${breadcrumb(trail)},
    ${orgNode()}
    ] }`;
  } else {
    jsonLd = `
    { "@context": "https://schema.org", "@graph": [
    {
      "@type": "WebSite",
      "@id": "${site.site.base_url}#website",
      "name": "${site.site.name.replace(/"/g, '\\"')}",
      "url": "${site.site.base_url}",
      "description": "${site.site.short_description.replace(/"/g, '\\"')}",
      "inLanguage": "en",
      "publisher": { "@id": "${site.site.org_id}" },
      "hasPart": { "@id": "${site.site.base_url}#blog" }
    },
    {
      "@type": "Blog",
      "@id": "${site.site.base_url}#blog",
      "name": "${site.site.name.replace(/"/g, '\\"')}",
      "url": "${site.site.base_url}",
      "description": "${site.site.short_description.replace(/"/g, '\\"')}",
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" },
      "hasPart": [
${site.categories.map(c => `        { "@type": "CollectionPage", "@id": "${c.canonical}#collection", "name": "${c.label.replace(/"/g, '\\"')}", "url": "${c.canonical}" }`).join(',\n')}
      ]
    },
    ${orgNode()}
    ] }`;
  }

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:site_name" content="${site.site.name.replace(/"/g, '&quot;')}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
  <meta property="og:type" content="${ogType}">${ogImage ? `\n  <meta property="og:image" content="${ogImage}">` : ''}
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
  <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">${ogImage ? `\n  <meta name="twitter:image" content="${ogImage}">` : ''}
  <link rel="icon" type="image/png" href="/BVfavicom.png">
  <link rel="stylesheet" href="/style.css${styleVersion ? `?v=${styleVersion}` : ''}">
  <script type="application/ld+json">${jsonLd}</script>
  `;
}

function getProject(id: string) {
  return site.projects.find(p => p.id === id)!;
}
