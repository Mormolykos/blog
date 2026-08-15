import React from 'react';
import { articlesByDate } from '../data/site';
import { ArticleCard } from '../components/ArticleCard';

// The full archive. The front page shows only the newest few and links here; this
// page is the complete list, newest first. Until 2026-08-15 both pages rendered
// the identical unsliced list, so this URL was the front page with the projects
// removed and had no reason to exist.
export const Articles: React.FC = () => {
  return (
    <>
      <h2>All Articles</h2>
      <p className="archive-intro">
        Every article published here, newest first — {articlesByDate.length} in total.
        Each one covers something built and what it turned out to be wrong about.
      </p>
      {articlesByDate.map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </>
  );
};
