export interface SiteData {
  _meta: { schema_version: number; generated_at: string; generated_by: string; sources: string[]; flags: string[] };
  site: {
    name: string;
    tagline: string;
    short_description: string;
    base_url: string;
    author: { name: string; url: string; linkedin: string; person_id: string; bio: string };
    org_url: string;
    org_id: string;
    // The publishing entity, stated in full rather than referenced. Every page used to
    // emit `"publisher": { "@id": "https://bedvibe.studio/#organization" }` and nothing
    // else: a bare cross-document reference. A consumer parses one page at a time and
    // does not dereference an @id on another host, so on all 32 pages the publisher was
    // an unnamed node, and the legal entity behind the brand appeared nowhere in the
    // markup. Measured 2026-09-17.
    org: {
      name: string;
      legal_name: string;
      org_number: string;
      founding_date: string;
      locality: string;
      country: string;
      logo: string;
      email: string;
      same_as: string[];
    };
    portfolio_url: string;
    github_url: string;
    corner_link: { label: string; href: string };
    // The homepage figures. Here rather than in Home.tsx so they have one home and a
    // stated source: research_records is harvested from the public ORCID API by
    // portfolio_agent/gen_site_data.py, which already harvests versions from PyPI and
    // GitHub. The library count is not stored at all -- it is projects.length.
    stats: {
      model_params: string;
      research_records: number;
      research_records_source: string;
      research_records_measured: string;
    };
    nav: { label: string; href: string; external: boolean }[];
    // The heading over the project grid, declared here rather than typed into
    // Home.tsx. It read "Projects" while every entry was a published Python
    // library, which told a reader these four were the body of work instead of
    // one specific slice of it.
    projects_heading: string;
    projects_note?: string;
  };
  projects: Project[];
  articles: Article[];
  categories: Category[];
}

// A section of the site. The archive at /articles/ is every article in date order;
// these are the same articles grouped by what kind of work they are. Declared here
// rather than in a component because three consumers read it: the category pages,
// head.ts (canonical, description, JSON-LD) and prerender.tsx (sitemap, llms.txt).
export interface Category {
  id: string; label: string; path: string; canonical: string; description: string;
}

export interface Release { version: string; date: string; title: string; summary?: string; url: string; }

export interface Project {
  id: string; name: string; tagline: string; description: string;
  // A project that has not been released yet has no version, no install line and
  // no PyPI page. These are null, not empty strings, and the renderer omits the
  // element rather than printing "v" or an <a> with no href.
  status: string; current_version: string | null; current_release_date?: string | null;
  install: string | null; repo: string; pypi: string | null; license: string;
  doi?: string | null; doi_url?: string | null; built_on?: string;
  tests_passing: number; tests_as_of_version?: string; release_count: number;
  article_id: string; highlights: string[]; releases: Release[];
  _note?: string; // internal only — never render
}

export interface Article {
  id: string; title: string; dek: string; path: string; canonical: string;
  date_published: string; date_modified: string; display_date: string;
  project_id: string; og_type: string; citation: string | null;
  // Which section the article belongs to, or null for a page that is listed in the
  // archive but is not one of the four kinds of work -- /work/ is the CV.
  category: string | null;
  image?: string; // absolute URL; emits og:image + BlogPosting.image when present
}
