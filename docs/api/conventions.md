# Conventions

Things that are true of every endpoint, so the reference pages do not repeat them.

## Base URLs

| Surface | Path | Reachable today |
|---|---|---|
| Internal | `/v1` | no — see [README](./README.md) |
| Partner | `/api/v1` | no — see [README](./README.md) |

Run it locally with `npm start -w @vestail/api`, which listens on `PORT`, default `8787`,
and serves `http://localhost:8787/v1`.

## Methods

`GET` reads. `POST` writes, and there are only two writes: `POST /v1/orders/click` and
the partner `POST /api/v1/check` family — the second of which is a `POST` because it
carries a body, not because it changes anything.

Nothing is ever a `PUT`, `PATCH` or `DELETE`. There is nothing to update or remove: the
rule set is read-only to every caller.

## JSON in, JSON out

Request and response bodies are JSON. A `POST` must send `Content-Type: application/json`
and a body that parses, or it gets `400 validation` — `A JSON body is required.`

## Naming

`snake_case` everywhere — in query parameters, in request bodies and in response fields.

Identifiers are `snake_case` too, and they are stable: `gold_bullion`,
`residential_property`, `foreign_equities`. **Ids are the contract; names are not.**
`"Gold bullion"` is a display string and may be rewritten; `gold_bullion` will not change
without a version bump.

## Countries

ISO 3166-1 alpha-2, uppercase: `NG`, `GB`, `US`, `AE`, `CN`, `IN`, `BR`, `SA`, `DE`,
`JP`, `ZA`, `KR`. Twelve, and anything else is `400 invalid_country`.

Country is always declared by the caller. The API never infers it — not from an IP, not
from `Accept-Language`, not from a key. That is a product rule, not an implementation
detail: see [the methodology page](https://www.vestail.fun/company/methodology).

## Buyer types

`who=citizen` (the default) or `who=foreigner`. Anything else is `400 bad_buyer_type`.

A third type, `resident`, is planned. **Treat an unknown buyer type as `foreigner`** —
the conservative reading — rather than falling back to `citizen`.

## Dates

ISO 8601, UTC. `verified_at` on a rule is a date (`2026-03-11`) because a rule is
checked on a day, not at an instant.

## Nulls mean something

`null` is not "empty". On a rule, `verified_at: null` means *nobody has checked this
against a primary document yet*, and `sources: []` means the same. Both are currently
true of all 480 rules.

A token with `assessed: false` carries `status: null`, and that is not a third verdict —
it means there is no answer, and **not assessed is never routed**.

## The verdict scale

Three values, never two: `can_own`, `conditional`, `cannot_own`.

`conditional` is the one that carries the product. It means you may hold the thing but
something stands between you and using or exiting it — a licence, a cap, an approval, an
identity check. Do not render it as a near-miss `can_own`, and do not collapse it into
`cannot_own`. Clients that reduce three states to two are the reason this API exists.
