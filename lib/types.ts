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
/* Region                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Jurisdictions Vestail has written policy for, as ISO 3166-1 alpha-2 codes.
 * Self-declared by the user; never inferred, never verified.
 */
export const RegionSchema = z.enum(["NG", "US", "DE"]);

export type Region = z.infer<typeof RegionSchema>;

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
 * How directly a source supports a rule.
 *
 *   primary    The issuer's own document states it.
 *   secondary  Third-party reporting, or an inference from an issuer
 *              document that does not state it outright. Shown to the user.
 */
export const SourceQualitySchema = z.enum(["primary", "secondary"]);

export type SourceQuality = z.infer<typeof SourceQualitySchema>;

/** One policy rule's contribution to a verdict, with its own citation. */
export const EvidenceSchema = z.object({
  ruleId: z.string().min(1),
  /** A gate sets the status; a note adds context and never changes it. */
  kind: z.enum(["gate", "note"]),
  reason: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceQuality: SourceQualitySchema,
});

export type Evidence = z.infer<typeof EvidenceSchema>;

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
   * Source of the deciding gate. Every rule in policies/ carries one, so every
   * verdict on screen traces to a document rather than to our summary of it.
   */
  sourceUrl: z.string().url(),

  /**
   * Weakest quality among the gates that decided the status. A verdict is no
   * more certain than its least certain deciding source.
   */
  sourceQuality: SourceQualitySchema,

  /** Every matching rule with its own source, gates first. */
  evidence: z.array(EvidenceSchema).min(1),

  /** When the evaluation ran. */
  evaluatedAt: z.string().datetime(),
});

export type Verdict = z.infer<typeof VerdictSchema>;

/* -------------------------------------------------------------------------- */
/* Policy files                                                                */
/* -------------------------------------------------------------------------- */

const PolicyRuleBase = {
  /** Stable within a file, so evidence can be traced back to its rule. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  regions: z.array(RegionSchema).min(1),
  /** Limit the rule to specific symbols. Omitted means every symbol. */
  symbols: z.array(z.string().min(1)).min(1).optional(),
  reason: z.string().min(1),
  source_url: z.string().url().startsWith("https://"),
  source_quality: SourceQualitySchema,
};

/**
 * What a buyer must accept before Vestail routes to a `conditional` token,
 * written to complete the sentence:
 *
 *   "I understand I can buy and hold this, but {limit} requires {requires}."
 */
export const AcknowledgementSchema = z
  .object({
    /** The right that is gated, e.g. "redeeming it for the real share". */
    limit: z.string().min(1).max(120),
    /** What unlocks it, e.g. "a verified (KYC) Backpack account". */
    requires: z.string().min(1).max(160),
  })
  .strict();

export type Acknowledgement = z.infer<typeof AcknowledgementSchema>;

const PolicyGate = z
  .object({
    ...PolicyRuleBase,
    kind: z.literal("gate"),
    status: VerdictStatusSchema,
    /** One plain-English line for the version card. `reason` is the full text. */
    short: z.string().min(1).max(90),
    /** Required on conditional gates, forbidden on the others. */
    acknowledgement: AcknowledgementSchema.optional(),
  })
  .strict()
  .refine((g) => (g.status === "conditional") === (g.acknowledgement !== undefined), {
    message:
      "a conditional gate needs an acknowledgement, and only conditional gates may have one",
  });

/**
 * A rule in a policies/*.json file. Gates carry a status; notes do not, so a
 * warning can never silently change a verdict.
 *
 * `.strict()` matters here. By default Zod drops unknown keys, so a note
 * written with a `status`, or a rule with a misspelt `sorce_url`, would parse
 * cleanly and lose the field without a word. For hand-written policy, an
 * unknown key is always a mistake.
 */
export const PolicyRuleSchema = z.union([
  PolicyGate,
  z.object({ ...PolicyRuleBase, kind: z.literal("note") }).strict(),
]);

