# `POST /api/v1/check/batch`

The same question as [`/check`](./check.md), asked up to a hundred times for the price of
one request.

```bash
curl -X POST "$VESTAIL_API_BASE_URL/api/v1/check/batch" \
  -H "Authorization: Bearer $VESTAIL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "checks": [
          { "country": "NG", "residency": "citizen",   "asset": { "class": "agricultural_land" } },
          { "country": "NG", "residency": "foreigner", "asset": { "class": "agricultural_land" } }
        ]
      }'
```

```json
{ "results": [ { "ruleId": "...", "verdict": "..." }, { "ruleId": "...", "verdict": "..." } ] }
```

## Body

| Field | Notes |
|---|---|
| `checks` | An array of 1 to 100 `/check` bodies. Fewer than 1 or more than 100 is a `400`. |

## Results come back in order

`results[i]` answers `checks[i]`. Match by position; there is no id to correlate on.

If you need to correlate by something other than order — and for anything
user-facing you probably do — keep your own index alongside the array you sent.

## One request against your rate limit

A hundred checks here cost **one** request. A hundred calls to `/check` cost a hundred.
The default budget is 60 per minute, so the difference is the difference between
checking a 100-line portfolio once a minute and not being able to at all.

This endpoint is why that budget is as small as it is. See
[request-limits.md](../request-limits.md).

## It is all-or-nothing on validation

The whole body is validated before anything runs. One malformed entry fails the entire
request with `400 validation_error`, naming the field by its path — so the message points
at `checks.3.country` rather than just "country".

There is no partial success. If you would rather one bad row not sink the batch, filter
before you send.

## Errors

Same as [`/check`](./check.md), plus a `validation_error` when `checks` is empty or
longer than 100.
