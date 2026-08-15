import React from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from './components/Layout';
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
import { ObservationTimeArticle } from './pages/articles/ObservationTimeArticle';

// DEV-ONLY client entry: renders the same page components Vite's dev server serves,
// picked by pathname. Production output comes from scripts/prerender.tsx (static, no JS).
const routes: Record<string, React.FC> = {
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
  '/observation-time/': ObservationTimeArticle,
};

// Clean URLs: tolerate a missing trailing slash in dev (/trainproof === /trainproof/).
const pathname = window.location.pathname;
const Page = routes[pathname.endsWith('/') ? pathname : `${pathname}/`] ?? Home;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Layout>
      <Page />
    </Layout>
  </React.StrictMode>,
);
