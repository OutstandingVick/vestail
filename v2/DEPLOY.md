# Deploying Vestail v2

Two independent pieces:

- **The API** (`services/api`): a Node process that serves `/v1/*`.
- **The page** (`app/index.html`): one static file. It works on its own with inline data, and optionally talks to the API.

You can ship the page alone, the API alone, or both.

## Requirements

- Node 22 or newer (developed on 24).
- Run everything from `v2/`, which is an npm workspace.

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

## The page

`app/index.html` is self-contained: serve it from any static host or open it as a file. On its own it uses its inline data, and Buy links go straight to the venue with `ref=vestail`.

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

v2 lives in `v2/` on its own branch. The Vestail Next.js app at the repo root doesn't build, lint or typecheck anything in `v2/`, so deploying one never affects the other.
