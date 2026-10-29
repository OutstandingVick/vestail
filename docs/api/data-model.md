# The data model

What the API is reading when it answers. Useful if you are storing results, and
necessary if you are contributing rules.

## The shape of a verdict

```
country  ×  asset class  ×  buyer type  →  { status, sources, verified_at }
   12           20              2        =  480 rules
```

That is the whole engine. Everything else is lookup, resolution or routing on top of it.

`data/countries.json` holds the rules, keyed by asset id under each buyer type:

```json
"NG": {
  "rules": {
    "citizen":   { "agricultural_land": { "status": "can_own", "sources": [], "verified_at": null } },
    "foreigner": { "agricultural_land": { "status": "conditional", "sources": [], "verified_at": null } }
  }
}
```

**Every asset needs a rule for every country and buyer type.** The core refuses to load
otherwise and names the one that is missing. So there are no gaps in coverage — only
countries and assets that do not exist.

## The pieces

| File | Holds | Keyed by |
|---|---|---|
| `data/assets.json` | 20 asset classes | `id` — `gold_bullion` |
| `data/countries.json` | the 480 rules, and venues | ISO alpha-2 |
| `data/categories.json` | groupings that fan out to several classes | name |
| `data/aliases.json` | everyday words → classes | the word |
| `data/entities.json` | named things: companies, coins, bond series | name |
| `data/venues.json` | where to buy, per asset and country | — |

## How a query becomes a verdict

1. **Resolve.** Entity → alias → category → asset, in that order, with a `trail`.
   Entities first is why *tesla shares* finds Tesla and not the generic *shares* bucket.
2. **Look up.** The rule for that class, country and buyer type.
3. **Route.** The venues for the pair, each tagged.

The ordering in step 1 is load-bearing and guarded by `packages/core/test.js`.

## Entities carry a home market

A company has a `home`. That is how one ticker is *domestic equities* in one country and
*foreign equities* everywhere else, without storing a rule per company — the entity
resolves to a different class depending on who is asking.

## Tokens sit on top, and cannot loosen anything

`data/tokens/` maps a symbol to its asset class, then judges each onchain version against
the issuer's own policy. The asset-class rule is a **ceiling**: an issuer may be stricter
than the country, never more permissive. `decided_by` says which applied.

Addresses are read from the chain rather than taken on trust from a provider's list —
`scripts/sync-robinhood-tokens.mjs` and `sync-solana-tokens.mjs` refuse anything the
chain disagrees with.

## Provenance is part of the rule, not metadata

`sources` and `verified_at` sit inside the rule object because a verdict without them is
incomplete, not merely undocumented.

They are `[]` and `null` on all 480 today. `data/schema/schemas.json` validates the shape
when they are filled, and a malformed source fails the build — so the gap is emptiness,
never garbage.

**Never invent either field.** That is an invariant in `CLAUDE.md`, and it is the
difference between a product that says "we have not checked this" and one that quietly
implies it has.
