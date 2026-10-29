# Deploying Vestail v2

Two independent pieces:

- **The API** (`services/api`): a Node process that serves `/v1/*`.
- **The page** (`site/index.html`): one static file. It works on its own with inline data, and optionally talks to the API.

You can ship the page alone, the API alone, or both.

## Requirements

- Node 22 or newer (developed on 24).
- Run everything from the repo root, which is an npm workspace.

```bash
npm ci
npm test
```

## The API

```bash
NODE_ENV=production VESTAIL_API_KEYS=<key> npm start -w @vestail/api
```

It listens on `PORT` (default 8787) and serves everything under `/v1`. Check it with `GET /v1/health`, which returns `{"ok":true}`, and read the contract at `/v1/openapi.json`.

| Variable | Default | Set it to |
|---|---|---|
| `NODE_ENV` | | `production`. Without it `/activity` serves the sample figures, which must never reach real users. |
| `PORT` | `8787` | Whatever your host expects. |
| `VESTAIL_API_KEYS` | none | Comma-separated keys allowed to `POST /orders/click`. With none set, every click is refused. |
| `VESTAIL_CORS_ORIGINS` | `*` | The origin(s) serving the page, e.g. `https://vestail.fun`. |
| `VESTAIL_TRUST_PROXY` | off | `1` when behind a proxy or load balancer, so rate limits use the client's IP from `X-Forwarded-For`. Leave it off otherwise, or clients can spoof their IP. |
| `VESTAIL_RATE_LIMIT` | `120` | GET requests per IP per minute. |

The data in `data/*.json` is read once at startup, so restart the API after editing it. The core refuses to start if a country is missing a rule or a rule is malformed, and the error names the rule.

### Run a single instance

Recorded clicks, which feed `/activity`, and the rate-limit counters are held in memory. They reset on restart and aren't shared between processes. Run exactly one instance until they move to a database; with two or more, each would count its own clicks and its own limits.

## Exposing the API, which has not been done

The API is not reachable from the internet. `vestail.fun/v1/*` and `/api/v1/*` both
return 404, because `web/lib/server/local-api.ts` calls the Hono app in-process and
nothing routes to it from outside.

That is the right default — the web app needs no network hop, no CORS and no key on the
wire — and it is a gap the moment a partner needs to call `/check`.

Two ways to close it, with different costs:

**Mount it inside the Next app.** A catch-all route handler under `web/app/api/v1/` that
hands the request to `app.fetch`. One deployment, one domain, the partner key checked by
the same code as today. The cost is that the API's lifetime is the web app's, and a
redeploy of the marketing site restarts the API.

**Deploy `services/api` as its own service.** `npm start -w @vestail/api` on any Node
host, behind `api.vestail.fun`. Independent lifetime, and the honest shape if partners
are paying for it. The cost is a second thing to run and monitor, plus CORS, plus the
single-instance limit below.

### Whichever you pick, these have to move first

The click log and both rate-limit counters are **in memory**. They reset on restart and
are not shared between processes, so **only one instance can run** — two would each
count their own clicks and enforce their own limits. See `services/api/src/clicks.js`
and `ratelimit.js`, and the open issues in [HANDOFF.md](HANDOFF.md).

The repo already has KV wired up for invitations, early access and watchlists, and
`web/lib/server/kv.ts` holds a shared helper. The click log is the obvious next user of
it.

### Then update the documentation

`docs/api/README.md`, `docs/api/openapi.yaml`'s `servers` block and the notice on the
`/docs` page all say the API is unreachable. They should stop saying it on the day it
stops being true, and not before.

## The page

`site/index.html` is self-contained: serve it from any static host or open it as a file. On its own it uses its inline data, and Buy links go straight to the venue with `ref=vestail`.

To connect it to the API, add one script tag **before** the page's own `<script>`:

```html
<script>
  window.VESTAIL_API = "https://api.example.com/v1";
  window.VESTAIL_API_KEY = "<one of VESTAIL_API_KEYS>";
</script>
```

- `VESTAIL_API` alone: assets, boards and the activity strip come from the API.
- Adding `VESTAIL_API_KEY`: Buy presses are also recorded through `POST /orders/click`.
- If the API is unreachable the page falls back to its inline data. If a click can't be recorded, the buyer still goes to the tagged venue link.

On the API, set `VESTAIL_CORS_ORIGINS` to the origin the page is served from (e.g. `https://vestail.fun`) so the browser lets the page call it.

**The key in the page is public.** Anyone can read it from the page source and send clicks with it. That's acceptable for tagging clicks as "from the Vestail site", but it doesn't authenticate anyone. Don't reuse a partner's key here.

## Before real users

- **Rules are illustrative.** Every rule's `sources` is empty and `verified_at` is null until checked against a real document. See `data/schema/README.md`.
- **Activity starts at zero** in production and volume stays 0 until real order data exists. That's intended.
- **Venue links are homepages** with the shared `ref=vestail` tag; partner deep links and per-partner tags are still to be agreed.
- **Conditional cells** can only be bought after the buyer ticks the acknowledgement; with the API connected, `POST /orders/click` refuses a conditional click without it. The wording is generic ("a licence, cap, approval or KYC check may apply") until each rule records its specific condition.

## Relationship to Vestail v1

v1 — the Next.js app judged for STOCKLANA — no longer lives here. It was moved to
its own repository once v2 became the product, and this repo's history keeps it at
the tag `v1-stocklana` if anything needs recovering.
