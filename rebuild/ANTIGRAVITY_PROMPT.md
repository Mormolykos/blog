# Antigravity build spec — ai.bedvibe.studio React + TypeScript rebuild (v0.1)

Paste this whole file to Antigravity as the task. It is prescriptive on purpose:
build exactly this, run the acceptance checks at the bottom, and paste their output.

---

## Mission

Rebuild the static site currently at `C:\Users\User\Desktop\blog\static\` as a
**Vite + React + TypeScript** project that renders the site from a single
canonical data file, `src/data/site-data.json`, instead of hand-edited HTML.

The whole point is to **kill version drift**: today the version/status numbers are
hardcoded in HTML and rot. After this rebuild, every version, release, project
status, nav link, and article-listing entry comes from `site-data.json`. Change
the JSON → rebuild → the site updates. No number lives in a component.

The build output is **plain static files** (`dist/`) deployed by a plain file
copy to `/var/www/ai-blog` on the server. **There is NO Node server at runtime.**
Vite/npm is the build toolchain only.

---

## Non-negotiable constraints (do not violate any of these)

1. **No runtime server.** Output is static files. Nginx already serves the folder.
   Do not add Express/Fastify/Node server, SSR-at-runtime, or any always-on process.
2. **Preserve the exact live URLs.** The built site MUST produce these files at
   these exact paths (they are already indexed by Google/Bing — changing them loses
   SEO):
   - `dist/index.html`      → served at `https://ai.bedvibe.studio/`
   - `dist/articles.html`   → `/articles.html`
   - `dist/trainproof.html` → `/trainproof.html`
   - `dist/ttsproof.html`   → `/ttsproof.html`
   Do NOT switch to clean URLs like `/trainproof`. Keep the `.html`.
3. **Crawlable HTML, not an empty SPA shell.** Each built `.html` must contain the
   fully rendered content in its HTML source — article prose and the current
   version strings must be visible in `view-source`, NOT hidden behind
   `<div id="root"></div>` + JS. Prerender at build time. (This site's whole
   audience includes AI crawlers; an empty shell defeats the purpose.)
4. **Zero hardcoded content data in components.** No version numbers, release dates,
   nav hrefs, project taglines, or article titles typed into `.tsx` files. They
   come from `site-data.json` via typed access only. This is grep-checked below.
5. **Do not invent data.** Use `site-data.json` verbatim. In particular, trainproof's
   `current_version` is `0.10.0` while its `releases[]` newest entry is `0.9.0` —
   that gap is intentional and documented in the file's `_note`. Render the badge
   from `current_version` and the timeline from `releases[]`; do not fabricate a
   0.10.0 release entry to "fix" the mismatch.
6. **Do not touch** `C:\Users\User\Desktop\blog\static\` (the live site) or run any
   git/deploy commands. Build only. Deploy is the owner's separate manual step.
7. **Tight stack — no stack-stuffing.** Allowed deps only: `react`, `react-dom`,
   `typescript`, `vite`, `@vitejs/plugin-react`, and `tsx` (or `vite-node`) for the
   prerender script. No CSS framework, no UI kit, no state library, no router unless
   you genuinely need one for the prerender. If you want to add anything else, don't.

---

## Source material to read first

- `C:\Users\User\Desktop\blog\rebuild\site-data.json` — the canonical seed. Copy it
  verbatim to `src/data/site-data.json`. This is the source of truth.
- `C:\Users\User\Desktop\blog\static\style.css` — port the design tokens/styles verbatim.
- `C:\Users\User\Desktop\blog\static\index.html`, `articles.html`, `trainproof.html`,
  `ttsproof.html` — the current markup, head/meta, and (in the two article files) the
  full article prose you must port verbatim into React components.
- Assets to copy into the build as-is: `Bedvibe-logo.webp`, `BVfavicom.png`, `robots.txt`.

---

## The data contract (write this as `src/data/types.ts`)

```ts
export interface SiteData {
  _meta: { schema_version: number; generated_at: string; generated_by: string; sources: string[]; flags: string[] };
  site: {
    name: string;
    tagline: string;
    short_description: string;
    base_url: string;
    author: { name: string; url: string; linkedin: string; person_id: string; bio: string };
    org_url: string;
    org_id: string;
    portfolio_url: string;
    github_url: string;
    corner_link: { label: string; href: string };
    nav: { label: string; href: string; external: boolean }[];
  };
  projects: Project[];
  articles: Article[];
}

export interface Release { version: string; date: string; title: string; summary: string; url: string; }

export interface Project {
  id: string; name: string; tagline: string; description: string;
  status: string; current_version: string; current_release_date?: string;
  install: string; repo: string; pypi: string; license: string;
  doi?: string; doi_url?: string; built_on?: string;
  tests_passing: number; tests_as_of_version?: string; release_count: number;
  article_id: string; highlights: string[]; releases: Release[];
  _note?: string; // internal only — never render
}

