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
 * These look identical in a wallet. They are not identical in a bankruptcy.
 */
export const StructureSchema = z.enum([
  "custody_backed",
  "total_return_note",
  "security_entitlement",
]);

export type Structure = z.infer<typeof StructureSchema>;

/** Issuers Vestail has written a policy file for. */
export const ProviderSchema = z.enum(["xstocks", "ondo", "backpack"]);

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

  /** Entity holding the underlying, where one exists. Null for a note. */
  custodian: z.string().min(1).nullable(),

  /** Where this record came from, so any claim on screen can be traced. */
  source: z.string().url(),

  /** When the record was fetched. Staleness is user-visible information. */
  fetchedAt: z.string().datetime(),
});

export type Representation = z.infer<typeof RepresentationSchema>;
