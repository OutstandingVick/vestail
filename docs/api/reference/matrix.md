# `GET /v1/matrix`

The whole board in one call: every covered country, judged for one query and one buyer
type. This is what the web app uses, and in most cases it is the only endpoint you need.

```
GET /v1/matrix?q=farmland&who=foreigner&sort=status
```

## Query parameters

| Name | Required | Default | Notes |
|---|---|---|---|
| `q` | no | — | Free text, resolved the same way as [`/resolve`](./resolve.md). Omit it for the full board. |
| `who` | no | `citizen` | `citizen` or `foreigner`. |
| `countries` | no | all twelve | Comma-separated ISO codes to narrow the board. |
| `sort` | no | `asset` | `status` ranks most-open first; `asset` keeps asset order. |

## Response

| Field | Notes |
|---|---|
| `query` | What was asked. |
| `who` | The buyer type the rows were judged for. |
| `resolution` | The resolver's answer, including `stage` and `trail`. |
| `rows` | One per country, each with its cells and a `cta`. |

## Why this exists

It composes [`/resolve`](./resolve.md), [`/rules`](./rules.md) and
[`/venues`](./venues.md) server-side. Doing it yourself means three round trips per
country and a resolver you have reimplemented — and the resolver's ordering rules are
subtle enough that reimplementing them is how a client ends up answering for the generic
*shares* bucket when the user asked about Tesla.

## `sort=status` is for reading, not ranking

It puts the most open countries first so a board scans usefully. It is not advice, and it
is not an ordering of desirability — a `can_own` in a country someone cannot move money
to is not better than a `conditional` at home.

## Caching

`public, max-age=3600`. An hour, which is a long time for a compliance answer — see the
caveat in [versioning.md](../versioning.md).

## Errors

| Code | When |
|---|---|
| `unknown_country` | A code in `countries` is not one of the twelve. |
| `bad_buyer_type` | `who` was something other than `citizen` or `foreigner`. |