export interface Article {
  id: string; title: string; dek: string; path: string; canonical: string;
  date_published: string; date_modified: string; display_date: string;
  project_id: string; og_type: string; citation: string | null;
}
```

Import the JSON typed: `import data from "./site-data.json"; export const site = data as unknown as SiteData;`
Enable `"resolveJsonModule": true` in tsconfig.

---

## File tree (target)

```
blog/react-site/                 # create the Vite project here (sibling of static/)
  index.html                     # Vite entry (dev only)
  package.json
  tsconfig.json
  vite.config.ts
  public/
    style.css                    # ported from static/style.css (+ new card styles)
    Bedvibe-logo.webp
    BVfavicom.png
    robots.txt
  src/
    data/site-data.json          # copied verbatim from rebuild/site-data.json
    data/types.ts
    data/site.ts                 # typed export + helpers (getProject, getArticle)
    components/Layout.tsx         # header + nav + footer, from data
    components/ProjectStatus.tsx  # the data-driven status card
    components/ReleaseTimeline.tsx
    components/ArticleCard.tsx
    pages/Home.tsx
    pages/Articles.tsx
    pages/articles/TtsproofArticle.tsx   # ported prose + <ProjectStatus> card
    pages/articles/TrainproofArticle.tsx # ported prose + <ProjectStatus> card
    head/head.ts                  # per-route <head> builder (title/desc/canonical/OG/JSON-LD)
  scripts/
    prerender.tsx                 # renders each route to dist/<file>, emits sitemap+llms
