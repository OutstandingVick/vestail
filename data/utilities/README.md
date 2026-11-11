# Utilities

What a holder can do with an asset beyond holding it: trade it, lend it,
borrow against it, or earn fees by providing liquidity. Each utility gets its
own verdict, combining the asset's existing hold verdict (issuer rule capped by
the class rule) with the protocol's own restrictions. The most restrictive wins:

    restricted  >  unverified  >  conditional  >  eligible

A protocol with no sourced rule for a country is **unverified** for it, and its
actions are disabled. Missing research is never permission.

## Files

- `protocols/<id>.json` — one versioned file per protocol, the same style as
  issuer policies in `data/tokens/policies/`. Git history is the audit trail.
- `support.json` — which protocols offer which utility for which assets.
  Hand-edited config: nothing in code says which protocol supports what.

## Protocol file shape

```jsonc
{
  "protocol": "meteora",            // must match the filename
  "name": "Meteora",
  "version": "2026-11-11.1",        // YYYY-MM-DD.N, copied onto every verdict
  "verifiedOn": "2026-11-11",       // when a person last read the sources; null if never
  "todo": false,                    // true for a placeholder with no sourced rules yet
  "rules": [
    {
      "id": "restricted-territories",
      "status": "restricted",       // eligible | conditional | restricted
      "regions": ["US", "CN"],      // ISO 3166-1 alpha-2 codes Vestail covers
      "reason": "Why, in a sentence a buyer can read.",
      "sourceUrl": "https://…",     // the document the rule was read from (https only)
      "sourceQuality": "primary"    // primary | secondary
    }
  ]
}
```

A country with no matching rule is unverified for that protocol. A file with
`rules: []` (a placeholder) is unverified everywhere.

## Risk acknowledgement

Lend, borrow and earn always require the buyer to acknowledge the risk
(liquidation, impermanent loss) before any transaction, on top of any
conditional verdict. Trade does not. Perpetuals and leverage are not utilities
and the config refuses them.
