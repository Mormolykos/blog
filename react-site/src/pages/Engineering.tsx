import React from 'react';
import { SectionIcon } from '../components/SectionIcon';
import { CategorySection, CategoryIntro, assertSectionsCover } from '../components/CategoryPage';

const SECTIONS = [
  {
    heading: 'Systems under fault',
    note: 'Two components taken apart while running, one by deliberate fault injection and one by an architectural change measured before and after.',
    items: [
      { id: 'success-rate', line: 'Backpressure removed from a model gateway to see what would break. Thirty-two callers, thirty-two HTTP 200s, and thirty-one of them arrived after the caller had already given up. Then a backend was made slow instead of dead, and failover logged eight successes without ever calling the healthy backend. Both faults produced a clean log — which is the finding.' },
      { id: 'observation-time', line: 'Aether: a two-thousand-line Rust component turning a live, unreliable sensor feed into a collision picture in under a millisecond per cycle, built to be embedded in a larger system. Includes one measured investigation — a fault rejecting 16.1% of valid observations, cut to 1.9% by an architectural change.' },
    ],
  },
  {
    heading: 'Systems for long-running work',
    note: 'Two systems built because a body of work outgrew the tools normally used to hold it.',
    items: [
      { id: 'canon-state', line: 'A fictional universe outgrew the context window, so it stopped being a pile of documents and became a persistent, machine-readable state store that generation is validated against. State, not retrieval: the distinction is the whole point.' },
      { id: 'ai-authorship', line: 'Six years, six books, one world, and the tooling built to stop the machine drifting away from what has already been published. What AI-assisted actually looks like when a human directs the whole thing and remains accountable for every line of it.' },
    ],
  },
];

export const Engineering: React.FC = () => {
  assertSectionsCover('engineering', SECTIONS);

  return (
    <>
      <h1><SectionIcon name="engineering" /> Engineering</h1>
      <CategoryIntro id="engineering">
        <p>
          Four production systems, written up as case studies rather than as results.
          A gateway in front of several model backends, a real-time tracking component
          in Rust, a state store holding a body of fiction too large for a context
          window, and the pipeline that keeps a six-book series consistent with itself.
        </p>
        <p>
          The recurring theme is what a system reports about itself while it is
          failing. Two of these were broken on purpose to find out, and in both cases
          the logs stayed clean throughout — every request answered, every failover
          recorded as a success, and almost nothing actually delivered. A system that
          cannot describe its own failure is not observable, however much it emits.
        </p>
      </CategoryIntro>
      {SECTIONS.map(s => (
        <CategorySection key={s.heading} section={s} />
      ))}
      <p className="section-note">
        The full engineering record, with the deployed systems and the project list, is
        on the <a href="/work/">Work</a> page.
      </p>
    </>
  );
};
