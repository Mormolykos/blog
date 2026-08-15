# rebuild/ — historical. Nothing here is used by the build.

This folder is the record of how ai.bedvibe.studio was rebuilt as a React site on
2026-07-24. It is kept for provenance and it is **read by no program**.

## Do not use these files

`site-data.ORIGINAL-SEED-2026-07-24.txt` was the hand-seeded input for that
rebuild. It describes **two projects and two articles**. The live site has eleven
articles.

It used to be called `site-data.json` — the same filename as the live one, one
folder away. Copying it over the canonical file would have deleted nine articles
from the home page, the archive, `sitemap.xml` and `llms.txt` at the next build,
silently, with no error. The extension was changed to `.txt` on 2026-08-15 so it
cannot be dropped into place without a deliberate rename.

`ANTIGRAVITY_PROMPT.md` is the original build specification. Historical only; the
site has moved past it.

## The real source of truth

    react-site/src/data/site-data.json     versions, articles, projects, nav
    react-site/src/pages/articles/*.tsx    article bodies
    react-site/src/routes.ts               the one route table
    react-site/scripts/prerender.tsx       the only thing that writes dist/

See `../README.md`.
