# Quickstart

Five minutes from nothing to an answer you can trust.

## 1. Run it

There is no hosted server yet ([why](./README.md)), so run it locally.

```bash
npm ci
npm start -w @vestail/api        # http://localhost:8787/v1
```

```bash
curl -s "http://localhost:8787/v1/health"
# {"ok":true}
```

## 2. Ask a real question

```bash
curl -s "http://localhost:8787/v1/rules/NG/agricultural_land?who=foreigner" | jq
```

You get a verdict, the venues it would route to, and — this is the part to look at —
`sources` and `verified_at`.

## 3. Notice what is missing

```json
"sources": [],
"verified_at": null
```

Every one of the 480 rules looks like this today. The verdict is illustrative: it shows
the shape of an answer, not a checked one.

**Build for that now.** If your interface shows provenance while it is empty, it starts
telling the truth the moment rules are sourced, and you ship nothing to get there. If it
doesn't, you will be presenting unsourced verdicts as settled and won't notice when that
changes.

## 4. Do it in one call instead

Most integrations want a board, not a cell:

```bash
curl -s "http://localhost:8787/v1/matrix?q=farmland&who=foreigner&sort=status" | jq '.rows[0]'
```

[`/matrix`](./reference/matrix.md) resolves the text, looks up every country and attaches
the venues, server-side. See [API.md](./API.md).

## 5. Record the buy

```bash
curl -s -X POST "http://localhost:8787/v1/orders/click" \
  -H "Authorization: Bearer $VESTAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country":"NG","asset":"agricultural_land","who":"foreigner","venue":"...","acknowledged":true}'
```

Start the server with `VESTAIL_API_KEYS=local-dev-key` or every click is refused — which
is [deliberate](./authentication.md).

Follow the `redirect` it returns rather than building the url yourself.

## Then read

| | |
|---|---|
| [conventions.md](./conventions.md) | Before you write a client. The two surfaces disagree. |
| [errors.md](./errors.md) | All seventeen codes and which are worth retrying. |
| [reference/](./reference/README.md) | A page per endpoint. |

## The one thing not to get wrong

Three verdicts, never two. `conditional` means you may hold it but something stands
between you and using or exiting it. A client that renders it as a near-miss `can_own`,
or hides it with `cannot_own`, has removed the only reason to use this API.
