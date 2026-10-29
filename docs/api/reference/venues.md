# `GET /v1/venues/{asset}`

Where someone in a given country can actually buy a thing.

```
GET /v1/venues/cryptocurrency?country=IN
```

## Path and query

| Name | Required | Notes |
|---|---|---|
| `asset` | path | An asset class id. |
| `country` | query | ISO 3166-1 alpha-2. |
| `who` | query | `citizen` or `foreigner`. Default `citizen`. |
| `ref` | query | Your own attribution tag, replacing `ref=vestail`. |

## Every url carries a tag

Outbound venue links carry `ref=vestail` unless you pass your own `ref`. That tag ties to
commercial agreements, so **do not strip it and do not substitute one you invented** —
see [attribution](./orders-click.md).

## Venues follow the verdict

A `cannot_own` cell returns no venues. Not an empty list you should fill in from
elsewhere, and not a list to show greyed out: there is nowhere Vestail will send someone
for a thing the rules exclude them from.

A `conditional` cell does return venues, but routing to them requires the buyer to have
acknowledged the condition first. The API enforces that at
[`POST /orders/click`](./orders-click.md); your interface should not offer the link
before the acknowledgement.

## Errors

| Status | Code | When |
|---|---|---|
| `400` | `unknown_country` | No such country. |
| `400` | `unknown_asset` | No such asset class. |

## Caching

`public, max-age=86400`. Venues change with a deploy.
