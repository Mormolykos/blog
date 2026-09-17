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
        {/* The portrait belongs to the name, not to the essay: they sit together as
            one identity line and the prose runs full width underneath at a readable
            measure. Previously the image was a sibling of everything, so it stood in
            its own column beside a narrow ragged block of text. */}
        <div className="intro-head">
          <img
            className="intro-portrait"
            src="https://bedvibe.studio/assets/panagiotis-panos-gkilis.png"
            alt="Panagiotis (Panos) Gkilis, machine learning engineer and founder of BedVibe Studios"
            width={112}
            height={112}
            loading="eager"
          />
          <div className="intro-id">
            <h2 className="intro-name">Panagiotis (Panos) Gkilis</h2>
            <p className="intro-role">
              Machine Learning Engineer · Independent Researcher · Founder of BedVibe Studios
            </p>
            {/* The one link kept from what used to be a five-button row. Every other
                button in it -- Work, Portfolio, ORCID -- already exists in the nav or
                the footer, and "38-project portfolio" hard-coded a count that goes
                stale the day a 39th ships. This one stays because the person page had
                exactly one other followed link on the site, in the footer. */}
            <p className="intro-profile">
              <a href={site.site.author.url}>Full profile and CV</a>
            </p>
          </div>
        </div>
        <div className="intro-body">
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
        </div>
      </section>

      {/* Every figure here is read from site-data.json or counted from it at build
          time. None is typed into this file.

          It used to carry four hand-written numbers and all four were a problem: the
          DOI count said 9 when ORCID listed 10, "8 Model Context Protocol servers"
          could not be sourced at all (the four MCP config files hold 8, 8, 9 and 9,
          ten distinct between them), and the library count happened to be right by
          luck. A number nothing recomputes is a number that is only ever correct on
          the day it is typed. */}
      <div className="facts">
        <div className="fact">
          <b>{site.site.stats.model_params}</b>
          <span>parameter speech model, trained from scratch</span>
        </div>
        <div className="fact">
          <b>{site.site.stats.research_records}</b>
          <span>published research records with DOIs</span>
        </div>
        <div className="fact">
          <b>{site.projects.length}</b>
          <span>verification libraries on PyPI</span>
        </div>
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

      {/* The front page used to offer one route into 25 articles: a single link to a
          flat archive. A reader arriving for the encoder benchmark and a reader
          arriving for the libraries were given the same undifferentiated list. */}
      <h2>Sections</h2>
      <p className="section-note">
        The same writing, grouped by what kind of work it is.
      </p>
      <ul className="section-index">
        {site.categories.map(c => (
          <li key={c.id}>
            <a href={c.path}>{c.label}</a> — {c.description}
          </li>
        ))}
      </ul>

      <h2>Latest Articles</h2>
      {latest.map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
      {remaining > 0 && (
        <p className="archive-link">
          <a href="/articles/">All {articlesByDate.length} articles, newest first →</a>
        </p>
      )}
    </>
  );
};
