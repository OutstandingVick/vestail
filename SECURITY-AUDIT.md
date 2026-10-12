# Vestail v2 security audit

Date: 2026-10-12 · Scope: `v2/` on branch `v2-own` (`main`, v1, was not touched) · Method: code review of
every server route and signing path, decoding real aggregator transactions, `npm audit`, a secret scan of git
history and the client bundle, and browser checks of the new security headers.

**The question:** could a user lose funds, or be misled into buying something they can't legally own?

Vestail is non-custodial: it never holds keys or funds. v2 signs on three chains (Solana through Jupiter;
Base and Robinhood Chain through KyberSwap), routes to a fourth (Hyperliquid, link-out only), creates
embedded wallets through Privy, and runs its own API that records and re-checks every buy.

## Summary

| Severity | Found | Fixed in this audit |
|---|---|---|
| Critical | 0 | — |
| High | 6 | 6 |
| Medium | 6 | 4 (2 are recommendations) |
| Low | 6 | 1 (rest are recommendations) |

No path lets Vestail move funds without the user's signature, and no secret reaches the browser. The high
findings were all ways an untrusted aggregator, a compromised server, or a wallet on the wrong network could
get a harmful transaction in front of the wallet. All six are fixed, each in its own commit.

---

## High

### H1. Solana swaps were only inspected on the server — fixed
`web/components/SwapForm.tsx` (before the fix it went straight from the server's response to `signTransaction`).
The server inspects Jupiter's transaction (`web/app/api/swap/order/route.ts:96`), but the browser didn't. A
compromised or impersonated server could hand the wallet any transaction to sign. v1 checked in both places.
**Fix:** the form now runs the same `inspectSwapTransaction` (allowed programs, no approve/delegate,
no authority changes, SOL outflow cap, buyer is the signer) before the wallet opens
(`SwapForm.tsx:65`). Commit `17a98ba`.

### H2. The EVM check searched calldata for the buyer instead of decoding it — fixed
`web/lib/swap/inspectEvm.ts` (old version). It accepted any calldata that contained the buyer's address
anywhere. KyberSwap's `swapSimpleMode` takes a `caller` argument, so an aggregator could name the buyer as
caller while setting `dstReceiver` to itself, and the check passed. **Fix:** the calldata is decoded with the
router's ABI (`inspectEvm.ts:38`); the receiver, input token (native ETH), output token, amount and fee
receivers are each checked. Tests use a real KyberSwap build and tampered variants, including exactly this
attack. Commit `85b63ef`.

### H3. No check on the EVM swap's onchain minimum output — fixed
A build with `minReturnAmount` near zero would let a sandwich attack take almost the whole buy; nothing
checked it. **Fix:** the decoded minimum must be within 3% of the quote the buyer saw, the same ceiling the
Solana path uses (`inspectEvm.ts:51`). Commit `10a0069`.

### H4. EVM buys could be sent on the wrong chain — fixed
`web/components/EvmSwapForm.tsx`. The form asked the wallet to switch chain and then sent without checking the
switch took. KyberSwap's router has the same address on Base and Robinhood Chain, so a wallet left on the
other network would run the swap there. **Fix:** reads `eth_chainId`, refuses on mismatch, and pins `chainId`
in the transaction (`EvmSwapForm.tsx:65`). Commit `abf135d`.

### H5. EVM swaps were only inspected on the server — fixed
Same reasoning as H1, for KyberSwap. **Fix:** the form decodes and checks the transaction against the
buyer's own wallet, the token they picked and the ETH they typed before opening the wallet
(`EvmSwapForm.tsx:59`). Commit `ee96e94`.

### H6. No Content-Security-Policy or anti-framing headers — fixed
`web/next.config.ts`. Any page could be framed by another site (clickjacking a buy), and nothing limited which
scripts ran where people sign. **Fix:** the app's pages allow code only from this origin, Privy and
WalletConnect (`next.config.ts:17`); every page sends `frame-ancestors 'none'`, `X-Frame-Options: DENY`,
`nosniff`, a referrer policy and a permissions policy; the marketing page gets a fonts-only policy.
Checked in the browser: sign-in, the Privy wallet popup and the marketing page load with no violations.
Commit `0e5b08e`. See M6 for what remains.

---

## Medium

### M1. Transactions weren't simulated before signing — fixed (both chains)
A swap that would fail (empty wallet, stale route) still opened the wallet and could cost fees. **Fix:** EVM
buys are dry-run with `eth_call` from the buyer's address (`web/app/api/evm/order/route.ts:86`, commit
`a21cc0f`); Solana buys with `simulateTransaction` on the server's own RPC, signatures not yet checked
(`web/app/api/swap/order/route.ts:102`, commit `42f82a9`). *Not yet exercised against a live order; see
"what this audit does not cover".*

