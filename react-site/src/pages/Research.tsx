import React from 'react';
import { CategorySection, CategoryIntro, assertSectionsCover } from '../components/CategoryPage';

// Thirteen items, grouped so the page is not a second flat list. The grouping lives
// here rather than in site-data.json because it is editorial: which shelf a study sits
// on is a judgement, while its category is a fact the sitemap and llms.txt both read.
const SECTIONS = [
  {
    heading: 'Speech and training runs',
    note: 'What a model does to a voice, and what a loss curve fails to say about the run that produced it.',
    items: [
      { id: 'speaker-drift', line: 'Four speakers, eight matched sentences, three encoder architectures. One speaker moved his pitch by less than a semitone and lost a quarter of his identity score. Includes a control that could have killed the result and a pre-registered prediction withdrawn because two defensible ways of cleaning the data gave opposite answers. Superseded in scale by the fourteen-encoder benchmark; the two studies are separate and their numbers are never combined.' },
      { id: 'eos-collision', line: 'A text-to-speech model trained for weeks and never learned to stop talking. Two constants happened to be equal, the stop token fell out of the loss, and no loss curve anywhere could have shown it.' },
      { id: 'corrupted-training-data', line: 'Bad samples are assumed to announce themselves as high loss. Two failures from production say the opposite: noise is learnable, so it hides.' },
    ],
  },
  {
    heading: 'Retrieval and agents',
    note: 'Systems whose correctness depends on what they did not read. Every study here measures the part that is missing rather than the part that was returned.',
    items: [
      { id: 'retrieval-ablation', line: 'A stage-level ablation over 80 questions and 400 scored rows. The stage blamed for the loss was not the stage responsible: disabling neighbour expansion raised context recall from 0.3365 to 0.4771, level with the baseline it was losing to, while hit@k did not move at all.' },
      { id: 'retrieval-coverage', line: 'An agent holding 1,003 chunks answers from six of them, and the answer reads exactly like one built from reading all 1,003. Faithfulness cannot catch it: an answer perfectly grounded in what was retrieved can still be wrong about what was not.' },
      { id: 'structure-not-scale', line: 'Thirty-eight questions whose answer no passage states. Every model scored 0 of 38 on the prose and correctly refused; an 8B model given the same facts as a structured chronology scored 28 of 38. Then an audit of the scorer cut the headline from +32 points to +15.8 — corrected in place, not retracted.' },
      { id: 'index-answered-it', line: 'A study abandoned because a code-intelligence index was said to answer the question exactly. Checking the index first found it has no function-level nodes at all, so it does not answer that question. Two bugs filed, both confirmed by the maintainer at source level.' },
    ],
  },
  {
    heading: 'Instruments, search and indexing',
    note: 'Measurements of the measuring apparatus. Four cases where the instrument, not the system under test, was the thing that was wrong.',
    items: [
      { id: 'broken-instruments', line: 'An audit of 38 live pages where the two findings worth keeping both came from the tooling being broken: one script reported fixed pages as broken, and one date parser had thrown on every crawl-statistics read since it was written, so the report answering "is the crawler arriving at all" had never once returned a number.' },
      { id: 'crawled-not-indexed', line: 'One host with 0 of 38 URLs in Google while four sibling hosts on the same domain, IPs and certificate indexed normally. The standard advice — submit the URLs — was run against a held-out control: treatment 32%, control 33%. Fifteen causes eliminated with measurements, two of them the author’s own hypotheses withdrawn.' },
      { id: 'decision-risk', line: 'A benchmark suite pins the seeds that build its circuits and passes no seed to the code that compiles them. The real change between two compiler versions is +5.37% [+4.27, +6.50], yet the suite’s own three-run protocol calls it a regression of 10% or more 24.4% of the time. A pre-registered replication over 39 circuits, four claims withdrawn on the record, and six defects an independent audit found in the measuring apparatus itself.' },
      { id: 'photopea-scripting', line: 'Six undocumented behaviours in a scripting API, each measured with the workaround for it. If your automation reports success and changes nothing, one of these is probably why.' },
    ],
  },
  {
    heading: 'Physics reproductions',
    note: 'Two results with a known answer, rebuilt from nothing to find out what the rebuild would get wrong.',
    items: [
      { id: 'fem-kirsch', line: 'A finite element solver written from scratch and pointed at an answer known since 1898. It landed on 3.00002. Ten tests were written before the code; the one that failed taught the most, and a number the internet repeats confidently failed to reproduce.' },
      { id: 'greybody', line: 'A 1976 black-hole emission calculation reproduced from scratch. The standard geometric-optics shortcut overstates photon emission by 4.16x. Six validation gates, two analytic limits the code was never tuned to, and one number retracted.' },
    ],
  },
];

export const Research: React.FC = () => {
  assertSectionsCover('research', SECTIONS);

  return (
    <>
      <h2>Research</h2>
      <CategoryIntro id="research">
        <p>
          Thirteen studies. Some reproduce a result with a known answer to find out what
          a fresh implementation gets wrong; some ablate a system the author built to
          find out which stage is actually costing him; some are audits of the
          instruments themselves, which is where several of the more uncomfortable
          findings came from.
        </p>
        <p>
          What they have in common is the reporting standard rather than the subject.
          Each one states what was measured, over how many trials, with the correction
          applied where multiple comparisons were made — and each one records the claims
          that did not survive. Several headline results on this page are smaller than
          the first version of themselves, and two were withdrawn outright. Those are
          left visible on purpose: a page that only shows the claims that held is not a
          research record, it is a highlight reel.
        </p>
      </CategoryIntro>
      {SECTIONS.map(s => (
        <CategorySection key={s.heading} section={s} />
      ))}
    </>
  );
};
