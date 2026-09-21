/**
 * Vestail constants.
 *
 * Everything here is a value that the rest of the app treats as fixed for a
 * given deploy. Provider eligibility *rules* deliberately do not live here —
 * they live as versioned JSON in policies/ so that git history is the audit
 * trail. See the README.
 */

import { PublicKey } from "@solana/web3.js";

/**
 * Reads an env var, treating blank as absent.
 *
 * `process.env.X ?? fallback` is not enough here. A variable that is present
 * but empty — the `NEXT_PUBLIC_RPC_URL=` line that `cp .env.example .env.local`
 * leaves behind before anyone fills it in — is an empty string, which is
 * neither null nor undefined, so `??` hands it straight through. That empty
 * string then reaches the Connection constructor and throws
 * "Endpoint URL must start with `http:` or `https:`", which reads like a
 * config typo rather than a missing value.
 *
 * The inverse mistake is caught too: a value that is set but is not an
 * http(s) URL — usually a bare provider API key pasted without the endpoint
 * around it — throws naming the variable, instead of surfacing later as that
 * same unhelpful Connection error.
 */
function envOr(
  name: string,
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (!/^https?:\/\//.test(trimmed)) {
    throw new Error(
      `${name} must be a full http(s) URL, not a bare API key or hostname.`,
    );
  }
  return trimmed;
}

/* -------------------------------------------------------------------------- */
/* Settlement asset                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Circle's USDC on Solana mainnet. Every quote and every purchase is
 * denominated in this; it is the input mint on every Jupiter order.
 */
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

/** USDC is a 6-decimal mint, so 1 USDC is 1_000_000 base units. */
export const USDC_DECIMALS = 6;

/* -------------------------------------------------------------------------- */
/* Jupiter                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Jupiter Swap API V2.
 *
 * The flow is GET /order -> sign the returned transaction -> POST /execute.
 * This is *not* the Ultra API and not the legacy /swap/v1 quote+swap pair:
 * Jupiter's own docs mark Ultra as no longer actively maintained and
 * superseded by Swap V2, and most third-party tutorials are still on the old
 * endpoints. Check developers.jup.ag before changing this.
 *
 * Note for Phase 1: Swap V2 requires an `x-api-key` header. That key is a
 * server-side secret and must not be read through a NEXT_PUBLIC_ variable, so
 * orders will be proxied through a route handler rather than fetched from the
 * browser.
 */
export const JUPITER_API_BASE = envOr(
  "NEXT_PUBLIC_JUPITER_API",
  process.env.NEXT_PUBLIC_JUPITER_API,
  "https://api.jup.ag/swap/v2",
);

export const JUPITER_ORDER_ENDPOINT = `${JUPITER_API_BASE}/order`;
export const JUPITER_EXECUTE_ENDPOINT = `${JUPITER_API_BASE}/execute`;

/* -------------------------------------------------------------------------- */
/* RPC                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Mainnet RPC. The public endpoint is rate-limited hard enough that it will
 * fail under demo load, so a real endpoint belongs in NEXT_PUBLIC_RPC_URL.
 */
export const RPC_URL = envOr(
  "NEXT_PUBLIC_RPC_URL",
  process.env.NEXT_PUBLIC_RPC_URL,
  "https://api.mainnet-beta.solana.com",
);

/* -------------------------------------------------------------------------- */
/* Allowlists                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The symbols Vestail resolves. Scoped to names that actually have more than
 * one tokenized representation onchain, which is what makes the comparison
 * worth showing at all.
 *
 * SPCX leads because it has the widest spread of legal claims on one name:
 * xStocks, Backpack and Ondo all issue it as a listed stock, while Tessera and
 * PreStocks still carry tokens minted when SpaceX was private (it listed on
 * Nasdaq on 12 June 2026).
 *
 * OPENAI and KALSHI are private companies. Their tokens have no listed share
 * behind them at all, so there is no public reference price — only the
 * issuer's own mark.
 */
export const SYMBOL_ALLOWLIST = [
  "SPCX",
  "NVDA",
  "TSLA",
  "AAPL",
  "SPY",
  "QQQ",
  "MSFT",
  "GOOGL",
  "AMZN",
  "OPENAI",
  "KALSHI",
] as const;

export type AllowedSymbol = (typeof SYMBOL_ALLOWLIST)[number];

/** Symbols with no listed share, and therefore no public reference price. */
export const PRIVATE_SYMBOLS: ReadonlySet<AllowedSymbol> = new Set([
  "OPENAI",
  "KALSHI",
]);

/**
 * Jurisdictions Vestail has written policy for. Kept short on purpose: a
 * region belongs here only once every provider in policies/ has a sourced gate
 * for it, because a half-covered region would produce a confident verdict from
 * incomplete inputs. `npm test` enforces that coverage.
 *
 * RegionSchema in lib/types.ts repeats this list for the policy files; a test
 * asserts the two match. It is not imported from there because this file must
 * stay loadable by plain Node (scripts/sync-registry.mjs), which cannot
 * resolve the "@/" alias.
 */
export const REGION_ALLOWLIST = ["NG", "US", "DE"] as const;

export type AllowedRegion = (typeof REGION_ALLOWLIST)[number];

export const REGION_NAME: Record<AllowedRegion, string> = {
  NG: "Nigeria",
  US: "United States",
  DE: "Germany",
};
