# Own API — builder guide

The machine-readable contract is `openapi.yaml`. This page is the ten-minute version.

## Mental model

```
text ──▶ /resolve ──▶ asset classes ──▶ /matrix ──▶ status per country ──▶ /venues ──▶ buy link
                                                        │
                                                        └──▶ POST /orders/click ──▶ /activity
```

Three verbs, three nouns:

| Verb    | Noun     | Endpoint                          |
|---------|----------|-----------------------------------|
| Resolve | query    | `GET /resolve?q=`                 |
| Look up | rule     | `GET /rules/{country}/{asset}`    |
| Route   | venue    | `GET /venues/{asset}?country=`    |

`GET /matrix` composes all three for a whole board in one call and is what the frontend uses.

## Buyer types
Every rule has two values. Pass `who=citizen` (default) or `who=foreigner`. A third type, `resident`, is planned; clients should treat unknown values as `foreigner` (the conservative case).

## The resolver contract
`/resolve` never guesses silently. Every response carries `stage` (which layer matched) and `trail` (the human-readable chain). Surface the trail; it is what makes a "Google → foreign equities" answer trustworthy.

Stages, in priority order:

1. `entity` – a named thing: company, coin, aircraft model, bond series. Companies carry `home`, and the response includes `perCountry` so callers know the asset differs by row.
2. `alias` – an everyday word: *house*, *stocks*, *gilts*.
3. `category` – a group name: *commodities*, *fixed income*.
4. `asset` – an asset class name, with prefix/typo tolerance.
5. `none` – nothing matched. Show the user the categories.

Multi-word queries are cleaned of filler ("can I buy…") and, if the phrase fails, retried per word with entities first, so *tesla shares* resolves to Tesla rather than the generic *shares* bucket.

## Examples

**Where can a Nigerian buy Google?**
```
GET /rules/NG/foreign_equities?who=citizen
→ { "status": "conditional", "venues": [{ "name": "Bamboo", "url": "https://investbamboo.com?ref=ownmatrix" }, …] }
```

**A foreigner wants farmland, anywhere**
```
GET /matrix?q=farmland&who=foreigner&sort=status
→ rows ranked most-open first; each row has one cell and a populated cta
```

**Your own venue tag**
```
GET /venues/cryptocurrency?country=IN&ref=ref=partner_xyz
```

## Attribution
Every Buy press should `POST /orders/click` before redirecting. The response returns the final redirect url so the tag logic lives server-side. This is the hook for referral revenue and payment-for-order-flow accounting; it also feeds the live ticker.

## Versioning and caching
- Path-versioned (`/v1`). Breaking changes to the status scale or buyer types bump the version.
- Reference endpoints (`/assets`, `/categories`, `/countries`, `/entities`, `/venues`) set `Cache-Control: max-age=86400`.
- `/matrix` and `/rules` may be cached for an hour; `/activity` must not be cached.

## Errors
Standard shape: `{ "error": { "code": "unknown_country", "message": "…" } }`. Codes: `unknown_country`, `unknown_asset`, `bad_buyer_type`, `validation`.

## Auth
Public read for reference and matrix endpoints, rate-limited by IP. `POST /orders/click` requires an API key (`Authorization: Bearer …`) so click volume can be attributed to a partner.
