import type React from 'react';
import { Home } from './pages/Home';
import { Articles } from './pages/Articles';
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
};
