import { site, getArticle } from '../data/site';

export function buildHead(path: string): string {
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
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": "${site.site.base_url}articles/#archive",
      "name": "All Articles - ${site.site.name.replace(/"/g, '\\"')}",
      "url": "${site.site.base_url}articles/",
      "description": "${description.replace(/"/g, '\\"')}",
      "isPartOf": { "@id": "${site.site.base_url}#blog" },
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" },
      "hasPart": [
${site.articles.map(a => `        { "@type": "BlogPosting", "@id": "${a.canonical}#article", "headline": "${a.title.replace(/"/g, '\\"')}", "url": "${a.canonical}", "datePublished": "${a.date_published}" }`).join(',\n')}
      ]
    }`;
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

    jsonLd = `
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "${article.canonical}#article",
      "headline": "${article.title.replace(/"/g, '\\"')}",
      "description": "${article.dek.replace(/"/g, '\\"')}",
      "url": "${article.canonical}",
      "mainEntityOfPage": "${article.canonical}",${ogImage ? `\n      "image": "${ogImage}",` : ''}
      "datePublished": "${article.date_published}",
      "dateModified": "${article.date_modified}",
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" },
      "isPartOf": { "@id": "${site.site.base_url}#blog" }${article.project_id ? `,\n      "about": { "@type": "SoftwareApplication", "name": "${article.project_id}", "url": "${getProject(article.project_id).repo}" }` : ''}${article.citation ? `,\n      "citation": "${article.citation}"` : ''}
    }`;
  } else {
    jsonLd = `
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": "${site.site.base_url}#blog",
      "name": "${site.site.name.replace(/"/g, '\\"')}",
      "url": "${site.site.base_url}",
      "description": "${site.site.short_description.replace(/"/g, '\\"')}",
      "author": { "@type": "Person", "@id": "${site.site.author.person_id}", "name": "${site.site.author.name}" },
      "publisher": { "@id": "${site.site.org_id}" }
    }`;
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
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${jsonLd}</script>
  `;
}

function getProject(id: string) {
  return site.projects.find(p => p.id === id)!;
}
