# Partner API

`/api/v1` — the surface built for third parties. Keyed on every endpoint, batched by
design, and speaking a different vocabulary from the internal API.

> **Not reachable yet.** `vestail.fun/api/v1/*` answers 404. The code is written and
> tested; nothing is exposed. See [README](./README.md).

## The one call that matters

```bash
curl -X POST https://api.vestail.fun/api/v1/check \
  -H "Authorization: Bearer $VESTAIL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "country": "NG",
        "residency": "foreigner",
        "asset": { "class": "agricultural_land" }
      }'
```

```json
{
  "ruleId": "NG:agricultural_land:foreigner",
  "verdict": "conditional",
  "reasons": ["..."],
  "conditions": ["..."],
  "sources": [],
  "lastVerified": null,
  "ruleVersion": "...",
  "disclaimer": "..."
}
```

Everything else on this surface is a variation on that question.

## The request

| Field | Type | Notes |
|---|---|---|
| `country` | string | ISO 3166-1 alpha-2, case-insensitive on input. |
| `residency` | enum | `citizen`, `resident` or `foreigner`. |
| `asset.class` | string | Required. An asset class id. |
| `asset.symbol` | string | Optional. A ticker, for a tokenised version. |
| `asset.id` | string | Optional. A specific instrument. |

The schema is `.strict()`: an unrecognised field is a `400`, not an ignored key. That is
deliberate — a typo in `residencty` should fail loudly rather than quietly defaulting you
to a citizen's answer.

## `residency` has three values here

The partner surface accepts `resident`, which the internal API still describes as
planned. If you are mapping between them, `resident` has no internal equivalent yet.

## The verdicts are v1's names

| Partner | Internal | Means |
|---|---|---|
| `eligible` | `can_own` | No barrier for someone in that position. |
| `conditional` | `conditional` | Holdable, but a licence, cap, approval or check stands in the way. |
| `restricted` | `cannot_own` | Excluded. |
| `unverified` | *(no equivalent)* | **No answer.** Not a lenient `eligible`. |

`unverified` is the one to handle carefully. It does not mean "probably fine" — it means
Vestail has not assessed it, and nothing should be bought on the strength of it.

## Every answer carries its evidence

Four fields exist so a verdict can be audited rather than trusted:

- `reasons` — why this verdict
- `conditions` — what stands in the way, when `conditional`
- `sources` — the documents behind it
- `lastVerified` — when it was last checked

**Today `sources` is `[]` and `lastVerified` is `null` on every rule.** All 480 are
illustrative. Show those fields in your interface; when they fill in, your users see it
without you shipping anything.

`disclaimer` is returned on every result and is meant to be displayed, not stripped.

## Batching

`POST /api/v1/check/batch` takes `{ "checks": [ ... ] }`, 1 to 100 of them, and returns
`{ "results": [ ... ] }` in the same order.

One batch costs **one** request against your rate limit. A hundred single checks cost a
hundred. See [request-limits.md](./request-limits.md).

## The rest of the surface

| | |
|---|---|
| `GET /api/v1/assets?country=&residency=` | Every asset class with its verdict for that profile — a whole board in one call. |
| `GET /api/v1/countries` | The twelve covered countries. |
| `GET /api/v1/rules/{id}` | One rule by id, with its sources. |
| `GET /api/v1/openapi.json` | The generated contract. **The only endpoint that needs no key** — you need it before you have one. |

## Getting a key

Keys are issued from the CLI, with a label, a mode and a rate limit:

```bash
node services/api/src/public/keys-cli.js --label "Acme" --limit 60 --mode test
```

`test` and `live` modes exist so an integration can be built without its traffic counting
as real. See [authentication.md](./authentication.md).
