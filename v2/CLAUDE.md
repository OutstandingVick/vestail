# Vestail v2 — project context

Vestail is a country × asset-class ownership matrix with venue routing. This repo is a frontend handoff: a single-file web app, the data behind it split into modules, a reusable resolver package, an OpenAPI contract, and docs.

## Read first
- `docs/GLOSSARY.html` — vocabulary, architecture, build log
- `data/schema/README.md` — data model and roadmap
- `docs/api/API.md` then `docs/api/openapi.yaml` — the API to build
- `docs/diagrams/*.svg` — resolver pipeline and system flow

## Invariants (do not break)
- Status scale is `2 can_own / 1 conditional / 0 cannot_own`. Red must always be hatched, never colour alone.
- `countries.rules[who]` is indexed by `assets[].index`. Changing asset order changes every rule. Migrate to keyed rules before adding or reordering assets.
- The resolver returns a `trail` for every hit. Any new stage must add to the trail. Never resolve silently.
- Entities beat aliases. "tesla shares" must resolve to Tesla, not the generic "shares" bucket. `packages/core/test.js` guards this; run it after any resolver change.
- Every outbound venue url carries the ref tag. Tag logic should move server-side (`POST /orders/click`) when the API exists.
- HUD numbers must come from real order data before any public launch. Never ship the sample figures to production.

## Conventions
- No build step for `app/`; it stays a single self-contained HTML file. The API and any framework app live beside it, not instead of it.
- Data edits go in `data/*.json`; regenerate the inline data in `app/index.html` from them (or, better, make the app fetch them).
- Motion respects `prefers-reduced-motion`. Keep entrance animation to first paint only.
- Keep `docs/GLOSSARY.html` build log current when a phase lands.

## Commands
- `node packages/core/test.js` — resolver tests
- open `app/index.html` — the app (no server needed)
