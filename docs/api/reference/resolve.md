# `GET /v1/resolve`

Turns what a person typed into the asset classes Vestail can answer for.

```
GET /v1/resolve?q=tesla%20shares
```

## Query parameters

| Name | Required | Notes |
|---|---|---|
| `q` | yes | Free text. Filler like "can I buy" is stripped before matching. |

## Response

| Field | Notes |
|---|---|
| `stage` | Which layer matched. See below. |
| `trail` | The chain of hops, in words, for a person to read. |
| `assets` | The asset classes the query resolved to. |
| `perCountry` | Present when an entity resolves differently by country. |

## The stages, in priority order

| Stage | Matches | Example |
|---|---|---|
| `entity` | A named thing: a company, a coin, an aircraft model, a bond series. | `Tesla` |
| `alias` | An everyday word. | `house`, `gilts` |
| `category` | A group name. | `commodities` |
| `asset` | An asset class name, tolerating prefixes and typos. | `agricultural land` |
| `none` | Nothing matched. Show the categories instead. | |

**Entities beat aliases, and that ordering is the point.** `tesla shares` resolves to
Tesla, not to the generic *shares* bucket, because a named company and a generic class
give different answers for the same words. `packages/core/test.js` guards it.

Multi-word queries are cleaned of filler and, if the whole phrase fails, retried per word
with entities tried first.

## Surface the trail

The response never resolves silently: `stage` says which layer matched and `trail` says
how it got there. Showing the trail is what makes *"Google → foreign equities"* a claim a
user can check rather than a guess they have to accept.

Any new resolver stage must add to the trail. That is an invariant, not a nicety — see
[CLAUDE.md](../../../CLAUDE.md).

## When nothing matches

`stage: "none"` is a real answer, not an error. The status is `200`. Offer the category
list rather than an empty state.

## Errors

None specific to this endpoint. A missing `q` is `400 validation`.
