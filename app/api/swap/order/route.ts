import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { base64ToBytes } from "@/lib/base64";
import { PAY_TOKENS, WSOL_MINT } from "@/lib/constants";
import { evaluate } from "@/lib/evaluate";
import { POLICIES } from "@/lib/policies";
import { findRepresentation } from "@/lib/registry";
import { getOrder, isNoRoute } from "@/lib/server/jupiterSwap";
import { orderSigningReady, signOrder } from "@/lib/server/orderToken";
import { inspectSwapTransaction, maxLamportsFor } from "@/lib/swap/inspect";
import { RegionSchema, type SwapQuote } from "@/lib/types";

/**
 * GET /api/swap/order?inputMint&outputMint&amount&taker&region&acknowledged
 *
 * Builds a USDC or SOL -> token order via Jupiter, for a token the caller's
 * self-declared region allows:
 *
 *   eligible     always
 *   conditional  only with acknowledged=true, meaning the buyer ticked the
 *                verdict's acknowledgement ("I understand I can buy and hold
 *                this, but ... requires ..."). A price estimate needs none.
 *   restricted   never, and neither is a token with no sourced verdict
 *
 * The UI enforces the same rules; doing it here makes them a property of the
 * server rather than of which buttons happen to render.
 *
 * `inputMint` is USDC (the default) or wrapped SOL, which Jupiter spends as
 * native SOL. `amount` is in the input token's base units.
 *
 * Without `taker` it returns a price estimate only (quoteOnly: true, no
 * transaction and no order token), so the UI can show "you get" before a
 * wallet is connected.
 */

/**
 * Slippage, in basis points.
 *
 * REQUESTED is what every order asks for. MAX is the line past which an
 * order is refused rather than offered for signature: Jupiter can come back
 * with more than was asked — a different route, a thinner pool — and the
 * difference between a trade and a donation is how much more.
 */
const REQUESTED_SLIPPAGE_BPS = 100;
const MAX_SLIPPAGE_BPS = 300;

/** Per pay token: the smallest and largest order, in base units. */
const LIMITS = {
  [PAY_TOKENS.USDC.mint]: {
    token: PAY_TOKENS.USDC,
    min: BigInt(1_000_000), // 1 USDC
    max: BigInt(100_000_000_000), // 100,000 USDC
    range: "between 1 and 100,000 USDC",
  },
  [PAY_TOKENS.SOL.mint]: {
    token: PAY_TOKENS.SOL,
    min: BigInt(10_000_000), // 0.01 SOL
    max: BigInt(1_000_000_000_000), // 1,000 SOL
    range: "between 0.01 and 1,000 SOL",
  },
};

const QuerySchema = z.object({
  inputMint: z
    .string()
    .default(PAY_TOKENS.USDC.mint)
    .refine((m) => m in LIMITS, "pay with USDC or SOL"),
  outputMint: z.string().min(32).max(44),
  amount: z.string().regex(/^\d{1,15}$/),
  taker: z
    .string()
    .refine((s) => {
      try {
        return PublicKey.isOnCurve(new PublicKey(s).toBytes());
      } catch {
        return false;
      }
    }, "not a wallet address")
    .optional(),
  region: RegionSchema,
  acknowledged: z.enum(["true", "false"]).optional(),
});

function orderError(code: number | undefined, paySymbol: string): string | undefined {
  switch (code) {
    case 1:
      return `Not enough ${paySymbol} in the wallet for this amount.`;
    case 2:
      return "Not enough SOL in the wallet to pay network fees.";
    case 3:
      return "This amount is below Jupiter's minimum for a gasless swap. Add a little SOL or increase the amount.";
    default:
      return undefined;
  }
}

