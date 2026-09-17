import React from 'react';
import { getArticle, articlesInCategory, articlesByDate } from '../data/site';

export interface CategoryItem { id: string; line: string }
export interface Section { heading: string; note: string; items: CategoryItem[] }

// A category page groups its articles into editorial sections. Nothing enforces that
// the sections between them cover the category -- so an article could be given a
// category in site-data.json, enter the sitemap and the nav count, and appear on no
// page at all, which is the silent half of the failure this repository already guards
// against in the other direction (an article with no route). Both directions are
// checked, and both throw at build time rather than shipping a page that is quietly
// short. The prerender runs these components, so a throw here fails the build.
export function assertSectionsCover(categoryId: string, sections: Section[]): void {
  const listed = sections.flatMap(s => s.items.map(i => i.id));
  const duplicated = listed.filter((id, i) => listed.indexOf(id) !== i);
  if (duplicated.length) {
    throw new Error(`category "${categoryId}": article listed in two sections: ${[...new Set(duplicated)].join(', ')}`);
  }
  const actual = articlesInCategory(categoryId).map(a => a.id);
  const missing = actual.filter(id => !listed.includes(id));
  const stray = listed.filter(id => !actual.includes(id));
  if (missing.length) {
    throw new Error(`category "${categoryId}": in site-data but on no section of the page: ${missing.join(', ')}`);
  }
  if (stray.length) {
    throw new Error(`category "${categoryId}": on the page but not in that category in site-data: ${stray.join(', ')}`);
  }
}

// The category's own description is NOT rendered here. It is the meta description and
// the JSON-LD "description", both of which head.ts reads from site-data. Repeating it
// in a hidden element would be marking up text the reader cannot see.
export const CategoryIntro: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const count = articlesInCategory(id).length;
  return (
    <div className="archive-intro">
      {children}
      <p>
        {count} {count === 1 ? 'article' : 'articles'} in this section &middot;{' '}
        <a href="/articles/">all {articlesByDate.length} articles, newest first &rarr;</a>
      </p>
    </div>
  );
};

export const CategorySection: React.FC<{ section: Section }> = ({ section }) => (
  <section>
    <h3>{section.heading}</h3>
    <p className="section-note">{section.note}</p>
    {section.items.map(item => {
      const a = getArticle(item.id);
      return (
        <div className="article-list-item" key={item.id}>
          <h4><a href={a.path}>{a.title}</a></h4>
          <span className="date">{a.display_date}</span>
          <p>{item.line}</p>
        </div>
      );
    })}
  </section>
);
