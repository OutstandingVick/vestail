# Vestail v2 app: handoff for the next agent

Written 2026-10-08 for Codex (or anyone) picking up `v2/web`. Read `v2/HANDOFF.md` and `v2/CLAUDE.md` first for the
whole project; this file covers only the product app and what is left to do.

## Where things are

- Repo `github.com/OutstandingVick/vestail`, branch **`v2-own`**. `main` is v1 and is frozen: never touch it.
- `v2/` is an npm workspace: `packages/core` (resolver, rules, `tokens.js`), `services/api` (Hono API, OpenAPI-validated),
  `web/` (this app), `app/index.html` (the marketing site, single file, no build step).
- App: Next 15.5.25, React 19.2.8, Tailwind 4, TypeScript, Privy for sign-in.

## Running it locally

```bash
cd ~/vestail/v2
VESTAIL_API_KEYS=local-dev-key VESTAIL_CLICKS_FILE=.data/clicks.jsonl npm start -w @vestail/api   # :8787
npm run dev -w @vestail/web                                                                     # :8081
cd app && python3 -m http.server 8080                                                           # marketing site :8080
```

`web/.env.local` (git-ignored, already filled on this machine; template in `web/.env.example`):
`NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `VESTAIL_API_URL`, `VESTAIL_API_KEY=local-dev-key`, `JUPITER_API_KEY`,
`SOLANA_RPC_URL` (server-only Helius URL), optional `VESTAIL_ORDER_SECRET` (required in production), `VESTAIL_DATA_DIR`.
Privy dashboard must list `http://localhost:8081` as an allowed origin. Port 3000 is taken by Docker on this machine.

Checks: `npm test` from `v2/` (78 API tests + core token tests), and in `web/`: `npx tsc --noEmit` and `npx next lint`.
`next build` works but don't run it while `next dev` is running (they share `.next`).

## Rules that cannot bend (enforced in code; keep it that way)

1. **Three verdicts, never two**: `can_own` / `conditional` / `cannot_own`. No "allowed" boolean anywhere. Cannot-own is
   always hatched (`.hatch`), never colour alone.
2. **Conditional needs acknowledgement**, checked where the order is built: `app/api/order/click`, `app/api/swap/order`,
   and again by the API's `POST /orders/click`. The UI checkbox (`components/ActionPanel.tsx`) is convenience only.
3. **Cannot-own is never routed or quoted.** No venues, no prices.
4. **Tokens**: a token with no issuer rule for the country is **not assessed** (`status: null`), never eligible, never
   buyable. A token's verdict is the stricter of issuer policy and class rule (`packages/core/tokens.js`).
5. **Never invent `sources` or `verified_at`.** All 480 class rules are unsourced; the UI says "not yet sourced".
6. **No KYC, no silent region detection.** Country and buyer type are self-declared (`ProfileBar`), stored in the
   `vestail_profile` cookie and on the Privy user's `custom_metadata`.
7. **Never show sample numbers in production.** The dashboard only shows real data with honest empty states.
8. Ask the owner before touching `data/venues.json` or the `ref=vestail` tag logic (commercial agreements).

## How the app is built

| Route | What | Key files |
|---|---|---|
| `/` | Front door; Try App opens Privy popup. `/?signin` opens it automatically (the marketing site links here). | `app/page.tsx` |
| `/app/start` | **First visit only**: giant search + choose country. Redirects to `/app` once a profile exists. | `app/app/(onboarding)/start` |
| `/app` | Portfolio dashboard (balance card, cash, tokenised stocks, verdict counts, value chart, buys, holdings, watchlist) | `components/Dashboard.tsx`, `app/api/portfolio` |
| `/app/search?q=` | Giant search, resolver trail, all 20 classes with verdicts | `app/app/(dash)/search` |
| `/app/asset/[id]?symbol=` | Class verdict + provenance, onchain versions (tokens), action panel, Watch button | `app/app/(dash)/asset/[id]` |
| `/app/compare?asset=&who=` | One class across 12 countries | `app/app/(dash)/compare` |
| `/app/settings` | Profile (name, avatar colour), wallet + deposit (address, QR, export key), country, theme | `components/AccountSettings.tsx`, `ProfileSettings.tsx` |

- `app/app/layout.tsx` = sign-in gate (`AppGate`, restores profile from Privy on a new device).
  `(dash)/layout.tsx` = sidebar, redirects to `/app/start` when no profile. `(onboarding)` has a bare top bar.
- Server reads of the API: `lib/server/api.ts` (rules uncached; reference lists cached 5 min).
- Auth on every acting route: `lib/server/privy.ts` `userFrom(request)` verifies the Privy bearer token
  (`lib/client.ts` `authedFetch` sends it). Server components can't see the user (token is in localStorage), which is why
  the dashboard is a client component fetching `/api/portfolio`.
