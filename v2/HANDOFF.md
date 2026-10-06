# Vestail v2: engineering handoff

Written for whoever picks this up next, human or agent. It assumes no prior context.

## 1. What this is

**Vestail v1** (the Next.js app at the repo root, live at vestail.fun) answers: *which tokenized version of this stock am I actually allowed to hold?* One ticker, say NVDA, exists onchain as several different legal claims — xStocks holds real shares in custody, Ondo's note tracks the price, Backpack's is an entitlement through a broker. v1 gives each version a verdict for the buyer's declared country and routes a purchase through Jupiter only to versions they may hold.

**Vestail v2** (this folder) widens the question to *what can I own in this country, and where do I buy it?* — 20 asset classes across 12 countries, for citizens and foreigners. It started from a mentor's example handoff (then called "Own"; renamed everywhere except `CLAUDE_CODE_FIRST_PROMPT.md`, which is kept as the original brief).

Three things carry over from v1 and must not be quietly dropped:

1. **Three verdicts, never two.** `can_own` / `conditional` / `cannot_own`. The middle state is the product: assets anyone can buy but can't redeem, collect on or exit without clearing a licence, cap, approval or KYC gate. Folding it into either neighbour destroys the point.
2. **Disclosure, not enforcement.** The buyer declares their country and buyer type. There is no KYC, no identity check, no blocking. Vestail shows the rule and routes.
3. **Conditional is gated.** A conditional cell is only bought after the buyer ticks an acknowledgement. The page locks the links; the API refuses the click without `acknowledged: true`. Both halves matter — the checkbox is convenience, the server check is the guarantee.

## 2. Where things are

```
v2/
├── app/index.html        the whole front end: one self-contained file, no build step (~1470 lines)
├── packages/core/        @vestail/core — resolver + rule matrix, zero dependencies, data injected
├── services/api/         @vestail/api — Hono on Node, implements docs/api/openapi.yaml
├── data/*.json           assets, categories, aliases, entities, countries, venues, activity sample
├── data/schema/          the data model (README.md) and its JSON Schema (schemas.json)
├── docs/GLOSSARY.html    vocabulary, architecture, design system, build log, open questions
├── docs/api/             openapi.yaml (the contract) and API.md (the ten-minute version)
├── docs/DESIGN_HANDOFF.md  brief for a designer: brand tokens, screens, states
├── DEPLOY.md             running the API and serving the page
├── CLAUDE.md             the invariants, in short form
└── scripts/              serve-page.js (local preview) and split-data-from-app.cjs (regenerate data/)
```

**Branch:** all v2 work lives on `v2-own`, which is ~109 commits ahead of `main`. `main` is frozen as the STOCKLANA-judged v1 and must not change until judging is settled; merge `v2-own` into it via PR afterwards. Hotfixes go to `main` first, then merge into `v2-own`.

## 3. Running it

Node 22+ (developed on 24). Everything from `v2/`, which is an npm workspace.

```bash
npm ci
npm test                                        # 64 API tests + the core's own suite
VESTAIL_API_KEYS=local-dev-key npm start -w @vestail/api   # API on :8787/v1
VESTAIL_API_KEY=local-dev-key node scripts/serve-page.js   # page on :8080, wired to the API
```

`app/index.html` also opens straight from disk and works offline on its inline copy of the data.

