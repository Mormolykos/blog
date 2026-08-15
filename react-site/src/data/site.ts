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
