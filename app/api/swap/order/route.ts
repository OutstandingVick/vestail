import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PAY_TOKENS } from "@/lib/constants";
import { evaluate } from "@/lib/evaluate";
import { POLICIES } from "@/lib/policies";
import { findRepresentation } from "@/lib/registry";
import { getOrder } from "@/lib/server/jupiterSwap";
import { orderSigningReady, signOrder } from "@/lib/server/orderToken";
import { RegionSchema, type SwapQuote } from "@/lib/types";

/**
 * GET /api/swap/order?inputMint&outputMint&amount&taker&region
 *
 * Builds a USDC or SOL -> token order via Jupiter, but only for a token whose
 * verdict is `eligible` in the caller's self-declared region. The UI never
 * offers a buy for anything else; this route makes that a property of the
 * server rather than of which buttons happen to render.
 *
 * `inputMint` is USDC (the default) or wrapped SOL, which Jupiter spends as
 * native SOL. `amount` is in the input token's base units.
 */

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
  taker: z.string().refine((s) => {
    try {
      return PublicKey.isOnCurve(new PublicKey(s).toBytes());
    } catch {
      return false;
    }
  }, "not a wallet address"),
  region: RegionSchema,
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
  if (!orderSigningReady()) {
    return fail(503, "Swaps are not configured on this server: VESTAIL_ORDER_SECRET is missing.");
  }

  const parsed = QuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return fail(400, "Invalid order request.");
  }
  const { inputMint, outputMint, amount, taker, region } = parsed.data;

  const limits = LIMITS[inputMint];
  const units = BigInt(amount);
  if (units < limits.min || units > limits.max) {
    return fail(400, `Amount must be ${limits.range}.`);
  }

  const representation = findRepresentation(outputMint);
  if (!representation) {
    return fail(404, "Vestail does not know this token.");
  }

  // The rule the product exists for: route only to eligible representations.
  const verdict = evaluate(representation, region, POLICIES[representation.provider]);
  if (verdict?.status !== "eligible") {
    return fail(
      403,
      "Vestail only routes purchases to tokens that are eligible in your declared jurisdiction.",
      { verdictStatus: verdict?.status ?? "not_assessed" },
    );
  }

  const result = await getOrder({
    inputMint,
    outputMint,
    amount,
    taker,
  });
  if (!result.ok) {
    return fail(result.status === 429 ? 429 : 502, result.message);
  }
  const order = result.data;

  // Refuse an order that is not the one we asked for, before anyone signs it.
  if (
    order.inputMint !== inputMint ||
    order.outputMint !== outputMint ||
    order.inAmount !== amount ||
    order.taker !== taker
  ) {
    return fail(502, "Jupiter returned an order that does not match the request.");
  }

  if (!order.transaction) {
    return fail(
      422,
      orderError(order.errorCode, limits.token.symbol) ||
        order.errorMessage ||
        "Jupiter could not build this swap.",
    );
  }

  const paidByTaker = (lamports: number | undefined, payer: string | null | undefined) =>
    payer === taker ? (lamports ?? 0) : 0;

  const quote: SwapQuote = {
    requestId: order.requestId,
    orderToken: signOrder(order.requestId),
    transaction: order.transaction,
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

  return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
}
