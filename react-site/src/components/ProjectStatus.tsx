import React from 'react';
import type { Project } from '../data/types';
import { getArticle } from '../data/site';
import { ReleaseTimeline } from './ReleaseTimeline';

// currentArticleId: set by an article page rendering its own project card, so
// the card does not offer "Read the article" as a link back to the page the
// reader is already on.
export const ProjectStatus: React.FC<{ project: Project; currentArticleId?: string }> = ({
  project,
  currentArticleId,
}) => {
  const latestRelease = project.releases[0];
  const linkedArticle = project.article_id && project.article_id !== currentArticleId;
  const article = linkedArticle ? getArticle(project.article_id) : null;
  
  return (
    <div className="project-card">
      <div className="project-card-header">
        <h2>{project.name}</h2>
        <span className="version-pill">v{project.current_version}</span>
        <span className="status-pill">{project.status}</span>
      </div>
      <p style={{ marginTop: 0, marginBottom: '1.5rem', color: '#e9edf5' }}>{project.description}</p>
      
      <div className="project-meta">
        <div><strong>Install:</strong> <code>{project.install}</code></div>
        <div><strong>Latest Documented Release:</strong> v{latestRelease.version} &middot; {latestRelease.date}</div>
        <div><strong>Tests:</strong> {project.tests_passing} passing tests</div>
        <div><strong>Releases:</strong> {project.release_count} releases</div>
        <div><strong>License:</strong> {project.license}</div>
        {project.built_on && <div><strong>Built on:</strong> {project.built_on}</div>}
      </div>
      
      <div className="project-links">
        <a href={project.repo} target="_blank" rel="noopener noreferrer">Repo (GitHub)</a>
        <a href={project.pypi} target="_blank" rel="noopener noreferrer">PyPI</a>
        {project.doi_url && <a href={project.doi_url} target="_blank" rel="noopener noreferrer">DOI</a>}
        {article && <a href={article.path}>Read the article →</a>}
      </div>
      
      <ul className="project-highlights">
        {project.highlights.map((h, i) => <li key={i}>{h}</li>)}
      </ul>
      
      <hr style={{ borderColor: '#333', margin: '2rem 0' }} />
      <ReleaseTimeline releases={project.releases} repoUrl={project.repo} />
    </div>
  );
};
