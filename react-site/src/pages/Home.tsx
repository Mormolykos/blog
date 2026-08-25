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

      {/* "Projects" was the wrong word, and it cost something: these four are the
          published Python libraries, and heading them "Projects" told a reader
          they were the body of work rather than a small, specific slice of it.
          The label lives in site-data.json with the rest of the facts about them,
          so it is declared once and not typed into a component. */}
      <h2>{site.site.projects_heading}</h2>
      {site.site.projects_note && (
        <p className="section-note">
          {site.site.projects_note}{' '}
          The full record is in the{' '}
          <a href="https://tts.bedvibe.studio/portfolio/">portfolio</a>.
        </p>
      )}
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
