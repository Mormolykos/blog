import React from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { routes } from './routes';

// DEV-ONLY client entry: renders the same page components Vite's dev server serves,
// picked by pathname. Production output comes from scripts/prerender.tsx (static, no JS).
// The route table lives in src/routes.ts so dev and production cannot drift apart.

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
