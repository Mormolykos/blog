import React from 'react';
import type { Release } from '../data/types';

export const ReleaseTimeline: React.FC<{ releases: Release[], repoUrl: string }> = ({ releases, repoUrl }) => {
  const showCount = 4;
  const shown = releases.slice(0, showCount);
  
  return (
    <div className="release-timeline">
      <h3>Recent Releases</h3>
      {shown.map(r => (
        <div className="release-item" key={r.version}>
          <strong>v{r.version}</strong>
          <span className="date">{r.date}</span>
          <span className="title"> — {r.title}</span>
        </div>
      ))}
      {releases.length > showCount && (
        <div style={{ marginTop: '1rem' }}>
          <a href={`${repoUrl}/releases`} target="_blank" rel="noopener noreferrer">
            Full changelog on GitHub →
          </a>
        </div>
      )}
    </div>
  );
};
