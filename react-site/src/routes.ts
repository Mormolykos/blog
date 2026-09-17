import type React from 'react';
import { Home } from './pages/Home';
import { Articles } from './pages/Articles';
import { Research } from './pages/Research';
import { Benchmarks } from './pages/Benchmarks';
import { Software } from './pages/Software';
import { Engineering } from './pages/Engineering';
import { TtsproofArticle } from './pages/articles/TtsproofArticle';
import { TrainproofArticle } from './pages/articles/TrainproofArticle';
import { AiAuthorshipArticle } from './pages/articles/AiAuthorshipArticle';
import { CorruptedDataArticle } from './pages/articles/CorruptedDataArticle';
import { EosCollisionArticle } from './pages/articles/EosCollisionArticle';
import { PhotopeaArticle } from './pages/articles/PhotopeaArticle';
import { CanonStateArticle } from './pages/articles/CanonStateArticle';
import { GreybodyArticle } from './pages/articles/GreybodyArticle';
import { SpeakerDriftArticle } from './pages/articles/SpeakerDriftArticle';
import { FemKirschArticle } from './pages/articles/FemKirschArticle';
import { ObservationTimeArticle } from './pages/articles/ObservationTimeArticle';
import { CompiledChronologyArticle } from './pages/articles/CompiledChronologyArticle';
import { NotcheckedArticle } from './pages/articles/NotcheckedArticle';
import { SuccessRateArticle } from './pages/articles/SuccessRateArticle';
import { RetrievalCoverageArticle } from './pages/articles/RetrievalCoverageArticle';
import { WorkArticle } from './pages/articles/WorkArticle';
import { CrawledNotIndexedArticle } from './pages/articles/CrawledNotIndexedArticle';
import { NotEnoughInfoArticle } from './pages/articles/NotEnoughInfoArticle';
import { BrokenInstrumentsArticle } from './pages/articles/BrokenInstrumentsArticle';
import { StructureNotScaleArticle } from './pages/articles/StructureNotScaleArticle';
import { IndexAnsweredItArticle } from './pages/articles/IndexAnsweredItArticle';
import { EncodersDisagreeArticle } from './pages/articles/EncodersDisagreeArticle';
import { RetrievalAblationArticle } from './pages/articles/RetrievalAblationArticle';
import { DecisionRiskArticle } from './pages/articles/DecisionRiskArticle';
import { HandWrittenKernelArticle } from './pages/articles/HandWrittenKernelArticle';
import { DecoderBenchmarkArticle } from './pages/articles/DecoderBenchmarkArticle';

// THE route table. One list, two consumers: scripts/prerender.tsx (production
// static build) and src/main.tsx (dev preview).
//
// It used to be three lists -- the renderPage() calls, a hand-typed `registered`
// set beside them, and the dev table in main.tsx. The `registered` set existed to
// prove every article in site-data has a page, but because it was typed by hand it
// could agree with site-data while disagreeing with the actual renderPage() calls:
// add a path there, forget the render call, and the guard passes while the article
// 404s -- the exact failure it was written to catch. Deriving the guard from this
// table makes that impossible.
export const routes: Record<string, React.FC> = {
  '/': Home,
  '/articles/': Articles,
  // The four sections. /articles/ remains the full archive in date order; these group
  // the same articles by what kind of work they are. Their paths are declared in
  // site-data.json categories[], which the sitemap, llms.txt and head.ts all read --
  // this table is the only place they are bound to a component.
  '/research/': Research,
  '/benchmarks/': Benchmarks,
  '/software/': Software,
  '/engineering/': Engineering,
  '/ttsproof/': TtsproofArticle,
  '/trainproof/': TrainproofArticle,
  '/ai-authorship/': AiAuthorshipArticle,
  '/corrupted-training-data/': CorruptedDataArticle,
  '/eos-collision/': EosCollisionArticle,
  '/photopea-scripting/': PhotopeaArticle,
  '/canon-state/': CanonStateArticle,
  '/greybody/': GreybodyArticle,
  '/speaker-drift/': SpeakerDriftArticle,
  '/fem-kirsch/': FemKirschArticle,
  '/observation-time/': ObservationTimeArticle,
  '/compiled-chronology/': CompiledChronologyArticle,
  '/notchecked/': NotcheckedArticle,
  '/success-rate/': SuccessRateArticle,
  '/retrieval-coverage/': RetrievalCoverageArticle,
  '/work/': WorkArticle,
  '/crawled-not-indexed/': CrawledNotIndexedArticle,
  '/broken-instruments/': BrokenInstrumentsArticle,
  '/not-enough-info/': NotEnoughInfoArticle,
  '/structure-not-scale/': StructureNotScaleArticle,
  '/index-answered-it/': IndexAnsweredItArticle,
  '/encoders-disagree/': EncodersDisagreeArticle,
  '/retrieval-ablation/': RetrievalAblationArticle,
  '/decision-risk/': DecisionRiskArticle,
  '/hand-written-kernel/': HandWrittenKernelArticle,
  '/decoder-benchmark/': DecoderBenchmarkArticle,
};
