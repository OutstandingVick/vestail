# `POST /v1/orders/click`

Record a Buy press and get back the url to send the buyer to. The only endpoint that
changes anything.

```bash
curl -X POST http://localhost:8787/v1/orders/click \
  -H "Authorization: Bearer $VESTAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "country": "NG",
        "asset": "foreign_equities",
        "who": "citizen",
        "venue": "Bamboo",
        "acknowledged": true
      }'
```

```json
{ "id": "...", "redirect": "https://investbamboo.com?ref=vestail" }
```

## Body

| Field | Required | Notes |
|---|---|---|
| `country` | yes | ISO 3166-1 alpha-2. |
| `asset` | yes | An asset class id. |
| `who` | yes | `citizen` or `foreigner`. |
| `venue` | yes | Must be a venue Vestail lists for that asset, country and buyer type. |
| `acknowledged` | conditionally | **Required and `true` when the verdict is `conditional`.** |
| `mint` | no | For a Solana swap. |
| `query`, `session` | no | What the buyer searched, and a session id for attribution. |

## Follow the `redirect`, do not build it

The response returns the final url with the tag already applied. Constructing it yourself
means the tag logic lives in your client, where it will drift. Here it lives on the
server, where it is one place.

## The acknowledgement is enforced here, not only in the UI

A `conditional` cell bought without `acknowledged: true` is refused with
`400 acknowledgement_required`. The checkbox in an interface is a convenience; **this
check is the guarantee**, and it is deliberately not something a client can opt out of.

`cannot_own` is never routed at all, and neither is a token that has not been assessed —
`not_assessed` is not a lenient verdict.

## This call is not idempotent

A retry records a second click and inflates attribution. Retry it on `429` and `500`
only, and never on a timeout where you cannot tell whether the first one landed. See
[errors.md](../errors.md).

## Errors

| Code | When |
|---|---|
| `unauthorized` | Missing or wrong API key. |
| `unknown_country`, `unknown_asset` | Bad identifier. |
| `validation` | The venue is not one Vestail lists for that cell, or the body is malformed. |
| `acknowledgement_required` | A conditional buy without `acknowledged: true`. |
| `not_assessed` | The token has no issuer rule for that country. |
| `unknown_mint` | A Solana mint Vestail does not know. |

## Why it exists

Attribution. It is the hook for referral revenue and order-flow accounting, which is why
it needs a key: a click has to be attributable to whoever sent it. See
[authentication.md](../authentication.md).
