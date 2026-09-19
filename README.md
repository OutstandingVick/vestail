# Vestail

**Which version of this stock are you actually allowed to hold?**

Vestail resolves every tokenized representation of a security, evaluates which
ones a user in a given jurisdiction may actually hold, and routes a purchase
only to the eligible ones via Jupiter.

Built for the STOCKLANA Solana hackathon.

---

## The thesis

A stock ticker is not one thing onchain.

NVDA exists as several different tokens from several different providers, and
they are not the same instrument:

- **xStocks** backs its token 1:1 with shares held in custody. The holder has a
  claim on a share.
- **Ondo** often issues a total-return note that tracks the price rather than
  the share itself. The holder has a claim on Ondo, not on a share.
- **Backpack** issues a security entitlement through a licensed broker-dealer.
  The holder's claim runs against the intermediary under UCC Article 8.

In a wallet these look identical — same ticker, same price, same row in a token
list. They are different legal claims, with different rules about who is
permitted to hold them, different redemption mechanics, and different outcomes
if the issuer fails.

Most apps never check. Vestail is the check.

## Three verdicts, not two

The middle state is the product. A two-state model has to lie about the large
middle: tokens that anyone can buy on the secondary market but that gate
redemption, dividends or transfer behind KYC or an investor-class test.

| Verdict | Means | You can buy it | You can exit / collect |
| --- | --- | --- | --- |
| **`eligible`** | The issuer's policy permits holders in your declared jurisdiction, with no further gate. | Yes | Yes |
| **`conditional`** | Acquirable on the secondary market, but redemption, dividends or transfer are gated behind KYC or investor class. | Yes | **Not without clearing a gate** |
| **`restricted`** | The issuer's own policy excludes your declared jurisdiction. | Technically, onchain | No |

`conditional` is where users get hurt. You buy the token, it sits in your wallet
looking exactly like the one your friend holds, and you find out at redemption
that you cannot exit the way you assumed. That gate is invisible at purchase
time. Vestail makes it visible *before* the trade.

Collapsing `conditional` into either neighbour destroys the point: folded into
`eligible` it hides the gate; folded into `restricted` it asserts a prohibition
that does not exist.

## Disclosure, not enforcement

**Vestail does not block anyone, and could not if it wanted to.**

Jurisdiction is self-declared. There is no KYC here, no identity check, no
geofence, no onchain gate. A user can declare any region and buy any token — the
same as they could without us.

What Vestail does is show the gate *before* the trade instead of leaving the
user to find it at redemption. The position is deliberate:

- **We are not a compliance product.** We do not certify anyone's eligibility
  and we are not a regulated intermediary.
- **We are not custodial.** We never hold funds or securities. Every transaction
  is signed in the user's own wallet.
- **Every claim is sourced.** Every rule in `policies/` carries a `source_url`
  pointing at the issuer's own document, and every verdict carries that URL
  through to the screen. Users check our work against the primary source, not
  against our summary of it.
- **Nothing here is legal, investment or tax advice.**

The honest framing: an invisible gate made visible. Not a permission system.

## Architecture

Policy lives in **versioned JSON files in `policies/`, not in a database** —
one file per issuer, every rule sourced, every change a commit. Git history is
the audit trail. See [`policies/README.md`](policies/README.md).

```
app/        Next.js App Router pages and root layout
components/ SolanaProvider, WalletButton, SiteHeader, WalletCard
hooks/      useUsdcBalance
lib/        constants, Zod schemas and inferred types, formatters
policies/   versioned issuer eligibility policy (Phase 2)
```

### Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Solana Wallet Adapter
(Phantom + Solflare) · @solana/web3.js v1 · Zod. Deploys to Vercel.

No Redis, no separate backend, no Anchor program — nothing in Phase 1 needs one.

### Jupiter

Routing uses the **Jupiter Swap API V2** (`api.jup.ag/swap/v2`):
`GET /order` → sign → `POST /execute`.

This is **not** the Ultra API and **not** the legacy `/swap/v1` quote+swap pair.
Jupiter's own docs mark Ultra as no longer actively maintained and superseded by
Swap V2; most third-party tutorials are still on the old endpoints. Check
[developers.jup.ag](https://developers.jup.ag) before changing this.

Swap V2 requires an API key via the `x-api-key` header. That key is server-side
only — it is **not** a `NEXT_PUBLIC_` variable — so Phase 1 proxies orders
through a route handler rather than calling Jupiter from the browser.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_RPC_URL
npm run dev
```

The public mainnet RPC is the fallback, but it is rate-limited hard enough to
fail under demo load. Use a dedicated endpoint.

## Status

**Phase 0 — complete.** Scaffold, design tokens, domain schemas, wallet
connection, USDC balance, landing page.

Next: representation resolution across providers (Phase 1), the policy files
and the eligibility evaluator (Phase 2), Jupiter routing to eligible mints only
(Phase 3).
