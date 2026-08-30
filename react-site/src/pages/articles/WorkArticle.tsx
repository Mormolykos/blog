import React from 'react';
import { site } from '../../data/site';

// The libraries this page names are read from site-data.json rather than
// typed here. `gen_site_data.py` fills that file from PyPI and GitHub, so a
// new release or a new library reaches this sentence without anyone editing
// it -- the failure that left it saying "three" on the day there were four.
const PUBLISHED = site.projects.filter(p => p.pypi);
const COUNT_WORDS: Record<number, string> = {
  1: 'The one', 2: 'Both', 3: 'All three', 4: 'All four',
  5: 'All five', 6: 'All six',
};
const LIBRARY_COUNT_WORD = COUNT_WORDS[PUBLISHED.length] ?? `All ${PUBLISHED.length}`;

const LibraryList: React.FC = () => (
  <>
    {PUBLISHED.map((p, i) => (
      <React.Fragment key={p.id}>
        <a href={p.pypi!}>{p.name}</a>
        {i < PUBLISHED.length - 2 ? ', ' : i === PUBLISHED.length - 2 ? ' and ' : '. '}
      </React.Fragment>
    ))}
  </>
);

export const WorkArticle: React.FC = () => {
  return (
    <article>
      <h1>Panagiotis (Panos) Gkilis — Machine Learning Engineer</h1>
      <p><em>Production ML systems, MLOps, speech and language AI. Everything below is deployed, measured, and open to inspection. Thessaloniki, Greece — open to remote.</em></p>
      <p>
        <a href="mailto:bedvibe@bedvibe.studio">bedvibe@bedvibe.studio</a> ·{' '}
        <a href="https://github.com/Mormolykos">GitHub</a> ·{' '}
        <a href="https://huggingface.co/pan82">Hugging Face</a> ·{' '}
        <a href="https://orcid.org/0009-0007-3805-170X">ORCID 0009-0007-3805-170X</a> ·{' '}
        <a href="https://www.linkedin.com/in/panagiotis-gkilis-57995117b">LinkedIn</a>
      </p>

      {/* What he is looking for, stated before the evidence rather than left to
          be inferred from it. The page previously said "open to remote", which
          is a location and not a role -- a recruiter landing here had to guess
          the seniority, the function and the availability, and a recruiter who
          has to guess moves on. Kept to three lines: a hiring reader decides
          whether to keep reading in about eight seconds, and everything below
          this point only matters if they do. */}
      <div style={{
        border: '1px solid currentColor',
        borderRadius: '6px',
        padding: '0.9rem 1.1rem',
        margin: '1.4rem 0',
        opacity: 0.95,
      }}>
        <p style={{ margin: 0 }}>
          <strong>Available now, full-time and remote.</strong> Looking for a senior or
          staff role in ML engineering, MLOps or applied AI — training and evaluation
          pipelines, retrieval systems, inference infrastructure. Comfortable owning a
          system end to end, which is what everything below is.
        </p>
        <p style={{ margin: '0.5rem 0 0' }}>
          Based in Greece, working across European and US-overlapping hours. The fastest
          way to reach me is{' '}
          <a href="mailto:bedvibe@bedvibe.studio">bedvibe@bedvibe.studio</a> — I answer
          the same day.
        </p>
      </div>

      <hr />

      {/* A DOORBELL, NOT A PORTFOLIO.

          This page was 1,145 words of condensed portfolio sitting beside a
          10,828-word portfolio with 38 project cards on tts.bedvibe.studio.
          Two pages competing to make the same case, and nobody reads two --
          the shorter one just wins by being found and loses by saying less.

          It exists for exactly one reason: Google has not crawled
          tts.bedvibe.studio since 2026-08-10, while it crawls this host daily.
          So this page is the door, and the portfolio is the building. The
          moment tts is being crawled again, this can be deleted outright.

          DO NOT GROW THIS PAGE. Every paragraph added here is a paragraph
          competing with the portfolio for the same reader and the same query.
          New work goes on the portfolio. */}

      <p>
        The full record of what I have built — <strong>38 projects</strong>, each with
        the architecture, the measurements and what went wrong — is on my portfolio.
        It covers a 730M-parameter speech model trained from scratch, eight Model
        Context Protocol servers, a model gateway with admission control and
        deadline-aware failover, a real-time aerospace telemetry engine in Rust,
        custom voice-activity detection, production auth and billing, and a card
        game with its own engine.
      </p>

      <p style={{ fontSize: '1.15rem', margin: '1.6rem 0' }}>
        <strong>
          <a href="https://tts.bedvibe.studio/portfolio/">
            Read the full portfolio →
          </a>
        </strong>
      </p>

      <h2>The short version</h2>

      <p>
        Six years of end-to-end production machine learning: models trained from
        scratch, deployed behind live APIs, and operated for paying customers. Sole
        engineer of BedVibe Studios — a multilingual speech-AI platform built on a
        730M-parameter text-to-speech model trained on consumer GPUs, running on
        FastAPI, PostgreSQL, Docker and Linux with Stripe-billed usage. Eight
        published research records with Zenodo DOIs, and open-source libraries on
        PyPI.
      </p>

      <p>
        I develop with AI coding agents and treat their output as untrusted until it
        clears a gate: automated evaluation suites, ASR-validated model QA, static
        checks. {/* Derived from site-data.json, the one place a library is
        declared. This sentence used to name three libraries by hand and went
        stale the day a fourth was published. */}
        {LIBRARY_COUNT_WORD} of my published libraries <em>are</em> those gates —{' '}
        <LibraryList /> That method is
        why a LoRA collapse and a live retrieval regression were caught before
        release rather than after.
      </p>

      <p>
        The pattern that runs through all of it:{' '}
        <strong>
          a fault that returns an error is one you fix this afternoon; a fault that
          returns a plausible success is one you ship.
        </strong>{' '}
        Most of my writing is about finding the second kind — the{' '}
        <a href="/success-rate/">gateway that returned 200 to everyone too late</a>,
        the{' '}
        <a href="/corrupted-training-data/">run on pure noise that cut its loss 62%</a>,
        the{' '}
        <a href="/observation-time/">validation layer correctly deleting good data</a>.
      </p>

      <h2>Get in touch</h2>

      <p>
        <a href="mailto:bedvibe@bedvibe.studio">bedvibe@bedvibe.studio</a> — I answer
        the same day. Also on{' '}
        <a href="https://www.linkedin.com/in/panagiotis-gkilis-57995117b">LinkedIn</a>,{' '}
        <a href="https://github.com/Mormolykos">GitHub</a>, and{' '}
        <a href="https://tts.bedvibe.studio/portfolio/Panagiotis_Gkilis_CV_short.pdf">
          my CV (PDF)
        </a>.
      </p>
    </article>
  );
};