Other commands: `node packages/core/test.js` (resolver only), `node scripts/split-data-from-app.cjs` (regenerate `data/*.json` from the page's inline data; it preserves existing provenance).

## 4. How the pieces fit

- **`packages/core`** takes all data as arguments and exposes `resolve(query)`, `matrix(query, who)`, `venues(asset, country)` and `rule(country, who, asset)`. It speaks asset **names**; the API speaks asset **ids** and maps between them in `services/api/src/data.js`.
- **The resolver** runs ordered stages — entity → alias → category → asset — and returns a `trail` explaining every hop. Entities beat aliases, so "tesla shares" resolves to Tesla, not the generic shares bucket. `packages/core/test.js` guards this.
- **The API** validates every request against `openapi.yaml` itself (`src/validate.js` compiles the spec's own schemas), so the contract and the implementation cannot drift. `test/contract.test.js` calls every operation in the spec and checks the response against its declared schema — add a path to the spec without implementing it and the tests fail.
- **The page** uses the API when `window.VESTAIL_API` is set and falls back to its inline data when it isn't, or when the API is unreachable. Buy presses go through `POST /orders/click`, which returns the tagged redirect.

## 5. Invariants (`CLAUDE.md` has these too)

- Status scale is `2 can_own / 1 conditional / 0 cannot_own`. Red is **always hatched**, never colour alone.
- `countries.rules[who]` is keyed by asset id: `{ asset_id: { status, sources, verified_at } }`. Every asset needs a rule for every country and buyer type; the core refuses to load otherwise and names the offender. The page's inline copy is still positional — keep it in asset order.
- **Never invent `sources` or `verified_at`.** They stay `[]` and `null` until a rule is checked against a real document.
- Conditional needs the acknowledgement; cannot-own is never routed, not even quoted. Don't loosen either.
- Every outbound venue url carries `ref=vestail`. **Ask before touching `data/venues.json` or the ref-tag logic** — they tie to commercial agreements.
- The activity figures must come from real order data before launch. `NODE_ENV=production` already stops the sample numbers being served.
- `app/` stays one self-contained HTML file with no build step.
- The resolver returns a trail for every hit. Any new stage must add to it. Never resolve silently.

## 6. Design system, in brief

Light, dark-only was dropped. Full detail in `docs/GLOSSARY.html` (design system section) and `docs/DESIGN_HANDOFF.md`.

| Token | Value | Job |
|---|---|---|
| Background | `#E3E4DC` | Page (warm sage) |
| Surface | `#FFFFFF` | Cards, the nav bar |
| Country cards | `#E3DEEF` | Lavender; also the problem section's lead card |
| Text / muted | `#0D0D0F` / `#636069` | Muted holds 4.5:1 on page, white and lavender |
| Orange | `#FF580A` | **Actions only** — Search, See where, Buy |
| Purple | `#7C5CFF` (`#5A3DF0` for small text) | **Emphasis only** — never an action, never a verdict |
| Verdicts | `#5C9A4A` / `#BF861C` / `#C9604F` | Verdicts only; cannot-own always hatched |

Type is Outfit (300–800). Corner scale: panels 28, cards 20, fields 16, buttons and small tiles 12, verdict tiles 6, pills. Contrast was measured, not assumed — if you change a colour, re-measure the text on it.

## 7. What is done

- The API: all 11 spec operations, spec-driven validation, the documented error shape, cache headers, IP rate limiting, API-key-gated clicks, CORS.
- The page on the API, with offline fallback.
- Rules keyed by asset id, each with `sources` and `verified_at` (all empty).
- The conditional acknowledgement, enforced both ends.
- Brand: v1's identity, then the current light palette.
- Six story sections below the board (problem, how it works, verdicts, buy, trust, FAQ) and a closing call to action.
- Country cards as a two/three-column grid with a segmented verdict track and an inset buy panel.
- A sticky, full-width nav.
- 12 countries, 20 assets, 2 buyer types.

## 8. What is next

**Blocking a real launch:**

1. **Source the rules.** All **480** of them (12 countries × 20 assets × 2 buyer types) are illustrative and **0 are sourced**. Each needs `sources: [{title, url}]` and a `verified_at` date. `data/schema/schemas.json` validates the shape and `services/api/test/data-schema.test.js` runs it over the data, so a malformed source fails the build. This is the single biggest gap: the product's claim is accuracy and right now it has none.
2. **Move clicks and rate-limit state out of memory.** Both reset on restart and aren't shared, so only one API instance can run. See `services/api/src/clicks.js` and `ratelimit.js`.
3. **Decide partner keys and ref tags.** The page must carry an API key to record clicks, and anything in a public page is readable. Fine for tagging "from the Vestail site", useless as authentication. Per-partner tags and deep links are unagreed.

**Known issues worth fixing:**

4. **`/matrix` is cached for an hour in the browser** (`Cache-Control: public, max-age=3600`, per `docs/api/API.md`). After a rule change, clients keep serving the old board until it expires. That is a sensible default for a static catalogue and a bad one for a compliance product — consider a shorter max-age plus `stale-while-revalidate`, or a data-version query parameter.
5. **The page's inline data duplicates `data/*.json`.** They are kept in step by `scripts/split-data-from-app.cjs`, but it is a manual step and they can drift. Better: have the page fetch `data/` when no API is configured.
6. **Provenance is stored but never shown.** Once rules are sourced, the UI needs to show where a verdict comes from and how fresh it is. `docs/DESIGN_HANDOFF.md` §5B specifies the states.

**Product decisions the owner has flagged, not yet built:**

7. **Region pre-fill from IP, kept editable.** The pitch says IP detection; v1 and v2 are self-declared on purpose. If built, it must pre-fill and stay changeable — never silent detection.
8. **A `resident` buyer type**, between citizen and foreigner.
9. **Offchain buying through licensed partners** (real estate, listed shares, government bonds) alongside the onchain routing. The "buy" section already labels these "Planned".
10. **A second compliance area** (tax, immigration) on the same data shape — the mentor's "open compliance layer".

## 9. Conventions

- Commit messages: plain sentences explaining *why*, not just what. Look at `git log` on `v2-own` for the register.
- Keep `docs/GLOSSARY.html`'s build log current when a phase lands.
- Verify UI changes in a browser before claiming them, including phone width (375px) — several bugs in this history were only visible there.
- Don't add a visual affordance that does nothing (the nav deliberately has no dropdown chevrons, because there is nothing to drop down).

## 10. Watch out for

- **`v2/` is an ES module workspace.** CommonJS scripts need the `.cjs` extension; `scripts/split-data-from-app.cjs` was broken by this once.
- **Generic CSS class names collide.** `app/index.html` is one file with one global stylesheet. A bar modifier named `.key` once picked up the asset-key section's white card. Prefix or pick distinctly.
- **The API reads `data/*.json` once at startup.** Restart it after editing data, or you will debug a stale board.
- **Media queries must come after the rules they override** in this single stylesheet. A breakpoint placed in an earlier block silently did nothing.
- **Decorative layers can widen the document.** A background layer inset past the section gave the whole page a horizontal scrollbar. Check `document.documentElement.scrollWidth > innerWidth` after layout changes.
