import React from 'react';
import { SectionIcon } from '../components/SectionIcon';
import { CategorySection, CategoryIntro, assertSectionsCover } from '../components/CategoryPage';

const SECTIONS = [
  {
    heading: 'Speech',
    note: 'One panel, held constant in the words spoken so that only the delivery and the model change.',
    items: [
      { id: 'encoders-disagree', line: 'Eight speakers each recorded the same 1,360 sentences in six phonation states, so the words are held constant and only the delivery changes. Over one frozen list of 11,935 trials, equal error rate ran from 0.047 to 0.233 — produced by nothing but the choice of encoder, with 29 of 91 pairwise comparisons surviving Holm-Bonferroni correction. CAMPPlus is last for every speaker and every condition, and the mechanism is impostor-score compression. Parameter count does not order the panel. Ten claims were retracted along the way.' },
      { id: 'decoder-benchmark', line: 'Twenty neural audio decoders through five pre-registered gates on identical audio. Only three reproduce full-context output from partial input with load-bearing state; fifteen are stateless chunking, and the non-causal negative controls sit at exactly 1. The sole pre-registered quality metric was then beaten by Griffin-Lim — zero trained parameters — in six states of six, which the pre-registration had declared in advance would be a finding about the metric. A second measurement sharing no implementation found a near-zero median additional change for the same three arms when streamed, with no detection threshold claimed. Corrected after publication, when a fifth audit round found the advertised reproduction commands did not run. No listening test was run, so nothing here says which decoder sounds best.' },
    ],
  },
  {
    heading: 'Models and language',
    note: 'What changes when the model gets bigger, and what does not change at all.',
    items: [
      { id: 'compiled-chronology', line: 'Five local models against one fact their source text does not contain. Scaling recovered none of it. Compiling the fact worked — above a threshold, with a regression in the middle where the model stopped abstaining and started agreeing.' },
      { id: 'not-enough-info', line: 'On the standard benchmark for contradictory biomedical claims, 77.1% of the flagged pairs never state what a verdict would need. Seven of eight model runs asserted contradiction more often on exactly those pairs, and instructing the model to be conservative raised its refusal rate by forty points without changing the direction at all. 5,824 judgements, all local, with an audit script that recomputes every number.' },
    ],
  },
  {
    heading: 'Compute',
    note: 'A comparison whose useful answer was the crossover point, not the winner.',
    items: [
      { id: 'hand-written-kernel', line: 'A hand-written Triton LayerNorm against PyTorch eager and torch.compile on one GPU, at six batch sizes. Above roughly 4,096 rows the kernel wins on time and wins harder on memory — 1.36x faster at 65,536 rows using half the peak memory. Below that crossover it loses, and the model in question trains at 128 rows, where it is 1.67x slower than doing nothing. Includes the two defects the harness found in itself and one cell too unstable to quote.' },
    ],
  },
];

export const Benchmarks: React.FC = () => {
  assertSectionsCover('benchmarks', SECTIONS);

  return (
    <>
      <h1><SectionIcon name="benchmarks" /> Benchmarks</h1>
      <CategoryIntro id="benchmarks">
        <p>
          Four controlled comparisons. Each one holds everything constant except the
          single thing being compared — the encoder, the model size, the kernel — and
          reports the spread rather than a winner, because the spread is usually the
          part that changes a decision.
        </p>
        <p>
          Where several things are compared at once the p-values are corrected for it,
          and where a result depends on an arbitrary choice — which clips were drawn,
          which batch size the model actually runs at — that dependence is stated
          instead of averaged away. Two of these panels reversed the author&rsquo;s own
          prediction, and one of them is most useful for the cell it refuses to quote.
        </p>
      </CategoryIntro>
      {SECTIONS.map(s => (
        <CategorySection key={s.heading} section={s} />
      ))}
    </>
  );
};