```

---

## Recommended approach (static prerender, no client JS)

Nothing on this site is interactive beyond links and one CSS glow animation, so
**v0.1 ships zero client-side React runtime** — you render the components to static
HTML at build time. This is the leanest correct thing and removes any hydration-
mismatch risk. (Interactivity/hydration can be added later; not now.)

- Use Vite for the dev server (`npm run dev`) and the CSS/asset pipeline + TS.
- `scripts/prerender.tsx` (run with `tsx`) imports each page component + `site-data.json`,
  renders with `renderToStaticMarkup` from `react-dom/server`, wraps the result in the
  page's `<head>` (from `head/head.ts`) + the HTML skeleton, and writes the exact files
  listed in constraint #2. The same script generates `dist/sitemap.xml` and `dist/llms.txt`
  from the data, and copies `public/*` into `dist/`.
- `npm run build` = `vite build` (bundles CSS) **then** `tsx scripts/prerender.tsx`.

If you prefer, `vite-react-ssg` is acceptable ONLY if you configure it to emit the exact
`.html` filenames from constraint #2 and satisfy the crawlability check. Do not accept
clean-URL output.

---

## What each surface renders (all from data)

**Layout** (`components/Layout.tsx`) — reused on every page:
- Header: corner link (`site.corner_link`), logo (`/Bedvibe-logo.webp`, links to `/`),
  `<h1>{site.name}</h1>`.
- Nav: map `site.nav`; external items get `target="_blank" rel="noopener"`; separate items with ` · `.
- Footer: author link (`site.author.url` → `site.author.name — BedVibe Studios`) `·` LinkedIn.

**Home** (`/` → `index.html`):
- Intro paragraph = `site.tagline`.
- **Projects** section: a `<ProjectStatus>` card for each `data.projects` (ttsproof first, then trainproof — array order).
- **Latest Articles**: map `data.articles` → `<ArticleCard>` (title links to `article.path`, `display_date`, `dek`).

**Articles** (`/articles.html`): heading "All Articles" + every `data.articles` as `<ArticleCard>`.

**Article pages** (`/ttsproof.html`, `/trainproof.html`):
- Port the `<article>…</article>` inner prose **verbatim** from the matching file in
  `static/` (convert `class=` → `className=`, self-close tags, escape `{`/`}` if any).
  **Do not rewrite the prose.** The article's historical version mentions (e.g.
  "v0.8.0 at the time of this update") stay as written — they are honest history.
- Above or below the prose, render the project's `<ProjectStatus>` card so the
  *current* truth is always data-driven and never drifts against the prose.

**ProjectStatus card** (`components/ProjectStatus.tsx`) — the core data-driven unit:
- Header row: `project.name`, a version pill `v{project.current_version}`, and `project.status`.
- `project.description`.
- Meta row (from data): install command in a `<code>` chip (`project.install`),
  latest documented release (`project.releases[0].version` · `releases[0].date`),
  `project.tests_passing` tests, `project.release_count` releases, `project.license`,
  DOI if `project.doi` present, "built on {built_on}" if present.
- Links: Repo (`project.repo`), PyPI (`project.pypi`), DOI (`project.doi_url`) if present,
  and "Read the article →" (`getArticle(project.article_id).path`).
- `project.highlights` as a bulleted list.
- `<ReleaseTimeline>`: `project.releases` as version · date · title (+ summary). Show the
  latest 3–4 with a "Full changelog on GitHub" link to `project.repo + "/releases"`, or
  list all — your call, keep it tidy.
- Never render `project._note` or anything under `_meta`.

---

## Design (port the existing look, then extend on-brand)

Port `static/style.css` essentially verbatim. Design tokens (keep exactly):

```css
--bg-color: #0b0f1a;  --text-color: #d9dfe8;  --accent-color: #4db8ff;
--header-bg: #111827; --nav-bg: #1f2937;      --border-color: #333;
```
- Body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`, `line-height: 1.6`.
- Header `<h1>`: Georgia serif, `1.8rem`, weight 500, color `#e9edf5`, `letter-spacing: 0.02em`.
- Logo: 140px, the `glowPulse` 4s blue drop-shadow animation, with the `prefers-reduced-motion` fallback.
- `main`: `max-width: 760px`, centered, `padding: 2rem 1rem`.
- `code`/`pre`: background `#1f2937`, radius 4px. Headings `#e9edf5`, `margin-top: 2rem`. Footer `#888`.

New **ProjectStatus card** styling, same visual language: panel background `#111827`/`#1f2937`,
`1px solid #333` border, ~10px radius, subtle padding. Version pill = accent `#4db8ff` text on a
faint accent-tinted background, monospace. Keep it clean and readable — beautiful, not busy.
Must look good down to 360px wide (single column). Respect the existing dark theme; don't add a light mode.

---

## SEO (reproduce per page — this is a hard requirement)

Each built page's `<head>` must carry, driven by data where applicable:
- `<title>` and `<meta name="description">` — per page (reuse the exact strings from the
  current `static/` files for the four pages).
- `<link rel="canonical">` = the `article.canonical` (articles) or the site page URL.
- Open Graph: `og:title`, `og:description`, `og:type` (`website` for home/articles,
  `article` for the two posts).
- `<link rel="icon" type="image/png" href="/BVfavicom.png">` and `<link rel="stylesheet" href="/style.css">`.
- JSON-LD: port the `Blog` node (home) and the two `BlogPosting` nodes (articles) from the
  current files, keeping the same `@id`s, author/publisher `@id` references, `datePublished`/
  `dateModified`, and the ttsproof `citation` DOI.
- Regenerate `dist/sitemap.xml` and `dist/llms.txt` from data (same 4 URLs as today).
  Keep `robots.txt` as-is.

---

## Acceptance self-checks — RUN THESE and paste the output

Run every command from the project root after `npm run build`. All must pass.

1. **Types clean:** `npx tsc --noEmit` → no errors.
2. **Build clean:** `npm run build` → exit 0.
3. **All required files exist:**
   `ls dist/index.html dist/articles.html dist/trainproof.html dist/ttsproof.html dist/sitemap.xml dist/llms.txt dist/robots.txt dist/style.css dist/Bedvibe-logo.webp dist/BVfavicom.png`
4. **Crawlable, not a shell** (each must print a match, proving prerendered content is in the HTML):
   - `grep -c "GPUB" dist/ttsproof.html`            (article prose present)
   - `grep -c "0.3.1" dist/ttsproof.html`           (ttsproof current version rendered)
   - `grep -c "Loss Curves Lie" dist/trainproof.html`
   - `grep -c "0.10.0" dist/trainproof.html`        (trainproof current version rendered)
   - Confirm none of the four files is just `<div id="root"></div>` with a script tag.
5. **No hardcoded content data in components** (must return NOTHING):
   `grep -rEn "0\.3\.1|0\.10\.0|0\.9\.0|0\.3\.0" src/components src/pages`
   (Version strings may appear ONLY in `src/data/`. If this matches anything in a
   component/page, move it into the data flow.)
6. **Canonicals correct:** each `dist/*.html` contains its own canonical URL matching
   the live URL (grep `rel="canonical"` in each; verify against constraint #2).
7. **Truly static:** `cd dist && python -m http.server 8080` then load
   `http://localhost:8080/`, `/articles.html`, `/trainproof.html`, `/ttsproof.html` — all
   render fully with no server-side code and no console errors.

Paste the output of checks 1–6 and a one-line confirmation of 7.

---

## Out of scope for v0.1 (do NOT build)

- Deployment (owner does the file copy to `/var/www/ai-blog` himself).
- Client-side hydration/interactivity, search, comments, dark/light toggle.
- Fetching from GitHub/PyPI/Zenodo at build or runtime — the data is the seed file.
  (Later, an orchestrator will produce `site-data.json`; for now it's hand-maintained.)
- Any new article. Only the two existing articles are ported.

Build exactly the above. When the acceptance checks pass, stop and report.
