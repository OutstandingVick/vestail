# `GET /v1/rules/{country}` and `/v1/rules/{country}/{asset}`

One country's rules, or one rule. This is the ground truth the rest of the API composes.

```
GET /v1/rules/NG/foreign_equities?who=citizen
```

## Path parameters

| Name | Notes |
|---|---|
| `country` | ISO 3166-1 alpha-2, one of the twelve. |
| `asset` | An asset class **id** — `foreign_equities`, not `"Foreign equities"`. |

## Query parameters

| Name | Default | Notes |
|---|---|---|
| `who` | `citizen` | `citizen` or `foreigner`. |

## Response

| Field | Notes |
|---|---|
| `status` | `can_own`, `conditional` or `cannot_own`. |
| `sources` | The documents the rule rests on. |
| `verified_at` | The date it was last checked against them, or `null`. |
| `venues` | Where to buy it, each url carrying `ref=vestail`. |

## Read `sources` and `verified_at` before you trust `status`

They are part of the answer, not metadata about it. A `can_own` with `sources: []` and
`verified_at: null` means *nobody has checked this against a primary document* — which
is currently true of **all 480 rules**.

Build your interface to show provenance now, while it is empty. It will fill in, and a
client that already displays it gets the improvement for free; one that doesn't will keep
presenting unsourced verdicts as though they were settled.

## Every asset has a rule for every country

The core refuses to load if one is missing, and names the offender. So a `404` here means
you asked for a country or an asset that does not exist — never a gap in coverage.

## Errors

| Status | Code | When |
|---|---|---|
| `404` | `unknown_country` | No such country. |
| `404` | `unknown_asset` | No such asset class. |
| `404` | `rule_not_found` | The route resolved but the rule did not. |
| `400` | `bad_buyer_type` | `who` was neither `citizen` nor `foreigner`. |

## Caching

`public, max-age=3600`.
