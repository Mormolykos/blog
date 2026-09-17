import data from "./site-data.json";
import type { SiteData, Project, Article, Category } from "./types";

export const site = data as unknown as SiteData;

export function getCategory(id: string): Category {
  const c = site.categories.find(x => x.id === id);
  if (!c) throw new Error(`Category ${id} not found`);
  return c;
}

export function getCategoryByPath(path: string): Category | undefined {
  return site.categories.find(x => x.path === path);
}

export function getProject(id: string): Project {
  const p = site.projects.find(x => x.id === id);
  if (!p) throw new Error(`Project ${id} not found`);
  return p;
}

export function getArticle(id: string): Article {
  const a = site.articles.find(x => x.id === id);
  if (!a) throw new Error(`Article ${id} not found`);
  return a;
}

// site-data.json's articles[] is hand-maintained and is NOT in date order -- the
// two July articles sat ahead of four August ones under a heading that said
// "Latest". Every listing sorts through here instead of trusting the array order,
// so adding an article anywhere in the file puts it in the right place on the page.
// Ties keep their file order, which is what Array.prototype.sort guarantees.
export const articlesByDate: Article[] = [...site.articles].sort(
  (a, b) => b.date_published.localeCompare(a.date_published),
);

// How many the front page shows before handing off to the full archive.
export const HOME_ARTICLE_COUNT = 4;

// Newest-first, like every other listing. An article with category null (the CV at
// /work/) belongs to the archive but to no section, so it appears in no category page.
export function articlesInCategory(categoryId: string): Article[] {
  return articlesByDate.filter(a => a.category === categoryId);
}

// A category declared in site-data with nothing in it renders an empty page that says
// nothing and still enters the sitemap. Cheaper to find here than in a crawl report.
export function emptyCategories(): string[] {
  return site.categories.filter(c => articlesInCategory(c.id).length === 0).map(c => c.id);
}
