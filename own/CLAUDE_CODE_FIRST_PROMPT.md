# First prompt for Claude Code

Unzip `own-handoff.zip`, `cd own-handoff`, run `claude`, and paste the block below.

---

I'm setting up a new project from a frontend handoff. Read CLAUDE.md, then docs/GLOSSARY.html, data/schema/README.md and docs/api/API.md before doing anything. Run `node packages/own-core/test.js` to confirm the resolver works.

Context: Own is a country × asset-class ownership matrix ("can a citizen or foreigner own X in country Y, and where do they buy it"). The single-file app in app/index.html is the reference UI and must keep working as-is. The data in data/ is modular JSON and is the source of truth. packages/own-core is the resolver and matrix logic as a dependency-free ES module. docs/api/openapi.yaml is the API contract to build. This will sit in front of an existing business that already has users, an order flow and venue relationships; assume we will plug real data into the same shapes.

Do this, in order, and stop for my review after each step:

1. Turn this into a proper repo. Initialise git, add a root package.json with workspaces for `packages/*` and a new `services/api`, add a `.gitignore`, and make `npm test` run the core tests. Do not change app/index.html.

2. Build `services/api` as a small Node HTTP service (no framework heavier than Hono or Fastify) that implements docs/api/openapi.yaml exactly, backed by packages/own-core and the JSON in data/. Serve the spec at /v1/openapi.json. Add request validation against the spec and the error shape from API.md. Include a smoke test for every endpoint.

3. Make app/index.html optionally fetch from the API: if `window.OWN_API` is set, load reference data and call /matrix and /activity instead of using the inline data; otherwise behave exactly as now. Wire the Buy button to POST /orders/click and follow the returned redirect. Keep the file self-contained and keep the fallback working offline.

4. Migrate `countries.rules` from positional arrays to keyed objects (asset id → status) per the roadmap in data/schema/README.md, update the core and tests, and add `sources[]` and `verified_at` fields to every rule so we can show provenance. Leave values as they are; I'll fill sources.

5. Update docs/GLOSSARY.html's build log with what you shipped and write a short DEPLOY.md for running the API and serving the app.

Constraints: follow the invariants in CLAUDE.md, keep the resolver's trail behaviour, don't add a frontend framework, and ask me before touching anything under data/venues.json or the ref tag logic since those tie to commercial agreements.
