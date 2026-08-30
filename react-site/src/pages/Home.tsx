import React from 'react';
import { site, articlesByDate, HOME_ARTICLE_COUNT } from '../data/site';
import { ProjectStatus } from '../components/ProjectStatus';
import { ArticleCard } from '../components/ArticleCard';

export const Home: React.FC = () => {
  const latest = articlesByDate.slice(0, HOME_ARTICLE_COUNT);
  const remaining = articlesByDate.length - latest.length;

  return (
    <>
      {/* The homepage used to open with the site tagline and nothing else: no
          statement of who writes here, no route to the work, no research record.
          A reader landing here learned that someone writes notes about
          reliability, and could not find out who. The identity block below is
          the front door -- and it carries the followed link to the person page
          that the footer alone was carrying before. */}
      <section className="intro">
        <img
          className="intro-portrait"
          src="https://bedvibe.studio/assets/panagiotis-panos-gkilis.png"
          alt="Panagiotis (Panos) Gkilis, machine learning engineer and founder of BedVibe Studios"
          width={120}
          height={120}
          loading="eager"
        />
        <div className="intro-body">
          <h2 className="intro-name">Panagiotis (Panos) Gkilis</h2>
          <p className="intro-role">
            Machine Learning Engineer · Independent Researcher · Founder of BedVibe Studios
          </p>
          <p className="intro-lead">
            I build AI and speech systems end to end &mdash; and then I build the
            instruments that tell me when those systems are lying about being correct.
            A fault that returns an error is one you fix that afternoon. A fault that
            returns a plausible success is one you ship.
          </p>
          <p className="intro-lead">
            That habit came out of the laboratory. Years of natural-sciences coursework
            and bench work train one reflex above all others: an experiment is not
            finished when it produces a number, but when the error on that number has
            been characterised, bounded and stated. Systematic versus random error,
            propagation, precision against accuracy, and the discipline of declaring
            what a measurement <em>cannot</em> resolve &mdash; those are the same habits
            that make an evaluation gate worth trusting.
          </p>
          <p className="intro-links">
            <a className="cta" href="/work/">The engineering record &rarr;</a>
            <a href="https://tts.bedvibe.studio/portfolio/">38-project portfolio</a>
            <a href={site.site.author.url}>Full profile</a>
            <a href="https://orcid.org/0009-0007-3805-170X">ORCID 0009-0007-3805-170X</a>
            <a href="https://zenodo.org/search?q=Gkilis">Research on Zenodo</a>
          </p>
        </div>
      </section>

      <div className="facts">
        <div className="fact"><b>730M</b><span>parameter speech model, trained from scratch</span></div>
        <div className="fact"><b>8</b><span>published research records with DOIs</span></div>
        <div className="fact"><b>8</b><span>Model Context Protocol servers</span></div>
        <div className="fact"><b>4</b><span>verification libraries on PyPI</span></div>
      </div>

      {/* Stated in public for the first time here. Every individual system was
          documented and the thing they are all steps toward was documented
          nowhere -- which is why the work reads as a pile of side projects
          instead of two programmes. */}
      <h2>What this is all building toward</h2>
      <p className="section-note">
        Most of the projects below are steps, not destinations. There are two long
        arcs, and nearly everything here belongs to one of them.
      </p>

      <div className="arcs">
        <div className="arc">
          <h3>1 &middot; Measuring the human voice</h3>
          <p>
            How far can a voice move &mdash; in pitch, effort, emotion, phonation &mdash;
            before the machines that recognise it decide it belongs to someone else?
            The speaker-drift replication, the fourteen-encoder benchmark, the
            in-house parallel corpus and <code>spkproof</code> are all instruments
            pointed at the same question: what the space of one person&rsquo;s voice
            actually looks like, and where every current model misreads it.
          </p>
        </div>
        <div className="arc">
          <h3>2 &middot; Agents that can say &ldquo;I don&rsquo;t know&rdquo;</h3>
          <p>
            One rule, applied at every layer: an absent or invalid value must never
            be able to read as a good one. Retrieval, coverage accounting, typed
            tool contracts, admission control and observation sit behind a single
            protocol boundary &mdash; so that separate agents, working on separate
            problems, can see and trust each other&rsquo;s verdicts instead of each
            re-deciding in private.
          </p>
        </div>
      </div>

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
