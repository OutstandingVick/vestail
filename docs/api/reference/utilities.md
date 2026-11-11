# `GET /api/v1/utilities`

What a profile can do with each version of an asset beyond holding it (trade,
lend, borrow, earn) and whether they're allowed to, with reasons, sources and
live numbers.

```bash
curl "$VESTAIL_API_BASE_URL/api/v1/utilities?asset=NVDA&country=NG&residency=citizen" \
  -H "Authorization: Bearer $VESTAIL_KEY"
```

```json
{
  "country": "NG", "residency": "citizen",
  "versions": [{
    "asset": { "symbol": "NVDA", "id": "Xsc9…9qEh", "tokenSymbol": "NVDAx", "issuer": "xstocks", "chain": "solana", "instrument": "tokenized_equity" },
    "utilities": [
      { "utility": "hold",  "verdict": "conditional", "options": [] },
      { "utility": "trade", "verdict": "conditional", "options": [{ "protocol": "jupiter", "live": { "pairs": [ … ] } }] },
      { "utility": "lend",  "verdict": "unverified", "options": [], "reasons": ["No protocol in Vestail's config offers this for this token yet."] },
      { "utility": "earn",  "verdict": "conditional", "risk": "impermanent_loss", "options": [{ "protocol": "meteora", "live": { "depthUsd": 180000, "pools": [ … ] } }] }
    ]
  }]
}
```

## Query

| Parameter | Notes |
|---|---|
| `asset` | A symbol (`NVDA`, every issuer version) or one token address. |
| `country` | ISO 3166-1 alpha-2. |
| `residency` | `citizen`, `resident` or `foreigner`. There is no resident rule set yet, so residents get `unverified` holding and utilities. |

## How a utility's verdict is decided

Each option (one protocol offering the utility) is the **most restrictive** of
the asset's hold verdict and the protocol's own sourced rule for the country:
`restricted` > `unverified` > `conditional` > `eligible`. The utility shows its
best option. A protocol with no sourced rule for the country is `unverified`.

- `actionsEnabled` is true only for `eligible` or `conditional` options.
- `acknowledgementRequired` is true for conditional options, and always for
  lend and borrow (liquidation risk) and earn (impermanent loss).
- Only spot utilities exist: there are no perpetuals or leverage.

## Live numbers

Fetched only for options whose actions are enabled, and cached for 30 seconds.

- **trade** (Jupiter): for each pair, what 100 USDC or 0.5 SOL buys, the price
  per token, price impact and the venues on the route.
- **earn** (Meteora): total USDC/SOL pool depth and the pools (DLMM, DAMM v2) with
  TVL, 24h volume and fees, 24h fee/TVL and a simple annualised fee APR.

If a live source fails, `live` is `null` and `liveError` says why; the verdict
is unaffected.
