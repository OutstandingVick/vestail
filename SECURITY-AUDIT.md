# Vestail security audit

**Scope:** one question — *could a user who connects their wallet lose funds?*
Vestail is non-custodial: it never holds keys, funds or tokens, so this audit
looks at the places where a loss is still possible — the transaction the user
is asked to sign, the mint addresses money is routed into, the price they get,
the page the signing happens on, and the code that page is built from.

**Date:** 2026-09-23 · **Commit audited:** `4989ada` · **Method:** manual
review of the swap path, the registry and policy loaders, the landing and app
UI, the Next config and the dependency tree, plus `npm audit`.

**Headline:** the wallet was being handed a transaction that nothing in this
codebase had inspected. Everything else found is smaller than that.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| C1 | **Critical** | The transaction from Jupiter is signed without being inspected | Fixed |
| H1 | **High** | No simulation before the wallet is asked to sign | Fixed |
| H2 | **High** | Slippage is neither requested nor capped | Fixed |
| H3 | **High** | No security headers: the signing page can be framed | Fixed |
| H4 | **High** | Unused dependency carrying a high-severity advisory | Fixed |
| M1 | Medium | No reference-price sanity check on the quote | Part fixed |
| M2 | Medium | A third-party font loads on the signing page | Fixed |
| M3 | Medium | The amount on screen is not the amount signed | Open |
| M4 | Medium | `source` URLs are validated as URLs, not as https | Fixed |
| L1 | Low | `rel="noreferrer"` without `noopener` | Open |
| L2 | Low | The wallet reconnects on every page, including marketing pages | Open |
| L3 | Low | Dependencies are ranges, not pins | Open |
| L4 | Low | The RPC key is shipped to the browser | Open |

---

## Critical

### C1 — The transaction from Jupiter is signed without being inspected

**Where:** [`hooks/useBuy.ts:81-89`](hooks/useBuy.ts), fed by
[`app/api/swap/order/route.ts:204`](app/api/swap/order/route.ts)

**What the code did.** `/api/swap/order` takes the base64 `transaction` string
out of Jupiter's response and passes it through to the browser. `useBuy`
deserialises it, checks one thing — that the connected wallet is among the
required signers — and hands it to `signTransaction`.

That check answers "is this transaction *for* me". It does not answer "what
does this transaction *do*". Every instruction in it was unexamined.

**Why it is exploitable.** The response from `api.jup.ag` is untrusted input.
It becomes hostile if Jupiter's API is compromised, if its DNS or TLS is
subverted, if a proxy sits between the two servers, or if the endpoint
constant is ever changed to something else. In any of those cases the returned
transaction could contain:

- an SPL `Approve` granting an attacker unlimited delegate authority over the
  user's USDC account — the user keeps their balance, and the attacker can
  drain it at leisure, afterwards;
- a `SetAuthority` reassigning ownership of a token account;
- a plain `SystemProgram::Transfer` moving SOL to an address of their choosing;
- a `CloseAccount` sending the rent, and any balance, elsewhere.

None of those would have been caught. The wallet would show its own warning
screen, which most users click through, and Vestail — the thing the user
trusted to check the trade — would have said nothing.

This is the finding that matters. Everything below is smaller.

**Fix applied.** A pure verifier, [`lib/swap/inspect.ts`](lib/swap/inspect.ts),
deserialises the transaction and rejects it unless:

