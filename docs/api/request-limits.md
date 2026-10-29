# Request limits

Two surfaces, two limiters, two different behaviours. Every number below is read from
the source, not from intent.

## Partner API (`/api/v1`)

Limited **per key**, in a fixed 60-second window.

| | |
|---|---|
| Default budget | **60 requests per minute** (`services/api/src/public/key-store.js`) |
| Set per key | yes — `--limit` when the key is issued |
| Window | 60 seconds, fixed, not sliding |
| Exempt | `GET /api/v1/openapi.json`, and `OPTIONS` preflight |

Every response carries the state of your budget, so you never have to guess:

```
RateLimit-Limit: 60
RateLimit-Remaining: 41
RateLimit-Reset: 1793313600
```

`RateLimit-Reset` is a Unix timestamp in seconds, not a duration.

Over budget returns `429` with `Retry-After` in seconds:

```json
{ "error": { "code": "rate_limited", "message": "Rate limit exceeded. Retry in 37 seconds." } }
```

### Batching instead of hammering

`POST /api/v1/check/batch` takes **1 to 100 checks** in one request and costs **one**
request against your budget. A hundred single `/check` calls cost a hundred.

If you are checking a portfolio, batch it. The limit is designed on the assumption that
you will.

## Internal API (`/v1`)

Limited **per IP**, and only on `GET`.

| | |
|---|---|
| Budget | **120 requests per minute** (`VESTAIL_RATE_LIMIT`, default in `ratelimit.js`) |
| Window | 60 seconds, fixed |
| Applies to | `GET` only — writes are not rate limited here, they are key-gated |
| Behind a proxy | `X-Forwarded-For` is trusted **only** when `VESTAIL_TRUST_PROXY=1` |

That last row matters. With the flag off, the limiter uses the socket address, because a
client that can set its own `X-Forwarded-For` can set its own identity and the limit
stops meaning anything.

## What to do on a 429

1. **Read `Retry-After` and wait that long.** It is in seconds. Do not substitute a
   constant you chose.
2. **Back off exponentially with jitter** if it happens again. Jitter matters: without
   it, every client that hit the wall retries in lockstep and hits it together.
3. **Cap the retries** and surface the failure rather than looping.
4. **Put the retry in one place** — the HTTP client — not in each caller.

## What not to retry

Only `429` and `500` are worth retrying. Every `400` means the request itself is wrong
and will be refused identically the second time; `401` means the key is wrong.

`POST /v1/orders/click` is not idempotent — a retry records a second click, which
inflates attribution. Retry it on `429` and `500` only, and never on a timeout where you
cannot tell whether the first one landed.

## Caching counts against nothing

Reads are cached, and a cached response costs you no budget because it never reaches the
service. See [versioning.md](./versioning.md) for the exact ages. Reference data is good
for a day; honouring that is the cheapest rate-limit strategy available.
