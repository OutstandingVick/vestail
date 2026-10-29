# `GET /v1/health` and `GET /v1/openapi.json`

Two endpoints that exist on the internal API and are not in `openapi.yaml`.

## `GET /v1/health`

```json
{ "ok": true }
```

No parameters, no key, no cache header. It answers if the process is up and the data
loaded — and the second half is the useful part: the core refuses to start when a country
is missing a rule or a rule is malformed, so a service that answers `health` has a rule
set that parsed.

It is not a readiness probe for anything downstream. There is nothing downstream.

## `GET /v1/openapi.json`

The contract this service validates itself against, served as JSON.

Not a copy of `docs/api/openapi.yaml` — it is the same document, loaded at startup by
`src/spec.js`. Requests are validated against it at runtime, so what you fetch here is
what the service is actually enforcing, not a description of it.

## Why they are not in the spec

Because a document cannot neatly contain its own delivery, and `/health` predates the
spec. Neither is a gap in behaviour, but both were a gap in documentation: a route that
exists and is written down nowhere is one a caller finds by accident.

The `/api/v1` surface has its own `GET /openapi.json`, generated from Zod rather than
hand-written. See [partner-reference.md](./partner-reference.md).

## Stability

`/health` returning `{ "ok": true }` is safe to depend on. It will not grow fields that
change its meaning; if richer status is ever needed it goes somewhere else.
