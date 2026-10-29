# `GET /v1/activity`

Aggregate figures: volume, orders routed, active buyers, and recent purchases.

## Read this before you display any of it

**Outside production, this endpoint serves invented sample data.**

`createApp` takes `useSample`, which defaults to `process.env.NODE_ENV !== "production"`.
In development and in preview deployments the numbers are fabricated — they exist to
show a layout, not to describe anything that happened.

That guard is why `NODE_ENV=production` matters on a real deploy, and it is the single
most important line on this page. Vestail's homepage once shipped these figures to the
public internet as though they were real, and they were not. See
[CLAUDE.md](../../../CLAUDE.md).

## Response

| Field | Notes |
|---|---|
| `stats.volume_30d_usd` | Bought through Vestail in 30 days. |
| `stats.volume_30d_delta_pct` | Change against the previous period. |
| `stats.orders_routed` | Clicks recorded through `/orders/click`. |
| `stats.active_buyers_7d` | Distinct sessions in a week. |
| `recent[]` | Recent purchases: flag, asset, venue, relative time. |

## Never cached

`no-store`. This is the only endpoint with that policy, and it is deliberate: a cached
activity figure is a stale claim about the present.

## Real data, or none

The figures come from the click log, which is currently in memory and resets when the
process restarts. Until that moves to a store, treat the production numbers as
best-effort rather than an accounting record.

If you are building something that shows these to users, the rule from
[CLAUDE.md](../../../CLAUDE.md) applies to you too: **never put a number on a page that
cannot be checked.**
