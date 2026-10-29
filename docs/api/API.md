# The internal API in ten minutes

`/v1` — what Vestail's own web app calls. For the third-party surface see
[partner-api.md](./partner-api.md); for the map of both, [README.md](./README.md).

Shared rules are not repeated here: [conventions.md](./conventions.md),
[errors.md](./errors.md), [request-limits.md](./request-limits.md),
[versioning.md](./versioning.md). Per-endpoint detail is in
[reference/](./reference/README.md).

## The shape of it

```
text ──▶ /resolve ──▶ asset classes ──▶ /matrix ──▶ status per country ──▶ /venues ──▶ buy link
                                                        │
                                                        └──▶ POST /orders/click ──▶ /activity
```

Three verbs, three nouns:

| Verb | Noun | Endpoint |
|---|---|---|
| Resolve | query | [`GET /resolve?q=`](./reference/resolve.md) |
| Look up | rule | [`GET /rules/{country}/{asset}`](./reference/rules.md) |
| Route | venue | [`GET /venues/{asset}?country=`](./reference/venues.md) |

[`GET /matrix`](./reference/matrix.md) composes all three for a whole board in one call,
and is what the frontend actually uses. Reach for it first.

## Start here

```bash
npm start -w @vestail/api        # http://localhost:8787/v1
curl "http://localhost:8787/v1/health"
curl "http://localhost:8787/v1/matrix?q=farmland&who=foreigner&sort=status"
```

## Three worked questions

**Where can a Nigerian buy Google?**

```
GET /v1/rules/NG/foreign_equities?who=citizen
→ { "status": "conditional",
    "venues": [{ "name": "Bamboo", "url": "https://investbamboo.com?ref=vestail" }, …] }
```

**A foreigner wants farmland, anywhere**

```
GET /v1/matrix?q=farmland&who=foreigner&sort=status
→ rows ranked most-open first; each row has one cell and a populated cta
```

**Which version of NVDA may a Nigerian hold?**

```
GET /v1/tokens/NVDA?country=NG&who=foreigner
→ one ticker, several legal claims, each judged
```

## The four things to get right

1. **Three verdicts, never two.** `can_own`, `conditional`, `cannot_own`. The middle one
   is the product — see [conventions.md](./conventions.md).
2. **Surface the trail.** `/resolve` returns `stage` and `trail` so a user can check how
   their words became an asset class. Showing it is what makes the answer trustworthy.
3. **The acknowledgement is server-enforced.** A conditional buy without
   `acknowledged: true` is refused at
   [`POST /orders/click`](./reference/orders-click.md). The checkbox is convenience; the
   server check is the guarantee.
4. **`sources` is empty and `verified_at` is null on all 480 rules.** Build the interface
   that shows provenance now, while there is none to show.

## Attribution

Every Buy press should go through [`POST /orders/click`](./reference/orders-click.md)
before redirecting. It returns the final tagged url, so the tag logic stays on the server
rather than drifting across clients. It is the hook for referral revenue, which is why it
needs a key.

## The contract

[`openapi.yaml`](./openapi.yaml) is machine-readable and authoritative. The service
validates every request against it at runtime, and `test/contract.test.js` calls every
operation in it — so adding a path to the spec without implementing it fails the build.
