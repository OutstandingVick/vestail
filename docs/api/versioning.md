# Versioning and caching

## The version is in the path

`/v1` and `/api/v1`. There is no version header and no `?version=` parameter; the URL is
the whole statement.

### What would bump it

A change that silently alters the meaning of a response a client is already reading:

- **the verdict scale** — adding a fourth value, or changing what `conditional` means
- **buyer types** — making `resident` a real third value rather than something clients
  coerce to `foreigner`
- **identifier changes** — renaming an asset id, since ids are the contract
- **collapsing the duplicate error codes** in [errors.md](./errors.md), because a client
  branching on `unknown_country` would stop matching

### What would not

- new endpoints
- new optional query parameters
- **new fields on an existing response**

That last one is the contract with you: read the fields you know and ignore the rest. A
client that breaks when a field is added is a client that cannot be improved around.

## Caching

Set by `services/api/src/cache.js`, and only on successful responses — a 4xx or 5xx is
never cached.

| Path | `Cache-Control` | Why |
|---|---|---|
| `/v1/assets`, `/categories`, `/countries`, `/entities`, `/venues` | `public, max-age=86400` | Reference data changes with a deploy, not with a request. |
| `/v1/tokens` | `public, max-age=86400` | The symbol list, same reasoning. |
| `/v1/matrix`, `/v1/rules/*`, `/v1/tokens/*` | `public, max-age=3600` | Verdicts. An hour. |
| `/v1/activity` | `no-store` | Never cached. |

Honouring these costs nothing and is the cheapest way to stay inside the rate limit — a
cached response never reaches the service.

### The hour on verdicts is a known problem

An hour is a sensible default for a catalogue and a bad one for a compliance answer. A
rule corrected today keeps being served, stale, for up to an hour after the correction.

Vestail's claim is accuracy, so this is a real tension and not a rounding error. It is
recorded in [HANDOFF.md](../../HANDOFF.md) as an open issue; the likely fix is a shorter
`max-age` with `stale-while-revalidate`, or a data-version parameter clients can bust.

Until then: **if you have just corrected a rule, do not trust a read for an hour.**

## Deprecation

Nothing is deprecated yet, because nothing has shipped publicly. When something is, it
will be announced before it is removed and the removal will be a version bump, not a
quiet 404.
