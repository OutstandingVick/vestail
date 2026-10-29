# `GET /v1/orders`

The Buy presses recorded for one session.

```
GET /v1/orders?session=<id>&limit=20
```

## Query parameters

| Name | Required | Default | Notes |
|---|---|---|---|
| `session` | yes | — | The session id sent with the clicks. |
| `limit` | no | `20` | Clamped to 1–200. A value outside that is pulled into range, not refused. |

## Requires a key

`Authorization: Bearer <key>`. Click history is attributable data, so it is not public
the way the rule endpoints are. See [authentication.md](../authentication.md).

## What a session is, and is not

An opaque id your client generates and sends with each [click](./orders-click.md). It is
not an account, not a user id, and Vestail does not resolve it to a person.

That is a deliberate limit rather than an oversight: Vestail has no KYC and does not
identify buyers, so there is nothing stronger to key this on and nothing stronger is
wanted.

## Held in memory

The click log currently lives in the process and resets on restart, which also means it
is not shared between instances — only one API instance can run until it moves to a
store. It is recorded as an open issue in [HANDOFF.md](../../../HANDOFF.md).

Do not build anything that assumes this history is durable.

## Errors

| Status | Code | When |
|---|---|---|
| `401` | `unauthorized` | Missing or wrong key. |
| `400` | `validation` | No `session`. |
