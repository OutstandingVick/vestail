# `POST /api/v1/check`

One question: *may this person, in this country, own this thing?*

```bash
curl -X POST "$VESTAIL_API_BASE_URL/api/v1/check" \
  -H "Authorization: Bearer $VESTAIL_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "country": "NG", "residency": "foreigner", "asset": { "class": "agricultural_land" } }'
```

## Body

| Field | Required | Notes |
|---|---|---|
| `country` | yes | ISO 3166-1 alpha-2. Case-insensitive on input. |
| `residency` | yes | `citizen`, `resident` or `foreigner`. |
| `asset.class` | yes | An asset class id. |
| `asset.symbol` | no | A ticker, for a tokenised version. |
| `asset.id` | no | A specific instrument. |

The schema is **strict**: an unknown field is a `400`, not an ignored key. A misspelled
`residencty` fails loudly rather than silently giving you a citizen's answer.

## Response

| Field | Notes |
|---|---|
| `ruleId` | The rule that produced this. Quote it in a correction. |
| `verdict` | `eligible`, `conditional`, `restricted` or `unverified`. |
| `reasons[]` | Why. |
| `conditions[]` | What stands in the way, when `conditional`. |
| `sources[]` | `{ label, url }` for each document. |
| `lastVerified` | ISO date, or `null`. |
| `ruleVersion` | Which version of the rule answered. |
| `disclaimer` | Display this. Do not strip it. |

## `residency: "resident"` always returns `unverified`

Not an error, and not a judgement. The rule set distinguishes citizens and foreigners
only, so a resident request comes back `unverified` with the reason *"The current Vestail
rule set does not distinguish residents from citizens or foreigners."*

Handle it as "no answer available", because that is what it is.

## `unverified` is not a soft yes

It means Vestail has not assessed this. Nothing should be bought on the strength of it,
and it should not be rendered as a paler `eligible`.

## Four verdicts, and the middle one is the product

`conditional` means holdable but encumbered — a licence, a cap, an approval, an identity
check. Collapsing it into either neighbour destroys the thing the API is for. See
[conventions.md](../conventions.md).

## Errors

| Status | Code | When |
|---|---|---|
| `400` | `validation_error` | The body failed the schema. The message names the field. |
| `400` | `invalid_country` | Not one of the twelve. |
| `400` | `invalid_asset` | No such class or symbol. |
| `400` | `ambiguous_asset` | The selector matched more than one asset; the API will not guess. |
| `401` | `unauthorized` | Missing or wrong key. |
| `429` | `rate_limited` | Over budget. Batch instead — see [check/batch](./check-batch.md). |