### M2. Links and redirects from data weren't scheme-checked — fixed
Issuer and rule source links (`TokenCard.tsx`, `Provenance.tsx`, the exposure page) and buy redirects
(`ActionPanel.tsx`, `ExposurePanel.tsx`) were used as given. A `javascript:` or `data:` URL in a data file or
API response would have become a link or a navigation on a signing page. **Fix:** `web/lib/safeUrl.ts` allows
only https and drops anything else; tested. No current data uses plain http. Commit `efae95b`.

### M3. High-severity npm advisories (PostCSS, ws) — fixed
`npm audit` reported PostCSS (via Next; build-time) and `ws` (via Privy's WalletConnect/wagmi connectors;
server-side library). npm's own fix for `ws` was to downgrade Privy. **Fix:** Next 15.5.27 with an override
that reaches Next's bundled PostCSS, and a range-scoped override moving only `ws` 8.0.0-8.20.1 to ^8.22.0.
`npm audit` now reports no high or critical issues (28 moderate remain, in Privy/WalletConnect's dependency
tree). Commits `b9e2031`, `7490f3a` (the first override didn't reach Next's copy; the second did), `7268278`.

### M4. EVM price-impact check trusts the aggregator's own valuation — recommendation
`web/app/api/evm/order/route.ts:72` compares KyberSwap's `amountInUsd` and `amountOutUsd`. Both come from the
same untrusted source, so a manipulated quote can report a fair price. **Recommendation:** compare the quoted
output against an independent reference: Robinhood stock tokens have per-asset Chainlink feeds on Robinhood
Chain, and Pyth covers the Solana tokens (v1 already used Pyth). It belongs right after the route call, before
`build`. H3's minimum-output floor limits the damage meanwhile.

### M5. The API allows any origin by default — recommendation
`services/api/src/app.js:29` sets CORS to `*` unless `VESTAIL_CORS_ORIGINS` is set. Writes need an API key and
the key now lives only on the web server, so this isn't exploitable today, but production should set
`VESTAIL_CORS_ORIGINS` to the real site origin.

### M6. `'unsafe-inline'` in the app's script policy — recommendation
`web/next.config.ts:19`. Next's inline bootstrap and the pre-paint theme script need it, so injected inline
script isn't blocked by the CSP. Moving to per-request nonces via middleware removes it. There is no known
injection point (React escapes output; the one `dangerouslySetInnerHTML` at `web/app/layout.tsx:24` is a
constant string), so this is defence in depth.

---

## Low

- **L1. Profile cookie readable by scripts — fixed.** The declared country and buyer type, which every verdict
  and buy gate reads, sat in a cookie scripts could rewrite. It's now `httpOnly`, and `secure` in production
  (`web/app/api/profile/route.ts`). Commit `929ed8c`. By design the country is self-declared, so a user can
  always choose another; the fix only stops a script doing it silently.
- **L2. Order tokens can be replayed for 120 seconds** (`web/lib/server/orderToken.ts`, `TTL_SECONDS`). Executing
  the same signed transaction twice is harmless (same signature), but a used-requestId set would close it.
- **L3. Solana wallets auto-reconnect** (`web/components/Providers.tsx:7`, `shouldAutoConnect: true`). This only
  restores a wallet the user already connected; nothing is auto-prompted on page load. Fine as is.
- **L4. Rate limit and click store are in memory or one file per process** (`services/api/src/app.js:28`,
  `services/api/src/clicks.js:22`, `web/lib/server/store.ts`). These are reliability issues, not fund risks;
  replace with a shared store before running more than one instance. User ids are sanitised before becoming
  filenames (`store.ts:19`).
- **L5. `ws://localhost` and `'unsafe-eval'`** are added to the CSP only in development; confirm the
  production build is served with `NODE_ENV=production`.
- **L6. Admin endpoint** (`web/app/api/admin/overview`) is gated on `VESTAIL_ADMIN_USER_IDS` through the verified
  Privy user. Keep that list short and never default it to "everyone".

---

## What checked out

- **Every route that acts for a user verifies the Privy token** (`userFrom` in `web/lib/server/privy.ts`):
  account, avatar, activity, admin, EVM order, order click, order market, portfolio, profile, swap order, swap
  execute, watchlist. The public avatar GET route only serves `uuid.(jpg|png|webp)` files.
