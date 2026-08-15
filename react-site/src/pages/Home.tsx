import React from 'react';
import { site } from '../data/site';
import { ProjectStatus } from '../components/ProjectStatus';
import { ArticleCard } from '../components/ArticleCard';

export const Home: React.FC = () => {
  return (
    <>
      <p>{site.site.tagline}</p>
      
      <h2>Projects</h2>
      {site.projects.map(p => (
        <ProjectStatus key={p.id} project={p} />
      ))}

      <h2>Latest Articles</h2>
      {site.articles.map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </>
  );
};
