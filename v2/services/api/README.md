# @vestail/api

Implements `docs/api/openapi.yaml` over `packages/core` and `data/*.json`. Hono on Node, no database: data loads at startup and clicks are held in memory.

```
npm start          # http://localhost:8787/v1
npm test           # unit tests + a contract test for every operation in the spec
```

The spec is served at `/v1/openapi.json`. Parameters and bodies are validated against it; `test/contract.test.js` checks every operation's response against its schema, so a path added to the spec without a route fails the build.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | Listen port |
| `VESTAIL_API_KEYS` | none | Comma-separated keys for `POST /orders/click`. With none set, every click is refused. |
| `VESTAIL_RATE_LIMIT` | `120` | GETs per IP per minute |
| `VESTAIL_TRUST_PROXY` | off | Set to `1` behind a proxy to rate-limit by `X-Forwarded-For` |
| `VESTAIL_CORS_ORIGINS` | `*` | Comma-separated origins allowed to call the API from a browser |
| `NODE_ENV` | | `production` stops `/activity` serving the sample figures |

## Behaviour the spec leaves open

- **Error codes beyond API.md:** `unauthorized` (401), `rate_limited` (429), `acknowledgement_required` (400), `not_found` (unknown route), `internal` (500).
- **Cannot own:** `/rules/{country}/{asset}` returns no venues, `/matrix` returns a cta with no venues, and `/orders/click` refuses the click. Conditional cells route only when the click carries `acknowledged: true`, as in Vestail v1; otherwise it's refused with `acknowledgement_required`.
- **Provenance:** `/rules/{country}/{asset}` returns the rule's `sources` and `verified_at` (added to the spec's `Rule`). Both are `[]` / `null` until the rule is sourced.
- **Clicks** must name a venue the rule lookup would list with an online url; the redirect is that url, tagged by the core. Clicks are attributed to the matching key's index, never the key itself.
- **`/activity`** puts recorded clicks first. Outside production it mixes in `data/activity.sample.json`; in production the stats come from recorded clicks only, and volume is 0 until real order data exists.
- **`/venues?ref=`** replaces the tag value; `partner_xyz` and `ref=partner_xyz` both work.
- **Unknown country** is 404 on `/rules/{country}` paths and 400 as a query value (`/matrix?countries=`, `/venues?country=`).

## Not production-ready yet

Clicks and rate-limit windows live in memory, so they reset on restart and aren't shared between instances. Both need a store before running more than one process.
