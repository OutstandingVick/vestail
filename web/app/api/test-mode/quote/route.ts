import { NextResponse } from "next/server";
import { z } from "zod";

import { isEvmChain } from "@/lib/chains";
import { api, ApiError } from "@/lib/server/api";
import { usdPrice } from "@/lib/server/evmHoldings";
import { readProfile } from "@/lib/server/profile";
import { readWatchQuotes } from "@/lib/server/watchlist";
import { simulationAllowed, testModeEnabled } from "@/lib/test-mode";

const Body = z.object({
  symbol: z.string().trim().min(1).max(12),
  address: z.string().trim().min(32).max(44),
  amountUsd: z.number().min(1).max(100_000),
  acknowledged: z.boolean(),
});

const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/** Price a simulation without building, signing, recording, or sending an order. */
export async function POST(request: Request) {
  if (!testModeEnabled()) return fail(404, "Test mode is not enabled.");
  const profile = await readProfile();
  if (!profile) return fail(400, "Choose your country first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Enter an amount between 1 and 100,000 USD.");
  const { symbol, address, amountUsd, acknowledged } = parsed.data;

  let board;
  try { board = await api.tokens(symbol, profile.country, profile.who); }
  catch (error) { return fail(error instanceof ApiError ? error.status : 500, error instanceof Error ? error.message : "Unable to assess this asset."); }
  const token = board.tokens.find(item => item.address === address);
  if (!token) return fail(404, "Vestail does not know this token version.");
  const permission = simulationAllowed(token.assessed ? token.status : null, acknowledged);
  if (!permission.ok) return fail(403, permission.error);

  let priceUsd: number | null = null;
  if (token.chain === "solana") priceUsd = (await readWatchQuotes([token.mint])).get(token.mint)?.usdPrice ?? null;
  else if (isEvmChain(token.chain)) priceUsd = await usdPrice(token.chain, token.address, token.decimals);
  if (!priceUsd || !Number.isFinite(priceUsd)) return fail(422, "A current price is unavailable for this version.");

  return NextResponse.json({
    asset: board.asset,
    symbol: board.symbol,
    tokenSymbol: token.token_symbol,
    issuer: token.provider,
    amountUsd,
    quantity: amountUsd / priceUsd,
    priceUsd,
    verdict: token.status,
  }, { headers: { "Cache-Control": "no-store" } });
}
