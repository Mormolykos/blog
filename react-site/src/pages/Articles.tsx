import React from 'react';
import { site } from '../data/site';
import { ArticleCard } from '../components/ArticleCard';

export const Articles: React.FC = () => {
  return (
    <>
      <h2>All Articles</h2>
      {site.articles.map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </>
  );
};