function fail(status: number, error: string, extra: object = {}) {
  return NextResponse.json(
    { error, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return fail(400, "Invalid order request.");
  }
  const { inputMint, outputMint, amount, taker, region, acknowledged } = parsed.data;

  const limits = LIMITS[inputMint];
  const units = BigInt(amount);
  if (units < limits.min || units > limits.max) {
    return fail(400, `Amount must be ${limits.range}.`);
  }

  // Only a buildable order is signed; a price estimate needs no secret.
  if (taker && !orderSigningReady()) {
    return fail(503, "Swaps are not configured on this server: VESTAIL_ORDER_SECRET is missing.");
  }

  const representation = findRepresentation(outputMint);
  if (!representation) {
    return fail(404, "Vestail does not know this token.");
  }

  const verdict = evaluate(representation, region, POLICIES[representation.provider]);
  const status = verdict?.status ?? "not_assessed";
  if (status === "restricted" || status === "not_assessed") {
    return fail(
      403,
      "Vestail doesn't route purchases to versions that are restricted in your declared jurisdiction.",
      { verdictStatus: status },
    );
  }
  // Conditional: a price is fine; a transaction needs the acknowledgement.
  if (status === "conditional" && taker && acknowledged !== "true") {
    return fail(403, "Confirm the conditions for this version before buying it.", {
      verdictStatus: status,
    });
  }

  const result = await getOrder({
    inputMint,
    outputMint,
    amount,
    taker,
    slippageBps: REQUESTED_SLIPPAGE_BPS,
  });
  if (isNoRoute(result)) {
    return fail(422, "No route found for this swap right now.", { code: "no_route" });
  }
  if (!result.ok) {
    return fail(
      result.status === 429 ? 429 : 502,
      result.status === 429 ? result.message : "Jupiter couldn't price this swap right now.",
    );
  }
  const order = result.data;

  // Refuse an order that is not the one we asked for, before anyone signs it.
  if (
    order.inputMint !== inputMint ||
    order.outputMint !== outputMint ||
    order.inAmount !== amount ||
    (order.taker ?? undefined) !== taker
  ) {
    return fail(502, "Jupiter returned an order that does not match the request.");
  }

  if ((order.slippageBps ?? REQUESTED_SLIPPAGE_BPS) > MAX_SLIPPAGE_BPS) {
    return fail(
      422,
      `This route only prices with more than ${MAX_SLIPPAGE_BPS / 100}% slippage, which is too much to route through. Try a smaller amount.`,
    );
  }

  const paidByTaker = (lamports: number | undefined, payer: string | null | undefined) =>
    taker && payer === taker ? (lamports ?? 0) : 0;

  const priced = {
    outputMint,
    inAmount: order.inAmount,
    outAmount: order.outAmount,
    outputDecimals: representation.decimals,
    feeBps: order.feeBps ?? null,
    priceImpactPct: order.priceImpact ?? null,
    slippageBps: order.slippageBps ?? null,
    router: order.router ?? null,
    takerLamports:
      paidByTaker(order.signatureFeeLamports, order.signatureFeePayer) +
      paidByTaker(order.prioritizationFeeLamports, order.prioritizationFeePayer) +
      paidByTaker(order.rentFeeLamports, order.rentFeePayer),
    gasless: order.gasless ?? false,
  };

  if (!taker) {
    const estimate: SwapQuote = {
      quoteOnly: true,
      requestId: null,
      orderToken: null,
      transaction: null,
      ...priced,
    };
    return NextResponse.json(estimate, { headers: { "Cache-Control": "no-store" } });
  }

  if (!order.transaction) {
    return fail(
      422,
      orderError(order.errorCode, limits.token.symbol) ||
        order.errorMessage ||
        "Jupiter could not build this swap.",
    );
  }

  /*
   * Jupiter's transaction is untrusted input, so it is read before it is
   * passed on. The browser checks it again before the wallet opens — this
   * check stops a bad transaction being served at all, that one stops a
   * compromised server from getting one signed.
   */
  const inspection = inspectSwapTransaction(
    VersionedTransaction.deserialize(base64ToBytes(order.transaction)),
    {
      taker,
      maxLamportsFromTaker: maxLamportsFor(inputMint, units, WSOL_MINT.toBase58()),
    },
  );
  if (!inspection.ok) {
    return fail(502, inspection.reason);
  }

  const quote: SwapQuote = {
    quoteOnly: false,
    requestId: order.requestId,
    orderToken: signOrder(order.requestId),
    transaction: order.transaction,
    ...priced,
  };

  return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
}
