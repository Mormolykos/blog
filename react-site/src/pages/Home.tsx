import React from 'react';
import { site, articlesByDate, HOME_ARTICLE_COUNT } from '../data/site';
import { ProjectStatus } from '../components/ProjectStatus';
import { ArticleCard } from '../components/ArticleCard';

export const Home: React.FC = () => {
  const latest = articlesByDate.slice(0, HOME_ARTICLE_COUNT);
  const remaining = articlesByDate.length - latest.length;

  return (
    <>
      <p>{site.site.tagline}</p>

      <h2>Projects</h2>
      <div className="project-grid">
        {site.projects.map(p => (
          <ProjectStatus key={p.id} project={p} compact />
        ))}
      </div>

      <h2>Latest Articles</h2>
      {latest.map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
      {remaining > 0 && (
        <p className="archive-link">
          <a href="/articles/">All {articlesByDate.length} articles →</a>
        </p>
      )}
    </>
  );
};