- **Buy gates hold server-side on every path.** `api/order/click`, `api/swap/order`, `api/evm/order` and
  `api/order/market` each re-read the verdict from the API for the declared country, refuse `cannot_own` and
  not-assessed (`status: null`), and require `acknowledged: true` for conditional; the API's `POST /orders/click`
  checks all of it again for the venue, mint and market branches. Nothing takes a verdict from the request body.
- **The EVM taker must be one of the user's own Privy-linked wallets**, read server-side
  (`web/app/api/evm/order/route.ts:62`).
- **Token addresses come only from the repo's registry** (`data/tokens/representations.json`, `evm.json`); the
  Jupiter route checks the returned mints and amount match; EVM addresses compare case-insensitively
  (`packages/core/tokens.js:75`); nothing matches on symbol. USDC, wrapped SOL, native ETH and the KyberSwap
  router are hardcoded constants. Every EVM address was read onchain when added (NVDAc: 8 decimals).
- **Solana transaction rules** (`web/lib/swap/inspect.ts`): allowlisted programs only; approve, approveChecked,
  setAuthority, closeAccount on the user's accounts refused; SOL outflow capped; slippage capped at 3%
  (`swap/order/route.ts:34`) and price impact at 10%.
- **Swap execution only lands orders this server built**: HMAC order tokens with a 120-second expiry and a
  timing-safe compare; `VESTAIL_ORDER_SECRET` is required in production (`orderToken.ts:32`).
- **No session signers or delegated actions** are used: the server cannot sign for anyone.
- **No private key or seed phrase is ever handled.** Export goes through Privy's own iframe; no input accepts one.
- **File-serving routes refuse path traversal** (`web/app/assets/[...path]/route.ts:13` checks the resolved path
  stays inside `site/assets`; `/` serves one fixed file). Checked: `/assets/../index.html` returns 404.
- **No SSRF:** every outbound URL (RPC, Jupiter, KyberSwap, Hyperliquid) is a constant host; user input only
  ever lands in validated query parameters.
- **Secrets:** no secret behind `NEXT_PUBLIC_` (only the Privy app ID, public by design); `.env*` files are
  gitignored; no secret found in git history; the Privy secret, API key and RPC key are absent from the
  client bundle (`.next/static`).
- **Supply chain:** `@privy-io/*`, `@solana/*`, `@solana-program/*` and `viem` are the real published packages;
  the lockfile is committed. `qrcode` is long-established and widely used.
- **What users are shown:** the sign-in page says plainly there's no ID/KYC and that email sign-ups get a wallet
  only they can use; every buy shows the token, chain, issuer, instrument type, amount and expected output;
  conditional buys show the actual condition above the acknowledgement checkbox; the 480 class rules are
  labelled as unsourced guides.

## Operational recommendations

- **2FA everywhere that can change what users load:** GitHub (the repo and any CI), the host (Vercel or
  wherever this deploys), the domain registrar and DNS, and the Privy dashboard.
- **Domain hijacking is the likeliest real attack** on a non-custodial app: whoever controls the DNS serves a
  page that asks wallets to sign. Lock the domain at the registrar, enable DNSSEC, and alert on DNS changes.
- **Keep Privy's allowed origins to real domains only.** Remove `localhost` entries in production.
- **Offer Privy MFA** (authenticator or passkey) for signing and key export: an embedded wallet is only as safe
  as the user's email account.
- **Tell users to check the URL** before signing in or signing. Vestail will never ask for a seed phrase.

## What this audit does NOT cover

- Privy's, KyberSwap's, Jupiter's and Hyperliquid's own security, and the smart contracts of the issuers'
  tokens (xStocks, Ondo, Robinhood, Coinbase and others). A flaw there is outside Vestail's code.
- **Live end-to-end runs.** No real Solana or EVM buy was executed during the audit, so the new simulation
  steps (M1) and the browser-side checks were verified by tests and code review, not with funds.
- Smart-contract-level analysis of KyberSwap's executor: the check pins the router and decodes its
  description, but doesn't trace what the executor does internally.
- **The legal accuracy of the rules.** All 480 asset-class rules are unsourced; issuer policies cover Nigeria,
  the US and Germany only. A wrong rule can mislead a buyer without any security bug.
- The marketing page's own scripts (`site/index.html`) beyond its CSP, and the separate v1 app on `main`.
- Denial of service, infrastructure and hosting configuration, and anything not in this repository.