- every top-level program is on a fixed allowlist (System, Compute Budget,
  SPL Token, Token-2022, Associated Token Account, Memo, Jupiter's aggregator).
  Program ids cannot come from an address lookup table, so this check cannot be
  evaded by hiding one there;
- no SPL Token instruction is `Approve`, `ApproveChecked`, `Revoke`,
  `SetAuthority`, `Burn`, `BurnChecked`, `FreezeAccount` or `InitializeMultisig`
  — Vestail never needs a delegation, and never an unlimited one;
- every `CloseAccount` returns its lamports to the taker, which is what
  unwrapping wrapped SOL legitimately does, and nothing else;
- no `SystemProgram::Transfer` sends lamports to anyone but the taker;
- the fee payer is the taker, and the taker is a required signer.

It runs **twice**: on the server in `/api/swap/order` before the transaction is
ever sent to the browser, and again in `useBuy` immediately before signing, so
a compromise of the Vestail server alone cannot get a bad transaction signed.
25 tests in [`tests/inspect.test.mjs`](tests/inspect.test.mjs) cover each
rejection, including a hand-built `Approve` — the delegation that drains a
wallet hours later — and a lamport transfer to a stranger.

---

## High

### H1 — No simulation before the wallet is asked to sign

**Where:** [`hooks/useBuy.ts:81-89`](hooks/useBuy.ts)

**Why it matters.** A transaction that will fail on chain still costs the fee,
and a failure is the signal that something about the order is wrong — a stale
blockhash, a missing account, a route that no longer exists. Asking a user to
sign first and find out afterwards spends their money to learn something the
RPC would have said for free.

**Fix applied.** `useBuy` now simulates against the user's own RPC connection
with `sigVerify: false` and `replaceRecentBlockhash: true` before prompting,
and aborts with the simulation's own error rather than opening the wallet.

### H2 — Slippage is neither requested nor capped

**Where:** [`app/api/swap/order/route.ts:134`](app/api/swap/order/route.ts),
[`lib/server/jupiterSwap.ts:96`](lib/server/jupiterSwap.ts)

**Why it matters.** `getOrder` sent no `slippageBps`, so every order used
Jupiter's automatic slippage, whatever it decided that was. The value came back
in `order.slippageBps`, was copied into the quote, and was never compared
against anything or shown to the user. On a thin or manipulated pool that is
the difference between a trade and a donation.

**Fix applied.** Orders now ask for an explicit 100 bps (1%), and any order
that comes back with more than 300 bps is refused rather than offered for
signature.

### H3 — No security headers: the signing page can be framed

**Where:** [`next.config.ts`](next.config.ts) (was empty)

**Why it matters.** With no `frame-ancestors` or `X-Frame-Options`, any site
can iframe `/app`, overlay it, and clickjack a user into the buy button and a
signing prompt. With no Content-Security-Policy, any script that does get onto
the page — through a compromised dependency, most likely — can swap the
transaction between the order and the wallet, which is the classic drainer
pattern and is invisible to the user.

**Fix applied.** A `headers()` block sets `Content-Security-Policy`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`,
`Permissions-Policy` and `Strict-Transport-Security`. The CSP allows only
`'self'` for scripts and the RPC and Jupiter origins for connections, and sets
`frame-ancestors 'none'`.

### H4 — Unused dependency carrying a high-severity advisory

**Where:** [`package.json`](package.json)

`@solana/spl-token` pulls in `bigint-buffer`, which has a high-severity buffer
overflow (GHSA-3gc7-fjrx-p6mg). `npm audit` reports four high findings and all
of them trace to it. It is imported by nothing in this repository — the balance
hook reads token accounts through `@solana/web3.js` instead.

**Fix applied.** Removed. `npm audit` goes from four high findings to one.

That one remaining `postcss` advisory is a transitive of Next 15 whose only fix is
Next 16. postcss runs at build time and never reaches a user's browser, so it
does not put funds at risk; it should be closed by a Next 15.x patch when one
ships rather than by a major upgrade during a hackathon.

---

## Medium

### M1 — No reference-price sanity check on the quote

**Where:** [`app/api/swap/order/route.ts:160-180`](app/api/swap/order/route.ts)

Nothing compares Jupiter's quoted output against an independent price. A
manipulated pool, or simply a very thin one, can quote a rate far from the real
share price and Vestail will present it as the price. `priceImpactPct` comes
back from Jupiter and is not checked either.

**Partly fixed.** `priceImpact` is now read: an order that prices more than
10% from the market is refused. The number was measured on live routes before
being chosen — at 2% this refuses Tessera's OPENAI and KALSHI outright, at
five dollars, because their pools really are that thin, and those are real
tokens a buyer may want. Vestail discloses rather than forbids, so the line
sits where a purchase is obviously value-destroying rather than merely
expensive.

**Still open.** Nothing cross-checks the price against an independent source,
and nothing tells the buyer that a route is pricing 3% from the market — it is
simply allowed. Both want the Pyth reference feed for the underlying share
(`lib/server/pyth.ts` already exists; the equity feeds are not available on
the current plan) and a number on screen, which is M3's territory.

### M2 — A third-party font loads on the signing page

**Where:** `@solana/wallet-adapter-react-ui/styles.css:1`, imported by
[`components/SolanaProvider.tsx:12`](components/SolanaProvider.tsx)

The wallet adapter's stylesheet begins with
`@import url('https://fonts.googleapis.com/…')`. Every page that can sign a
transaction therefore makes a request to a third-party origin, which leaks
referrer data and adds an origin that would have to be allowed in the CSP.

**Fixed.** The stylesheet is vendored at `components/wallet-adapter.css`,
copied verbatim apart from dropping the import and pointing its three font
stacks at `--font-sans`. Verified in the browser: no request to googleapis or
gstatic on `/app`.

### M3 — The amount on screen is not the amount signed

**Where:** [`hooks/useBuy.ts:49-70`](hooks/useBuy.ts)

The "You get" figure comes from an estimate fetched without a taker. When the
user presses buy, a *fresh* order is fetched and signed. That is the right
behaviour — a stale quote is worse — but the number on screen is never updated
to the one being signed, and Vestail shows no confirmation step of its own. The
wallet shows the real amounts, which is the backstop, but Vestail's own screen
can be out of date at the moment of signing.

**Recommended fix.** After the fresh order returns, show its `outAmount` and
the minimum received after slippage, and require a second press to sign.

### M4 — `source` URLs are validated as URLs, not as https

**Where:** [`lib/types.ts:105`](lib/types.ts),
[`lib/types.ts:193`](lib/types.ts), [`lib/types.ts:226`](lib/types.ts)

`z.string().url()` accepts `javascript:alert(1)` — it is a syntactically valid
URL. Those fields are rendered into `href` attributes
([`components/app/VersionCards.tsx:161`](components/app/VersionCards.tsx)). The
policy schema already requires `https://` at line 260; the registry and verdict
schemas do not.

Exploitability is low — the values come from JSON committed to this repository,
so an attacker needs repository write access, at which point they have better
options. It is a one-line hardening.

**Fixed.** `.startsWith("https://")` added to all three. Every value in the
repository today is already https, so nothing changed but the guarantee.

---

## Low

- **L1 — `rel="noreferrer"` without `noopener`.** Every `target="_blank"` link
  carries `noreferrer`, which implies `noopener` in every current browser, so
  `window.opener` is already null. Adding `noopener` costs nothing and removes
  the dependency on that implication.
- **L2 — The wallet reconnects on every page.**
  [`components/SolanaProvider.tsx:40`](components/SolanaProvider.tsx) sets
  `autoConnect`, which reconnects a previously authorised wallet on the landing
  page and the docs as well as the app. It does not prompt anyone who has not
  already authorised the site, and it cannot sign anything, but it means
  marketing pages read the user's address. Consider limiting the provider to
  `/app`.
- **L3 — Dependencies are ranges, not pins.** `package-lock.json` is committed,
  so installs are reproducible with `npm ci`; the `^` ranges in `package.json`
  mean a fresh `npm install` can still pull a new minor of a wallet library.
  Deploys should use `npm ci`.
- **L4 — The RPC key is shipped to the browser.** `NEXT_PUBLIC_RPC_URL`
  contains a Helius key and is inlined into client JavaScript. This is inherent
  to a browser wallet app and the key cannot move funds, but it can be used up
  by anyone who copies it. Restrict it by origin in the Helius dashboard.

---

## What was checked and found clean

- **No private keys anywhere.** Nothing in the repository accepts, stores, logs
  or transmits a secret key, seed phrase or mnemonic. There is no input field
  that could receive one: the only text inputs are a decimal amount and two
  search boxes over fixed lists.
- **Mint integrity.** Every mint that can be bought is looked up in
  `registry/representations.json`, which is committed to the repository, by
  full base58 address — [`lib/registry.ts:31`](lib/registry.ts) compares whole
  strings, never symbols and never prefixes. A mint that is not in that file is
  refused with a 404 before Jupiter is called
  ([`app/api/swap/order/route.ts:117`](app/api/swap/order/route.ts)). The
  registry itself is generated offline with per-issuer proof and verified on
  chain; see the README. USDC and wrapped SOL are hardcoded `PublicKey`
  constants ([`lib/constants.ts:47`](lib/constants.ts)), not fetched, and the
  input mint must be one of exactly those two.
- **The eligibility rule is enforced server-side**, not just in the interface:
  restricted and unassessed versions are refused a quote and a transaction, and
  conditional ones need the acknowledgement
  ([`app/api/swap/order/route.ts:120-133`](app/api/swap/order/route.ts)).
- **Order binding.** `/api/swap/execute` accepts only orders carrying a valid
  short-lived HMAC bound to Jupiter's `requestId`
  ([`lib/server/orderToken.ts`](lib/server/orderToken.ts)), compared with
  `timingSafeEqual`, expiring after 120 seconds. Vestail's Jupiter credentials
  cannot be borrowed to land a swap that never passed the checks.
- **No XSS surface.** No `dangerouslySetInnerHTML` anywhere. No API string is
  rendered as HTML. No URL parameter is read into the DOM.
- **Secrets.** `git log --diff-filter=A -- '.env*'` shows only `.env.example`
  has ever been committed. `JUPITER_API_KEY`, `PYTH_API_KEY` and
  `VESTAIL_ORDER_SECRET` are read only in `server-only` modules. No key is
  embedded in client code except the RPC URL above, which is
  `NEXT_PUBLIC_` by necessity.
- **No analytics, tag managers or third-party scripts.** The only third-party
  request on the signing page is the font in M2.
- **Package names.** Every `@solana/*` dependency is the real published name;
  there are no typosquats and nothing obscure or recently added.
- **Disclosure before connecting.** `/app` states "Vestail never holds your
  funds. You sign every transaction. Not investment advice." above the fold and
  before any wallet is connected, and the docs say it at length.

---

## Operational risks

No code closes these, and for a project like this they are likelier than
anything above.

**Domain hijacking is the realistic attack.** Nobody needs to break the
transaction verifier if they can serve their own JavaScript from the domain
users trust. Registrar account takeover, a stolen Vercel session, or a
malicious dependency published under a name we already depend on all end the
same way: a drainer served from the real URL, with a valid certificate.

- **Turn on 2FA everywhere, with hardware keys** — GitHub, Vercel and the
  domain registrar. Prefer a security key over TOTP, and TOTP over SMS. SIM
  swapping is how registrar accounts are taken.
- **Lock the domain.** Enable registrar lock and DNSSEC, and use an email
  address for the registrar account that is not published anywhere.
- **Protect the branch.** Require review on `main`, and require that deploys
  come from it. A single force-push with a malicious `useBuy.ts` would undo
  every fix in this report.
- **Pin your deploys.** Use `npm ci` so a compromised minor release of a wallet
  library cannot enter a build unnoticed, and review lockfile diffs the way you
  would review code.
- **Tell users to check the URL before connecting**, and never to reach the app
  through a link in a DM. Say it on the site. Phishing clones of a hackathon
  project are cheap to make and are the most common way people actually lose
  money.
- **Have a kill switch.** Know how to take the site down, and how to revoke the
  Jupiter key, without needing to reach a laptop.

---

## What this audit does NOT cover

Stated plainly, because an audit that implies more coverage than it has is
worse than none.

- **No formal verification, no fuzzing, no penetration test.** This is a manual
  read of the code by one reviewer in one pass, plus `npm audit`.
- **No review of anything outside this repository.** Jupiter's aggregator
  program, the token programs, the issuers' contracts and every AMM a route
  passes through are all unaudited here and all hold real risk. Vestail's
  verifier checks that the *top-level* instructions are the ones expected; it
  cannot see what Jupiter's program does inside a CPI, and does not try to.
- **No economic or MEV analysis.** Sandwiching, just-in-time liquidity and
  adversarial routing are real ways to lose value on a swap and are not
  modelled here. The slippage cap is a blunt limit on the damage, not a defence.
- **No legal or regulatory review.** Whether a given user may lawfully hold a
  given token is the product's subject, not this audit's; nothing here is legal
  advice.
- **No infrastructure review.** Vercel's configuration, DNS, the registrar, the
  RPC provider and the machines the maintainers use were not inspected. The
  operational section is advice, not findings.
- **No runtime testing against mainnet.** The verifier is tested against
  constructed transactions, not against a recorded corpus of real Jupiter
  responses, and no signed purchase was executed as part of this audit.
- **No review of the wallet adapters' own code**, beyond checking that the
  package names are genuine and reading the advisories against them.
- **Point in time.** This describes commit `4989ada`. Any later change to the
  swap path, the registry or the dependency tree is outside it.
