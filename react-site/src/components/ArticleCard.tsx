import React from 'react';
import type { Article } from '../data/types';

export const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div className="article-list-item">
      <h2><a href={article.path}>{article.title}</a></h2>
      <span className="date">{article.display_date}</span>
      <p><em>{article.dek}</em></p>
    </div>
  );
};
