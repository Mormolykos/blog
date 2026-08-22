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
    portfolio_url: string;
    github_url: string;
    corner_link: { label: string; href: string };
    nav: { label: string; href: string; external: boolean }[];
  };
  projects: Project[];
  articles: Article[];
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
  image?: string; // absolute URL; emits og:image + BlogPosting.image when present
}