- Privy metadata: always write through `updateMetadata()` (it merges; Privy's set replaces the whole object).
- Holdings: `lib/server/wallets.ts` (wallets from Privy, never from the browser), `lib/server/holdings.ts` (RPC + Jupiter
  prices). Watchlist and daily value snapshots: `lib/server/store.ts`, one JSON file per user in `web/.data/`.
- Swaps: `lib/swap/inspect.ts`, `lib/server/orderToken.ts`, `lib/server/jupiterSwap.ts` are ported from v1 unchanged in
  behaviour (slippage/price-impact caps, transaction inspection, HMAC order tokens). `components/SwapForm.tsx` signs with
  Privy's `useSignTransaction` (external or embedded wallet).
- Theme: CSS variables in `app/globals.css` (`html[data-theme="dark"]` overrides), same `vestail-theme` key as the site,
  set before paint in `app/layout.tsx`. Text on orange uses `text-on-action` so it stays dark in both themes.
- API additions this round: `GET /tokens` (with `mints`), `GET /tokens/{symbol}?country=&who=`, `POST /orders/click`
  accepts `mint` for Jupiter buys, `GET /orders?session=` (per-user history, same API key only), clicks persisted to
  `VESTAIL_CLICKS_FILE`. All in `docs/api/openapi.yaml` and covered by `test/contract.test.js`.

## State at handoff

- Last pushed commit: `93834f4`. **4 local commits not yet pushed**: `3c89e2e` (wallet in settings), `cbf3af4` (portfolio
  never blank), `585da19` (display name/avatar), `65858a7` (balance card), plus this handoff. Push with
  `git push origin v2-own`.
- **Not verified signed in.** The previous agent couldn't complete a Privy login, so these were checked only by server
  responses, types and lint: onboarding → dashboard flow, dashboard rendering with real data, settings save, the
  acknowledgement gate in the browser, and a real Jupiter swap. Sign in at `http://localhost:8081` and walk them first.
- The owner's account has Nigeria / citizen saved.

## Multichain (added 2026-10-08)

Scope agreed with the owner for the hackathon: Solana (v1's catalog), Robinhood Chain, Base, Hyperliquid. Arbitrum was
dropped (USDY has no usable DEX liquidity there).

| Chain | Assets | Instrument | How it's bought |
|---|---|---|---|
| Solana | v1's 11 | per issuer | Jupiter, USDC (`SwapForm`, `/api/swap/*`) |
| Robinhood Chain (4663) | NVDA `0xd060…9EEC`, TSLA `0x322F…3b2d` | tokenized_debt (Robinhood Assets Jersey) | KyberSwap, ETH (`EvmSwapForm`, `/api/evm/order`) |
| Base (8453) | Coinbase NVDAc `0xb200…108C` (8 decimals) | tokenized_equity (1:1 share at Alpaca) | KyberSwap, ETH |
| Hyperliquid | `xyz:GOLD`, `xyz:CL`, `xyz:COPPER` (trade.xyz HIP-3) | commodity_derivative | Route-out to trade.xyz (`ExposurePanel`, `/api/order/market`); no in-app orders |

- Data: `data/tokens/evm.json` (+ `policies/robinhood.json`, `coinbase.json`), `data/derivatives/` (+ policy). Core:
  `packages/core/tokens.js` (merges chains, names `instrument`), `derivatives.js` (judged by the venue rule, never the
  commodity class). API: `/tokens` carries `chain`, `address`, `instrument`; `/derivatives`; `orders/click` takes `mint`
  (any chain) or `market`.
- Wallets: everyone gets an embedded EVM wallet (`createOnLogin: "all-users"`); Solana embedded only for users without one.
  Settings lists all wallets with their chains, can create an EVM wallet or link another.
- EVM safety: `lib/swap/inspectEvm.ts` (tested, `npm test` in web/) allows only KyberSwap's router swap, the exact ETH
  amount, output to the buyer. The order route only builds for the user's own Privy-linked EVM wallet.
- Portfolio reads ETH and stock tokens on both EVM chains (KyberSwap prices) and open Hyperliquid positions (shown apart).
- Sourcing caveats: Coinbase doesn't publish its eligible countries, so NG/DE are conditional on that; Hyperliquid's US
  restriction comes from a secondary source (marked so). Policies only cover NG, US, DE; elsewhere = not assessed.
- Not verified signed in: an EVM buy, an embedded EVM wallet being created, Hyperliquid positions with a real account.

## Known issues and next steps (suggested order)

1. **Walk the signed-in flows** above and fix anything visual; check phone width (375px) and dark mode on each page.
2. **Search for SpaceX / OpenAI / Kalshi finds nothing**: they aren't in `data/entities.json`, so the resolver returns
   `none` and the tokens never show. Add them as entities (kind "Private company", asset "Private company shares"), run
   `node packages/core/test.js`, then `node scripts/split-data-from-app.cjs` to keep the site's inline data in step.
3. **Issuer policies only cover NG, US, DE.** In the other 9 countries every token is "not assessed". Research needed;
   never default to eligible.
4. **Storage is single-instance**: clicks (`v2/.data/clicks.jsonl`), watchlists and snapshots (`web/.data`). Move to a
   hosted store before deploying more than one instance.
5. **Value history** only has a point for days the user opened the dashboard. A server job snapshotting daily would fill it.
6. **Deposit** only shows the address. Privy's funding/on-ramp (`useFundWallet`) could add card purchases; needs dashboard setup.
7. Dev log warns `Can't resolve '@farcaster/mini-app-solana'` from Privy. Harmless (optional peer); silence it with a
   webpack `resolve.fallback` or ignore.
8. `next lint` is deprecated in Next 16; migrate with `npx @next/codemod next-lint-to-eslint-cli .` when upgrading.
9. Deploy: the site's Try App reads `window.VESTAIL_APP` for the deployed app URL; production needs
   `VESTAIL_ORDER_SECRET`, `NODE_ENV=production` (hides sample activity), real allowed origins in Privy.

## Conventions

- Commit messages: plain sentences on *why*, ending with a co-author line if your tool adds one. Small, real commits.
- Verify UI changes in a browser, including 375px width. No visual affordance that does nothing.
- The owner also edits `v2/app/index.html` with other agents: commit before switching tools.
