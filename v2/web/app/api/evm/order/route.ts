import { NextResponse } from "next/server";
import { z } from "zod";

import { EVM_CHAINS, isEvmChain } from "@/lib/chains";
import { api, ApiError } from "@/lib/server/api";
import { build, route } from "@/lib/server/kyber";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";
import { walletsOf } from "@/lib/server/wallets";
import { inspectEvmBuy, KYBER_ROUTER } from "@/lib/swap/inspectEvm";

/**
 * POST /api/evm/order { symbol, address, amountWei, taker?, acknowledged? }
 *
 * Builds an ETH -> token buy on Base or Robinhood Chain through KyberSwap, for
 * a version the buyer's declared country and type allow. Same rules as the
 * Solana route: can_own always, conditional only acknowledged, cannot_own and
 * not assessed never. The taker must be one of the user's own EVM wallets
 * (read from Privy, not trusted from the browser). The transaction is
 * inspected before it is returned, and the Buy is recorded through
 * POST /orders/click, which checks the verdict again.
 */
const REQUESTED_SLIPPAGE_BPS = 100;
const MAX_PRICE_IMPACT_PCT = 10;
const MIN_WEI = BigInt(1e14); // 0.0001 ETH
const MAX_WEI = BigInt(5e19); // 50 ETH

const Body = z.object({
  symbol: z.string().min(1).max(12),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  amountWei: z.string().regex(/^\d{1,24}$/),
  taker: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  acknowledged: z.boolean().optional(),
});

const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return fail(401, "Sign in first.");
  const profile = await readProfile();
  if (!profile) return fail(400, "Choose your country first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid order request.");
  const { symbol, address, amountWei, taker, acknowledged } = parsed.data;
  const wei = BigInt(amountWei);
  if (wei < MIN_WEI || wei > MAX_WEI) return fail(400, "Amount must be between 0.0001 and 50 ETH.");

  let board;
  try {
    board = await api.tokens(symbol, profile.country, profile.who);
  } catch (e) {
    if (e instanceof ApiError) return fail(404, e.message);
    throw e;
  }
  const token = board.tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
  if (!token || !isEvmChain(token.chain)) return fail(404, "Vestail doesn't know this token on Base or Robinhood Chain.");
  if (!token.assessed) return fail(403, "This version hasn't been assessed for your country, so Vestail doesn't route it.");
  if (token.status === "cannot_own") return fail(403, "This version can't be owned in your declared country, so Vestail doesn't route it.");
  if (token.status === "conditional" && taker && acknowledged !== true) return fail(403, "Acknowledge the condition before buying.");
  if (taker && !(await walletsOf(userId)).evm.some(w => w.toLowerCase() === taker.toLowerCase()))
    return fail(403, "That wallet isn't linked to your account.");

  const chain = EVM_CHAINS[token.chain];
  const r = await route(chain.kyber, token.address, amountWei);
  if (!r.ok) return fail(422, `No route for this buy right now (${r.message}).`);
  const { amountInUsd, amountOutUsd, amountOut, tokenOut, amountIn } = r.data.routeSummary;
  if (tokenOut.toLowerCase() !== token.address.toLowerCase() || amountIn !== amountWei)
    return fail(502, "KyberSwap returned a route that doesn't match the request.");
  // Price impact from the route's own USD valuations: a thin pool shows up as value lost.
  const impact = Number(amountInUsd) > 0 ? ((Number(amountInUsd) - Number(amountOutUsd)) / Number(amountInUsd)) * 100 : 100;
  if (impact > MAX_PRICE_IMPACT_PCT)
    return fail(422, `This route loses more than ${MAX_PRICE_IMPACT_PCT}% of its value, which usually means too little liquidity. Try a smaller amount.`);

  const priced = { chain: token.chain, chainId: chain.id, amountIn: amountWei, amountOut, outputDecimals: token.decimals, priceImpactPct: Math.max(0, impact), valueUsd: Number(amountInUsd) };
  if (!taker) return NextResponse.json({ quoteOnly: true, ...priced }, { headers: { "Cache-Control": "no-store" } });

  const b = await build(chain.kyber, r.data, taker, REQUESTED_SLIPPAGE_BPS);
  if (!b.ok) return fail(422, `KyberSwap couldn't build this buy (${b.message}).`);
  const tx = { to: b.data.routerAddress, data: b.data.data, value: b.data.transactionValue };
  const inspection = inspectEvmBuy(tx, { taker, amountWei });
  if (!inspection.ok) return fail(502, inspection.reason);

  try {
    await api.click({
      country: profile.country, asset: board.asset, who: profile.who, venue: "KyberSwap", mint: token.address, session: userId,
      acknowledged: token.status === "conditional" ? true : undefined,
    });
  } catch (e) {
    if (e instanceof ApiError) return fail(403, e.message);
    throw e;
  }
  return NextResponse.json({ quoteOnly: false, ...priced, tx: { ...tx, to: KYBER_ROUTER, chainId: chain.id } }, { headers: { "Cache-Control": "no-store" } });
}
