# `GET /v1/tokens` and `/v1/tokens/{symbol}`

The same listed share exists onchain as several different legal claims. These endpoints
say which, and what each one actually is.

```
GET /v1/tokens                              → the symbols with tokenised versions
GET /v1/tokens/NVDA?country=NG&who=foreigner → every version, judged
```

## Why one ticker has several answers

NVDA through xStocks is backed by shares held in custody and can be redeemed. Through
Backpack it is a security entitlement via a broker. Through Robinhood it is a **debt
security** giving economic exposure to the price with no legal or beneficial right to the
share at all.

Same ticker, same price, three different things to own. That difference only becomes
visible when someone tries to exit, which is the entire reason these endpoints exist.

## How a token is judged

Two gates, and the stricter wins:

1. **The issuer's own policy** for that country — carried over from v1, every gate sourced.
2. **Capped by the asset-class rule.** NVDA is foreign equities outside the US, so the
   country's rule for foreign equities is a ceiling the issuer cannot raise.

`decided_by` says which of the two decided the answer.

## `assessed: false` is not a verdict

If there is no issuer rule for the country, the token comes back `assessed: false` with
`status: null`.

**Not assessed is not eligible.** It is never routed, and `POST /orders/click` refuses it
with `not_assessed`. Do not render it as a neutral or pending state next to real
verdicts — a buyer reading a row of statuses will take a blank as permission.

## Response

| Field | Notes |
|---|---|
| `asset` | The asset class governing the symbol. |
| `class_status` | The country's verdict for that class — the ceiling. |
| `tokens[]` | One per version. |
| `tokens[].token_symbol` | `NVDAx`, `NVDAon`, and so on. |
| `tokens[].status` | The verdict, or `null` when unassessed. |
| `tokens[].decided_by` | `issuer` or `class`. |
| `tokens[].issuer` | The acknowledgement text and the evidence behind the gate. |

## Where the data comes from

`data/tokens/` — the registry, the issuer policies, and `symbols.json`, which maps each
symbol to its asset class. Every address is read from the chain rather than taken on
trust from a provider's list; the syncers in `scripts/` do that and refuse anything the
chain disagrees with.

## Errors

| Code | When |
|---|---|
| `unknown_symbol` | No tokenised versions of that ticker. |
| `unknown_country` | No such country. |

## Caching

`/v1/tokens` is `public, max-age=86400`. `/v1/tokens/{symbol}` is `public, max-age=3600`.
