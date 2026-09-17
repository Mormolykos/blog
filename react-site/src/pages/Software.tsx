import React from 'react';
import { site } from '../data/site';
import { ProjectStatus } from '../components/ProjectStatus';
import { CategorySection, CategoryIntro, assertSectionsCover } from '../components/CategoryPage';

const SECTIONS = [
  {
    heading: 'What each one catches, and what it does not',
    note: 'Three of the four libraries have an article describing the failure that produced them. Every one of those articles is also honest about the failures the library cannot see.',
    items: [
      { id: 'trainproof', line: 'A deterministic linter for training runs. A run learning pure noise reduced its loss by 62% and looked textbook-healthy. The article covers what can be caught from a trainer state and is explicit about what cannot — and a later release exists because the linter returned a clean pass on a run that had been dead since step 11.' },
      { id: 'ttsproof', line: 'Automated failure-mode QA for text-to-speech: the model that sounds excellent until it reads an abbreviation aloud as a word. Backed by a published 390-sample study.' },
      { id: 'notchecked', line: 'Coverage accounting for validators. A validator that reports a verdict without reporting its coverage is asserting something it did not measure. The same defect was found in four systems, three of them the author’s own, before it was admitted to be one problem.' },
    ],
  },
];

export const Software: React.FC = () => {
  assertSectionsCover('software', SECTIONS);

  return (
    <>
      <h2>Software</h2>
      <CategoryIntro id="software">
        <p>
          Four open-source Python libraries, all on PyPI, all MIT-licensed, all
          installable. They are deterministic checkers rather than models: each one
          reads the artifacts a machine-learning run already produces — a trainer
          state, a batch of synthesised audio, a set of speaker trials, a validator&rsquo;s
          own output — and reports what is wrong with them, the same way every time.
        </p>
        <p>
          They exist because of a single recurring failure. A run, a synthesis, a
          verification or a check can fail in a way that produces a plausible success:
          a falling loss curve over corrupted data, a clean pass over a run that died
          hundreds of steps ago, a verdict returned over evidence that was never
          examined. A fault that raises an error is fixed that afternoon. A fault that
          returns a good-looking number is shipped.
        </p>
        <p>
          The rule they share is that an absent or unmeasurable value must never be
          able to read as a good one. Where a check cannot run, these libraries report
          that it did not run — they do not quietly skip it and pass.
        </p>
      </CategoryIntro>

      <h3>The libraries</h3>
      <p className="section-note">
        Versions, release counts and test counts here are harvested from PyPI and the
        GitHub Releases API rather than typed by hand.
      </p>
      <div className="project-grid">
        {site.projects.map(p => (
          <ProjectStatus key={p.id} project={p} compact />
        ))}
      </div>

      {SECTIONS.map(s => (
        <CategorySection key={s.heading} section={s} />
      ))}

      <p className="section-note">
        <code>spkproof</code> has no article of its own. The study it came out of is the
        fourteen-encoder panel in <a href="/benchmarks/">Benchmarks</a>.
      </p>
    </>
  );
};
