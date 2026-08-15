import data from "./site-data.json";
import type { SiteData, Project, Article } from "./types";

export const site = data as unknown as SiteData;

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
