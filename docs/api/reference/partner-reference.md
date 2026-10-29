# Partner reference endpoints

The supporting endpoints on `/api/v1`. All keyed except the last.

## `GET /assets?country=&residency=`

Every asset class with its verdict for that profile — a whole board in one call, without
batching.

| Parameter | Required | Notes |
|---|---|---|
| `country` | yes | ISO 3166-1 alpha-2. |
| `residency` | yes | `citizen`, `resident` or `foreigner`. |

Both are required. There is no "all countries" form and no default residency, because a
default would mean the API choosing a buyer's position for them.

With `residency=resident`, every verdict comes back `unverified` — see
[check.md](./check.md).

## `GET /countries`

The twelve covered countries. No parameters.

Fetch it rather than hard-coding the list: twelve is current coverage, not a constant.

## `GET /rules/{id}`

One rule by its id, with its sources and history.

The id is what [`/check`](./check.md) returns as `ruleId`, so the loop is: ask `/check`,
get a verdict and a `ruleId`, then fetch the rule to show a user where the answer came
from.

That round trip is the point. A verdict a user cannot trace is a verdict they have to
take on faith, which is the thing Vestail exists not to ask of them.

## `GET /openapi.json`

The generated OpenAPI 3.1 document for this surface.

**The only endpoint that needs no key.** You need the contract before you have
credentials, and requiring a key to read the shape of the API would be a small piece of
rudeness with no security value.

It is generated from the same Zod schemas the endpoints validate against
(`services/api/src/public/openapi.js`), so it cannot drift from what the code accepts.

## Errors

As [errors.md](../errors.md). `401 unauthorized` on everything here except
`/openapi.json`.
