# Authentication

A bearer token in a header. There is no OAuth, no session, no signature.

```
Authorization: Bearer <key>
```

## What needs a key

| Endpoint | Key | Why |
|---|---|---|
| `GET /v1/*` reads | no | Reference data and verdicts are public. |
| `POST /v1/orders/click` | yes | A click is attributed to whoever sent it. |
| `GET /api/v1/openapi.json` | no | You need the contract before you have a key. |
| everything else under `/api/v1` | yes | The partner surface is keyed throughout. |

## The two key systems are not the same

This catches people, because both are "a bearer token".

**Internal** (`VESTAIL_API_KEYS`) is a comma-separated list in the environment. A request
is checked against the SHA-256 of each entry with a constant-time comparison, and the
match returns `key_0`, `key_1` and so on. That index is all that is recorded: a click can
be attributed to a partner **without storing the key itself**.

With no keys configured, every click is refused. That is deliberate — a misconfigured
deploy records nothing rather than recording everything as anonymous.

**Partner** (`/api/v1`) keys are issued through a store, carry a label and a mode
(`test` or `live`), and have their own rate limit. Issue one with:

```bash
node services/api/src/public/keys-cli.js --label "Acme" --limit 60 --mode test
```

A partner key is a record, not a string in an env var: it has usage counted against it
and a budget that can differ per partner.

## What a key is not

A key is **not** a claim about who the buyer is. It identifies the *caller* — the
integration — and nothing else.

Country and buyer type are declared per request. There is no key-level default and there
will not be one, because a key that silently implies a country is a way to get a wrong
verdict without anyone choosing it.

## Handling the key

Server-side only. The partner API has no CORS allowance for browser calls and the
internal click key must never reach a page, because anything in a public page is readable
and a readable key is not a key.

In Vestail's own app this is already true: `web/lib/server/local-api.ts` holds an
in-process key that never leaves the process and never touches the wire.

## Failures

`401 unauthorized` — `A valid API key is required: Authorization: Bearer <key>.`

Missing header, malformed header and wrong key are all the same response. The API does
not tell an unauthenticated caller which of the three it was.
