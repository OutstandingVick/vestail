# Endpoint reference

One page per endpoint. Shared rules live in [conventions.md](../conventions.md),
[errors.md](../errors.md) and [request-limits.md](../request-limits.md) rather than being
repeated here.

## Internal API — `/v1`

Used by Vestail's own web app. Public reads, one keyed write.

| Endpoint | Page | |
|---|---|---|
| `GET /resolve` | [resolve.md](./resolve.md) | Text to asset classes, with the trail. |
| `GET /matrix` | [matrix.md](./matrix.md) | The whole board in one call. |
| `GET /rules/{country}[/{asset}]` | [rules.md](./rules.md) | The verdicts, with their sources. |
| `GET /venues/{asset}` | [venues.md](./venues.md) | Where to buy it. |
| `GET /tokens[/{symbol}]` | [tokens.md](./tokens.md) | One ticker, several legal claims. |
| `GET /assets` `/categories` `/countries` `/entities` | [reference-data.md](./reference-data.md) | The lists everything is keyed by. |
| `GET /activity` | [activity.md](./activity.md) | Aggregate figures. Sample data outside production. |
| `GET /orders` | [orders.md](./orders.md) | Clicks for one session. Keyed. |
| `POST /orders/click` | [orders-click.md](./orders-click.md) | Record a buy and get the redirect. Keyed. |

## Partner API — `/api/v1`

For third parties. Keyed throughout, except the contract itself.

| Endpoint | Page | |
|---|---|---|
| `POST /check` | [check.md](./check.md) | May this person own this thing? |
| `POST /check/batch` | [check-batch.md](./check-batch.md) | Up to 100, for one request. |
| `GET /assets` `/countries` `/rules/{id}` `/openapi.json` | [partner-reference.md](./partner-reference.md) | Lists, one rule, and the contract. |

## If you read only one thing

[conventions.md](../conventions.md). The two surfaces use different field casing,
different names for the buyer type, and different names for the verdicts. A client
written for one and pointed at the other will get `undefined` back and look like a
network problem.
