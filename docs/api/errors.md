# Errors

Every failure returns the same JSON shape and an HTTP status that matches it. Nothing
fails silently and nothing fails with a 200.

```json
{
  "error": {
    "code": "invalid_country",
    "message": "country: Unsupported country 'ZZ'."
  }
}
```

`code` is a stable, lowercase, snake_case string. Branch on it. `message` is written for
a person reading a log and may change wording at any time, so never match on it.

## Status codes

| Status | Meaning |
|---|---|
| `200` | The request succeeded. |
| `400` | The request was understood and refused. Something in it is wrong; the same request will fail again. |
| `401` | No valid API key on an endpoint that requires one. |
| `404` | The route, or the thing the route names, does not exist. |
| `429` | Too many requests from this IP. See [Request limits](./request-limits.md). |
| `500` | Vestail failed. Not your fault, and safe to retry. |

## Error codes

Every code the API can return, with a real message from the source rather than an
invented one.

### 400 — the request is wrong

| Code | When | Example message |
|---|---|---|
| `validation` | A field is missing, malformed, or contradicts another field. The widest of the 400s. | `Body is not valid JSON.` |
| `validation_error` | The body failed the OpenAPI schema. | `request: A valid JSON body is required.` |
| `invalid_country` | A country code outside the twelve covered. | `country: Unsupported country 'ZZ'.` |
| `unknown_country` | Same cause, raised by the older routes. | `Unknown country: ZZ.` |
| `invalid_asset` | An asset class or token symbol that does not exist. | `asset.class: Unknown asset class 'spaceships'.` |
| `unknown_asset` | Same cause, raised by the older routes. | `No asset class with id spaceships.` |
| `ambiguous_asset` | The selector matched more than one asset and the API will not guess. | — |
| `bad_buyer_type` | `who` was neither `citizen` nor `foreigner`. | `who must be citizen or foreigner.` |
| `unknown_mint` | A Solana mint Vestail has no record of. | `Vestail does not know the token <mint>.` |
| `unknown_symbol` | A ticker with no tokenised versions. | `No tokenised versions of XYZ.` |
| `not_assessed` | The token has no issuer rule for this country. **Not assessed is not eligible**; it is never routed. | `<symbol> has not been assessed for NG; it is not routed.` |
| `acknowledgement_required` | A conditional cell was bought without `acknowledged: true`. | `<asset> is conditional in NG for a citizen; the buyer must acknowledge the condition.` |

### 401, 404, 429, 500

| Status | Code | When | Example message |
|---|---|---|---|
| `401` | `unauthorized` | Missing or wrong API key. | `A valid API key is required: Authorization: Bearer <key>.` |
| `404` | `not_found` | No such route. | `No route for GET /v1/nope.` |
| `404` | `rule_not_found` | The route exists; the rule does not. | `No rule 'gold_bullion'.` |
| `429` | `rate_limited` | Over the per-IP budget. Carries `Retry-After`. | `Too many requests. Try again in 42s.` |
| `500` | `internal` | Vestail failed. | `Something went wrong.` |

## Which errors are worth retrying

| | Retry? |
|---|---|
| `429 rate_limited` | Yes — wait for `Retry-After` first. See [Request limits](./request-limits.md). |
| `500 internal` | Yes, with backoff. |
| every `400` | No. The request is wrong; sending it again produces the same answer. |
| `401 unauthorized` | No. Fix the key. |
| `404` | No. |

`POST /orders/click` is the one non-idempotent call. A retry records a second click, so
retry it only on `429` and `500`, never on a timeout you cannot distinguish from success.

## Two pairs that mean the same thing

`invalid_country` and `unknown_country` are raised for the same cause by different routes,
and so are `invalid_asset` and `unknown_asset`. `validation` and `validation_error`
overlap the same way.

This is a wart, not a design. It happened because routes were added at different times.
Until it is settled, **a client that branches on these codes must handle both spellings
of each pair.** Collapsing them is a breaking change and waits for `/v2`.
