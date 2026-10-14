# Vestail v2

**What this is:** the frontend for "what can I own here, and where do I buy it?" — a country × asset-class ownership matrix with a resolver that turns free text (Google, a house, gilts) into the right rule per country, a citizen/foreigner toggle, and a buy column that routes to partner venues with an attribution tag.

Open `site/index.html` in a browser to see it. Open `docs/GLOSSARY.html` to understand it end to end.

```
├── README.md                    ← you are here
├── CLAUDE.md                    ← project context for Claude Code (auto-read)
├── CLAUDE_CODE_FIRST_PROMPT.md  ← the mentor's original brief
├── DEPLOY.md                    ← running the API and serving the page
├── app/
│   └── index.html               ← the working page, single file, data inlined
├── data/                        ← the same data, split into modules
│   ├── assets.json  categories.json  aliases.json  entities.json
│   ├── countries.json  venues.json  activity.sample.json
│   └── schema/  README.md (data model) · schemas.json (JSON Schema)
├── services/api/                ← the HTTP API (see services/api/README.md)
├── packages/core/               ← resolver + matrix as a dependency-free ES module
│   ├── index.js  package.json  test.js   (node test.js)
└── docs/
    ├── GLOSSARY.html            ← vocabulary, architecture, build log, open questions
    ├── api/  openapi.yaml · API.md
    └── diagrams/  resolver-pipeline.svg · system-flow.svg
```

## Tokenised stocks

The same listed share exists onchain as several different legal claims. Vestail
records which, where, and what each one actually is:

| Chain | Provider | Tokens | Structure |
|---|---|---|---|
| Solana | xStocks, Backpack, Ondo, Tessera, PreStocks | 92 tokens across 48 symbols | custody-backed, entitlement, note |
| Robinhood Chain | Robinhood | 25 | tokenised debt, not redeemable |
| Base | Coinbase | 1 | share claim, redeemable |

Robinhood's rows are kept current by `npm run tokens:robinhood`, which reads
every address off the chain rather than trusting the registry that listed it.

## Using the core in another app
```js
import { createVestail } from "./packages/core/index.js";
const core = createVestail({ assets, categories, aliases, entities, countries, venues }); // the JSON files
core.resolve("tesla shares");            // -> { stage:"entity", assets:[3,4], trail:[…], perCountry }
core.matrix("farmland", "foreigner");    // -> ranked rows with one cell + cta each
core.venues("cryptocurrency", "NG");     // -> [{ name:"Luno", url:"…?ref=vestail" }, …]
```

## Status of the data
Everything in `data/` is **illustrative**. Rules need legal review and provenance; venues are homepages, not affiliate links; HUD numbers are placeholders. See "Open questions" in the glossary.

## Owner dashboard

The private operational dashboard is available at `http://localhost:8080/admin`.
It reads live Privy accounts, the current catalog and rule matrices, and recorded
route activity. It does not display sample metrics or call a route a completed trade.

Add the owner's exact Privy user ID to `web/.env.local`:

```bash
VESTAIL_ADMIN_USER_IDS=did:privy:your-owner-user-id
```

Separate multiple owners with commas. The server checks this allowlist on every
admin data request; never give it a `NEXT_PUBLIC_` prefix.

## Early access

`/early-access` is a standalone signup page. In production, configure
`KV_REST_API_URL` and `KV_REST_API_TOKEN` for durable, email-deduplicated
storage. Local development falls back to `.data/early-access.jsonl`, which is
git-ignored. The signup API validates every payload, uses a honeypot and keeps a
short-lived in-memory IP rate limit; IP addresses are not written with signups.
