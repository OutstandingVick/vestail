# @vestail/api

Implements the internal `/v1` API and the partner-facing Vestail Eligibility API at `/api/v1`. Both reuse `packages/core` and `data/*.json`; the public adapter never duplicates the eligibility rules.

```
npm start          # internal: /v1, public: /api/v1
npm test           # unit tests + a contract test for every operation in the spec
```

The internal spec is served at `/v1/openapi.json`. The public OpenAPI 3.1 spec is generated from its Zod request and response schemas and served at `/api/v1/openapi.json`.

## Public Eligibility API

Public requests use `Authorization: Bearer <key>`. The OpenAPI document and CORS preflights are the only unauthenticated public routes.

```bash
# Issue a test key. The plaintext appears once; only its SHA-256 hash is stored.
npm run keys -w @vestail/api -- issue --mode test --label "Design partner" --limit 60

npm run keys -w @vestail/api -- list
npm run keys -w @vestail/api -- usage key_0123456789ab
npm run keys -w @vestail/api -- revoke key_0123456789ab
```

Keys use `vst_test_` or `vst_live_` prefixes. Each key has its own fixed one-minute limit. Successful authenticated requests increment one daily counter; request bodies are never written to the key store.

Public verdicts are `eligible`, `conditional`, and `restricted`. `unverified` is a separate research state: if the governing rule lacks a source, the API returns `unverified` even when the internal rule has a status. The current rule data distinguishes citizens and foreigners; resident requests therefore return `unverified` until resident-specific source-backed rules exist.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | Listen port |
| `VESTAIL_API_KEYS` | none | Comma-separated keys for `POST /orders/click`. With none set, every click is refused. |
| `VESTAIL_RATE_LIMIT` | `120` | GETs per IP per minute |
| `VESTAIL_TRUST_PROXY` | off | Set to `1` behind a proxy to rate-limit by `X-Forwarded-For` |
| `VESTAIL_CORS_ORIGINS` | `*` | Comma-separated origins allowed to call the API from a browser |
| `VESTAIL_PARTNER_KEYS_FILE` | `.data/partner-keys.json` | Hash-only partner key records and per-day usage counts |
| `NODE_ENV` | | `production` stops `/activity` serving the sample figures |

## Behaviour the spec leaves open

- **Error codes beyond API.md:** `unauthorized` (401), `rate_limited` (429), `acknowledgement_required` (400), `not_found` (unknown route), `internal` (500).
- **Cannot own:** `/rules/{country}/{asset}` returns no venues, `/matrix` returns a cta with no venues, and `/orders/click` refuses the click. Conditional cells route only when the click carries `acknowledged: true`, as in Vestail v1; otherwise it's refused with `acknowledgement_required`.
- **Provenance:** `/rules/{country}/{asset}` returns the rule's `sources` and `verified_at` (added to the spec's `Rule`). Both are `[]` / `null` until the rule is sourced.
- **Clicks** must name a venue the rule lookup would list with an online url; the redirect is that url, tagged by the core. Clicks are attributed to the matching key's index, never the key itself.
- **`/activity`** puts recorded clicks first. Outside production it mixes in `data/activity.sample.json`; in production the stats come from recorded clicks only, and volume is 0 until real order data exists.
- **`/venues?ref=`** replaces the tag value; `partner_xyz` and `ref=partner_xyz` both work.
- **Unknown country** is 404 on `/rules/{country}` paths and 400 as a query value (`/matrix?countries=`, `/venues?country=`).

## Deployment note

Partner key records and daily usage counts use an atomic local JSON file. Rate-limit windows remain in process. Before running multiple API instances, move key records, counters, and rate-limit windows to a shared transactional store. The storage interface is injected into `createApp`, so this does not require changing eligibility logic.
