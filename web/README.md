# Vestail v2 app (`@vestail/web`)

The product surface: sign in, declare your country and buyer type, search any of the 20 asset classes (and the
tokenised stocks on Solana), see each verdict with its reasoning and sources, compare across countries, and buy.

Next 15.5, React 19.2, Tailwind 4, TypeScript. A client of the v2 API (`services/api`); it holds no rules itself.

## Run

```bash
cd v2 && npm ci
VESTAIL_API_KEYS=local-dev-key npm start -w @vestail/api   # API on :8787
cp web/.env.example web/.env.local                         # then fill in the Privy keys
npm run dev -w @vestail/web                                # app on :8081 (the site is :8080)
```

The port must be one of the allowed origins in the Privy dashboard.

## Rules this app enforces (and where)

| Rule | Screen | Server |
|---|---|---|
| Three verdicts, never two | `VerdictBadge`, no "allowed" boolean anywhere | — |
| Conditional needs the acknowledgement | `ActionPanel` locks every Buy | `/api/order/click`, `/api/swap/order`, then the API again |
| Cannot-own is never routed or quoted | `ActionPanel` shows no venues or prices | same routes refuse it |
| Not-assessed tokens are never bought | `TokenCard`, `ActionPanel` | `/api/swap/order` and the API refuse it |
| No invented sources | `Provenance` shows "not yet sourced" | — |
| Country is declared, never detected | `ProfileBar`; no IP or locale lookup | `/api/profile` stores only what was chosen |

Sign-in is Privy (email code or Solana wallet; email users get an embedded Solana wallet). Every route that acts for a
user verifies the Privy access token. The API key and Jupiter key stay server-side.