export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const PolicyFileSchema = z
  .object({
    provider: ProviderSchema,
    /** Copied onto every verdict as policyVersion. Bump on any rule change. */
    version: z.string().regex(/^\d{4}-\d{2}-\d{2}\.\d+$/),
    reviewedAt: z.string().date(),
    rules: z.array(PolicyRuleSchema).min(1),
  })
  .strict()
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const rule of file.rules) {
      if (seen.has(rule.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate rule id "${rule.id}"`,
        });
      }
      seen.add(rule.id);
    }
  });

export type PolicyFile = z.infer<typeof PolicyFileSchema>;

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A Representation as stored in registry/representations.json: the domain
 * fields plus the onchain facts the sync script verified.
 */
export const RegistryRepresentationSchema = RepresentationSchema.extend({
  /** The token's own symbol, e.g. "SPCXx", as opposed to the listed ticker. */
  tokenSymbol: z.string().min(1),
  /** SPL Token or Token-2022. Needed to derive token accounts correctly. */
  tokenProgram: z.string().min(32).max(44),
  mintAuthority: z.string().min(32).max(44).nullable(),
  /** Set means the issuer can freeze any holder's balance. */
  freezeAuthority: z.string().min(32).max(44).nullable(),
  /** Pyth feed for this token itself, where Pyth publishes one. */
  pythFeedId: z.string().regex(/^0x[0-9a-f]{64}$/).nullable(),
});

export type RegistryRepresentation = z.infer<
  typeof RegistryRepresentationSchema
>;

export const RegistrySchema = z.object({
  generatedAt: z.string().datetime(),
  symbols: z.record(
    z.string(),
    z.object({
      /** Pyth feed for the listed share. Null for private companies. */
      referenceFeedId: z.string().regex(/^0x[0-9a-f]{64}$/).nullable(),
      representations: z.array(RegistryRepresentationSchema),
    }),
  ),
});

/* -------------------------------------------------------------------------- */
/* Market view                                                                 */
/* -------------------------------------------------------------------------- */

/** Where a displayed price came from. Shown to the user, never hidden. */
export const PriceSourceSchema = z.enum(["pyth", "jupiter"]);

export type PriceSource = z.infer<typeof PriceSourceSchema>;

/** One representation with live market data attached. */
export const RepresentationQuoteSchema = z.object({
  representation: RegistryRepresentationSchema,
  price: z.number().nullable(),
  priceSource: PriceSourceSchema.nullable(),
  /**
   * Premium (+) or discount (−) to the listed share, in percent. Null unless
   * one token tracks one share; comparing a note priced in its own units to
   * the share price would produce a precise-looking, meaningless number.
   */
  vsReferencePct: z.number().nullable(),
  /** The issuer's own stated mark price, where it publishes one. */
  issuerMark: z.number().nullable(),
  vsIssuerMarkPct: z.number().nullable(),
  liquidityUsd: z.number().nullable(),
});

export type RepresentationQuote = z.infer<typeof RepresentationQuoteSchema>;

export const SymbolViewSchema = z.object({
  symbol: z.string(),
  isPrivate: z.boolean(),
  reference: z
    .object({
      price: z.number(),
      publishTime: z.number().int(),
      source: z.literal("pyth"),
    })
    .nullable(),
  representations: z.array(RepresentationQuoteSchema),
  /** Degraded data the user should know about, e.g. a missing API key. */
  warnings: z.array(z.string()),
  asOf: z.string().datetime(),
});

export type SymbolView = z.infer<typeof SymbolViewSchema>;

/* -------------------------------------------------------------------------- */
/* Swaps                                                                       */
/* -------------------------------------------------------------------------- */

const baseUnits = z.string().regex(/^\d+$/);

/** What /api/swap/order returns for an eligible, buildable order. */
export const SwapQuoteSchema = z.object({
  requestId: z.string().min(1),
  /** Binds the later /api/swap/execute call to this approved order. */
  orderToken: z.string().min(1),
  /** Base64 v0 transaction, unsigned. Signed only in the user's wallet. */
  transaction: z.string().min(1),
  outputMint: z.string().min(32).max(44),
  inAmount: baseUnits,
  outAmount: baseUnits,
  outputDecimals: z.number().int().min(0),
  /** Total fee in basis points, as Jupiter reports it. */
  feeBps: z.number().nullable(),
  /** Price impact in percent. */
  priceImpactPct: z.number().nullable(),
  slippageBps: z.number().nullable(),
  router: z.string().nullable(),
  /** SOL the taker pays: signature + priority fees + new-account rent. */
  takerLamports: z.number().int().min(0),
  gasless: z.boolean(),
});

export type SwapQuote = z.infer<typeof SwapQuoteSchema>;

/** What /api/swap/execute returns once Jupiter has tried to land the swap. */
export const SwapResultSchema = z.object({
  status: z.enum(["Success", "Failed"]),
  signature: z.string().nullable(),
  code: z.number().int(),
  totalInputAmount: baseUnits.nullable(),
  totalOutputAmount: baseUnits.nullable(),
  message: z.string().nullable(),
});

export type SwapResult = z.infer<typeof SwapResultSchema>;

/** Error body shared by both swap routes. */
export const SwapErrorSchema = z.object({
  error: z.string(),
  /** Set when the order was refused on eligibility grounds. */
  verdictStatus: z
    .enum(["eligible", "conditional", "restricted", "not_assessed"])
    .optional(),
});
