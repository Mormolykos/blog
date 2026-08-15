# ai.bedvibe.studio — the engineering notebook

Static site. React + TypeScript, prerendered to HTML at build time, served by nginx
as plain files. **Zero JavaScript ships to the browser.** There is no Node server,
no database, and nothing on the server generates anything.

Its role, fixed: the portfolio answers *what*, GitHub answers *how to use it*, and
this site answers *why, and what it turned out to be wrong about*.

## Source of truth

Only these produce the site. Nothing else in this repository does.

    react-site/src/data/site-data.json    the registry — projects, versions, articles
    react-site/src/pages/articles/*.tsx   article bodies
    react-site/src/pages/               Home (newest 4) and Articles (full archive)
    react-site/src/components/          Layout, ArticleCard, ProjectStatus, ReleaseTimeline
    react-site/src/routes.ts            THE route table — one list, used by both builds
    react-site/src/head/head.ts          <head>, canonicals, JSON-LD
    react-site/public/                   style.css, images, verification files
    react-site/scripts/prerender.tsx     the only thing that writes dist/
    react-site/scripts/deploy.ps1        the only supported deploy

Everything else is history and is read by nothing:

- `src/`, `Cargo.toml`, `Cargo.lock` — the retired Rust `blog_server`. It is
  **stopped and disabled** on the server. Never restart it.
- `static/` — the hand-written HTML site the React build replaced on 2026-07-24.
- `rebuild/` — the 2026-07-24 rebuild spec and its original seed data. See
  `rebuild/README.md`; the seed file describes two articles and must never be
  copied over the live one.
- `notes/`, `drafts/` — unpublished internal research. **Gitignored on purpose.
  This repository is public.** Do not remove those ignore rules.

## Publishing an article

1. `react-site/src/pages/articles/<Name>Article.tsx` — the body
2. `react-site/src/data/site-data.json` → `articles[]` — id, title, dek, path,
   canonical, dates, og_type, citation, and image if it has one
3. `react-site/src/routes.ts` — import it, add `'/<path>/': <Name>Article`
4. `cd react-site; .\scripts\deploy.ps1`

Nav, sitemap, `llms.txt` and both listing pages update themselves from the data.
The build throws if `site-data.json` lists an article with no route, so a
listed-but-404 article cannot ship. Position in `articles[]` does not matter —
listings sort by `date_published`.

## Deploying

    cd react-site
    .\scripts\deploy.ps1            # typecheck, build, safety check, upload, verify
    .\scripts\deploy.ps1 -DryRun    # everything except the upload

It refuses to upload a build with fewer article pages than the live site already
has. That is the one failure this site is genuinely exposed to: a stale
`site-data.json` builds cleanly and successfully, and simply omits articles.

**Never use `rsync --delete`, or any delete flag, against `/var/www/ai-blog`.**
`BingSiteAuth.xml` and `f435b2689624afd162586cc8070b7d7d.txt` are search-engine
verification files. They are in `public/` so a build carries them — but a delete
pass that runs before a build is not covered by that.

Deleting a published article is therefore a deliberate server-side step: remove
it from `site-data.json` and `routes.ts`, deploy with `-Force`, then remove the
old directory on the server by hand. The URLs are indexed; prefer not to.

## Nothing here changes by itself

No scheduled task, cron job, systemd timer or CI workflow writes to
`site-data.json`, `src/pages/articles/`, `dist/`, or `/var/www/ai-blog`. Audited
2026-08-15 across all Windows scheduled tasks, both crontabs, `/etc/cron.d` and
every systemd timer.

Two programs read this site without writing to it: `portfolio_agent/ingest.py`
indexes `react-site/dist` for the RAG agent — **so deploy before re-indexing, or
the agent cites URLs that 404** — and the orchestrator's `siblings` connector
compares the mtime of `site-data.json` against `dist/index.html` to report a stale
build.

One program can write to `site-data.json`, and only when asked by hand:
`portfolio_agent/gen_site_data.py --write` refreshes version numbers, release
counts and test counts from PyPI, the GitHub Releases API and `pytest
--collect-only`. It never writes prose. Without `--write` it only reports drift.
