/**
 * Vestail domain types.
 *
 * Zod schemas are the source of truth and the TypeScript types are inferred
 * from them, so anything crossing a boundary — a provider API, a policy JSON
 * file, a cached blob — gets validated rather than asserted.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The legal shape of the claim, which is the distinction the whole product
 * exists to surface. Two tokens can track the same ticker and still be:
 *
 *   custody_backed        The issuer holds the actual share in custody and the
 *                         token is a 1:1 claim on it. xStocks works this way.
 *
 *   total_return_note     A debt instrument whose return tracks the share
 *                         price. The holder never has a claim on a share; they
 *                         have a claim on the issuer. Ondo often issues these.
 *
 *   security_entitlement  A book-entry interest held through a licensed
 *                         broker-dealer under UCC Article 8. The holder's
 *                         claim runs against the intermediary. Backpack's
 *                         structure.
 *
 *   spv_exposure          Economic exposure to a special-purpose vehicle
 *                         that holds (or claims to hold) private-company
 *                         shares. No shareholder rights, and the underlying
 *                         company may not recognise the SPV at all. PreStocks.
 *
 *   loan_participation    A participation in a loan to an issuer entity that
 *                         holds the investment; repaid from the proceeds of a
 *                         liquidity event such as an IPO. Tessera T-Tokens.
 *
 * These look identical in a wallet. They are not identical in a bankruptcy.
 */
export const StructureSchema = z.enum([
  "custody_backed",
  "total_return_note",
  "security_entitlement",
  "spv_exposure",
  "loan_participation",
]);

export type Structure = z.infer<typeof StructureSchema>;

/** Issuers whose representations Vestail resolves. */
export const ProviderSchema = z.enum([
  "xstocks",
  "ondo",
  "backpack",
  "prestocks",
  "tessera",
]);

export type Provider = z.infer<typeof ProviderSchema>;

/* -------------------------------------------------------------------------- */
/* Representation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One tokenized representation of one security — a single (provider, symbol)
 * pair resolved to a concrete mint.
 *
 * A ticker maps to many of these. That fan-out is the thing Vestail resolves.
 */
export const RepresentationSchema = z.object({
  /** Base58 SPL mint address. The identity of this representation. */
  mint: z.string().min(32).max(44),

  provider: ProviderSchema,

  /** Ticker of the underlying, e.g. "NVDA". Not necessarily the token symbol. */
  symbol: z.string().min(1).max(12),

  /** Human-readable name as the issuer presents it. */
  name: z.string().min(1),

  structure: StructureSchema,

  /** Decimals of the SPL mint, needed to size an order correctly. */
  decimals: z.number().int().min(0).max(18),

  /**
   * Whether the issuer offers redemption for the underlying at all. Distinct
   * from whether a *given* holder may redeem — that is a Verdict question, and
   * it is exactly where `conditional` lives: redeemable: true at the issuer
   * level plus a KYC gate at the holder level.
   */
  redeemable: z.boolean(),

  /**
   * The named entity holding the underlying. Null when the issuer does not
   * publicly name one — which is itself worth showing, not an empty cell.
   */
  custodian: z.string().min(1).nullable(),

  /** Where this record came from, so any claim on screen can be traced. */
  source: z.string().url(),

  /** When the record was fetched. Staleness is user-visible information. */
  fetchedAt: z.string().datetime(),
});

export type Representation = z.infer<typeof RepresentationSchema>;

/* -------------------------------------------------------------------------- */
/* Verdict                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Three states, not two. The middle one is the product.
 *
 *   eligible     A holder who self-declared this jurisdiction may acquire the
 *                token and exercise the rights attached to it — redemption,
 *                dividends, transfer — without a further gate.
 *
 *   conditional  Acquirable on the secondary market, but at least one attached
 *                right is gated behind KYC, an investor-class test, or a
 *                transfer restriction. The holder can buy it today and
 *                discover at redemption that they cannot exit the way they
 *                assumed. This is the invisible gate Vestail makes visible.
 *
 *   restricted   The issuer's own policy excludes this jurisdiction.
 *
 * Collapsing `conditional` into either neighbour destroys the point: folded
 * into `eligible` it hides the gate, folded into `restricted` it claims a
 * prohibition that does not exist.
 *
 * A verdict is a disclosure, never an enforcement action. Jurisdiction is
 * self-declared and Vestail neither can nor does block anyone.
 */
export const VerdictStatusSchema = z.enum([
  "eligible",
  "conditional",
  "restricted",
]);

export type VerdictStatus = z.infer<typeof VerdictStatusSchema>;

/**
 * The outcome of evaluating one Representation against one self-declared
 * jurisdiction.
 */
export const VerdictSchema = z.object({
  /** Mint of the Representation this verdict is about. */
  mint: z.string().min(32).max(44),

  provider: ProviderSchema,

  status: VerdictStatusSchema,

  /**
   * Why, in the user's language. At least one reason is required — a verdict
   * with no stated reason is an unexplained assertion, and an unexplained
   * assertion is not a disclosure. A `conditional` verdict should name the
   * specific gate, not just report that one exists.
   */
  reasons: z.array(z.string().min(1)).min(1),

  /** Version of the policy file that produced this, for reproducibility. */
  policyVersion: z.string().min(1),

  /**
   * The issuer document the rule was read from. Every rule in policies/
   * carries one, so every verdict on screen can be traced to a primary source
   * rather than to our summary of it.
   */
  sourceUrl: z.string().url(),

  /** When the evaluation ran. */
  evaluatedAt: z.string().datetime(),
});

export type Verdict = z.infer<typeof VerdictSchema>;
