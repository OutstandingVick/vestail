import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { base64ToBytes } from "@/lib/base64";
import { USDC_MINT, WSOL_MINT } from "@/lib/constants";
import { api, ApiError } from "@/lib/server/api";
import { getOrder, isNoRoute } from "@/lib/server/jupiterSwap";
import { orderSigningReady, signOrder } from "@/lib/server/orderToken";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";
import { inspectSwapTransaction, maxLamportsFor } from "@/lib/swap/inspect";

/**
 * POST /api/swap/order { symbol, mint, amount, taker?, acknowledged? }
 *
 * Builds a USDC -> token order through Jupiter, for a token the buyer's
 * declared country and buyer type allow. The verdict is the token's own
 * (issuer capped by class), read fresh from the API:
 *
 *   can_own       always
 *   conditional   only with acknowledged: true (a price estimate needs none)
 *   cannot_own    never
 *   not assessed  never: missing research is not permission
 *
 * Without taker it returns a price only. With taker it records the Buy press
 * through POST /orders/click (which checks the verdict again) and returns a
 * transaction, inspected before it is sent, plus an order token that
 * /api/swap/execute requires. The slippage, price-impact and inspection rules
 * are v1's, unchanged; see the comments there for why each number is what it is.
 */
const REQUESTED_SLIPPAGE_BPS = 100;
const MAX_SLIPPAGE_BPS = 300;
const MAX_PRICE_IMPACT_PCT = 10;
const MIN = BigInt(1_000_000); // 1 USDC
const MAX = BigInt(100_000_000_000); // 100,000 USDC

const Body = z.object({
  symbol: z.string().min(1).max(12),
  mint: z.string().min(32).max(44),
  amount: z.string().regex(/^\d{1,15}$/),
  taker: z.string().refine(s => { try { return PublicKey.isOnCurve(new PublicKey(s).toBytes()); } catch { return false; } }, "not a wallet address").optional(),
  acknowledged: z.boolean().optional(),
});

const fail = (status: number, error: string, extra: object = {}) =>
  NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return fail(401, "Sign in first.");
  const profile = await readProfile();
  if (!profile) return fail(400, "Choose your country first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid order request.");
  const { symbol, mint, amount, taker, acknowledged } = parsed.data;

  const units = BigInt(amount);
  if (units < MIN || units > MAX) return fail(400, "Amount must be between 1 and 100,000 USDC.");
  if (taker && !orderSigningReady()) return fail(503, "Swaps are not configured on this server: VESTAIL_ORDER_SECRET is missing.");

  let board;
  try {
    board = await api.tokens(symbol, profile.country, profile.who);
  } catch (e) {
    if (e instanceof ApiError) return fail(404, e.message);
    throw e;
  }
  const token = board.tokens.find(t => t.mint === mint);
  if (!token) return fail(404, "Vestail does not know this token.");
  if (!token.assessed) return fail(403, "This version hasn't been assessed for your country, so Vestail doesn't route it.");
  if (token.status === "cannot_own") return fail(403, "This version can't be owned in your declared country, so Vestail doesn't route it.");
  if (token.status === "conditional" && taker && acknowledged !== true) return fail(403, "Acknowledge the condition before buying.");

  const ask = (excludeRouters?: string) =>
    getOrder({ inputMint: USDC_MINT, outputMint: mint, amount, taker, slippageBps: REQUESTED_SLIPPAGE_BPS, excludeRouters });
  let result = await ask();
  if (isNoRoute(result)) result = await ask("jupiterz");
  if (isNoRoute(result)) return fail(422, "No route found for this swap right now.");
  if (!result.ok) return fail(result.status === 429 ? 429 : 502, result.status === 429 ? result.message : "Jupiter couldn't price this swap right now.");
  const order = result.data;

  if (order.inputMint !== USDC_MINT || order.outputMint !== mint || order.inAmount !== amount || (order.taker ?? undefined) !== taker)
    return fail(502, "Jupiter returned an order that does not match the request.");
  if (Math.abs(order.priceImpact ?? 0) > MAX_PRICE_IMPACT_PCT)
    return fail(422, `This route prices more than ${MAX_PRICE_IMPACT_PCT}% away from the market. Try a smaller amount.`);
  if ((order.slippageBps ?? REQUESTED_SLIPPAGE_BPS) > MAX_SLIPPAGE_BPS)
    return fail(422, `This route needs more than ${MAX_SLIPPAGE_BPS / 100}% slippage. Try a smaller amount.`);

  const priced = { inAmount: order.inAmount, outAmount: order.outAmount, outputDecimals: token.decimals, priceImpactPct: order.priceImpact ?? null, gasless: order.gasless ?? false };
  if (!taker) return NextResponse.json({ quoteOnly: true, ...priced }, { headers: { "Cache-Control": "no-store" } });
  if (!order.transaction) return fail(422, order.errorMessage || "Jupiter could not build this swap. Check the wallet holds enough USDC.");

  // Jupiter's transaction is untrusted input: read it before passing it on.
  const inspection = inspectSwapTransaction(VersionedTransaction.deserialize(base64ToBytes(order.transaction)), {
    taker, maxLamportsFromTaker: maxLamportsFor(USDC_MINT, units, WSOL_MINT),
  });
  if (!inspection.ok) return fail(502, inspection.reason);

  // The Buy press, recorded and re-checked by the API before anything is signed.
  try {
    await api.click({
      country: profile.country, asset: board.asset, who: profile.who, venue: "Jupiter", mint, session: userId,
      acknowledged: token.status === "conditional" ? true : undefined,
    });
  } catch (e) {
    if (e instanceof ApiError) return fail(403, e.message);
    throw e;
  }

  return NextResponse.json(
    { quoteOnly: false, requestId: order.requestId, orderToken: signOrder(order.requestId), transaction: order.transaction, ...priced },
    { headers: { "Cache-Control": "no-store" } },
  );
}
