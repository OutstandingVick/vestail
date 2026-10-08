import { NextResponse } from "next/server";

import { api } from "@/lib/server/api";
import { balancesOf, pricesOf, SOL_MINT, USDC_MINT } from "@/lib/server/holdings";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";
import { readUser, withSnapshot, writeUser } from "@/lib/server/store";
import { solanaWalletsOf } from "@/lib/server/wallets";
import type { Holding, Portfolio } from "@/lib/types";

/**
 * GET /api/portfolio — the signed-in user's dashboard, all from real sources:
 * balances read onchain from their own Privy-linked wallets, prices from
 * Jupiter, each holding's verdict for their declared country, their recorded
 * buys, their watchlist and their value history. Each visit records today's
 * value, so the history fills in over time; nothing is back-filled or sampled.
 */
export async function GET(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const profile = await readProfile();
  if (!profile) return NextResponse.json({ error: "Choose your country first." }, { status: 400 });

  // Each source fails on its own: the dashboard still renders, with a note
  // saying which part is missing, rather than nothing at all.
  const errors: string[] = [];
  const soft = <T,>(p: Promise<T>, fallback: T, message: string) => p.catch(() => (errors.push(message), fallback));
  const [wallets, symbols, assets, orders, stored] = await Promise.all([
    soft(solanaWalletsOf(userId), [] as string[], "Couldn't read your linked wallets from Privy."),
    soft(api.tokenSymbols(), [], "Couldn't load the list of tokenised stocks."),
    soft(api.assets(), [], "Couldn't load the asset classes."),
    soft(api.orders(userId), [], "Couldn't load your buys."),
    readUser(userId),
  ]);
  const nameOf = new Map(assets.map(a => [a.id, a.name]));

  const balances = await balancesOf(wallets).catch(() => {
    errors.push("Couldn't read balances from the Solana network.");
    return { sol: 0, tokens: new Map<string, number>() };
  });
  const held = symbols.filter(s => (s.mints ?? []).some(m => balances.tokens.has(m)));
  const prices = await soft(pricesOf([SOL_MINT, ...held.flatMap(s => s.mints.filter(m => balances.tokens.has(m)))]), new Map<string, number>(), "Couldn't get prices from Jupiter.");

  const holdings: Holding[] = [];
  for (const s of held) {
    const board = await soft(api.tokens(s.symbol, profile.country, profile.who), null, `Couldn't judge your ${s.symbol} holdings.`);
    if (!board) continue;
    for (const t of board.tokens) {
      const amount = balances.tokens.get(t.mint);
      if (!amount) continue;
      const price = prices.get(t.mint);
      holdings.push({
        mint: t.mint, symbol: s.symbol, token_symbol: t.token_symbol, name: s.name, provider: t.provider,
        amount, usd: price ? amount * price : null, status: t.status, asset: board.asset,
      });
    }
  }
  holdings.sort((a, b) => (b.usd ?? -1) - (a.usd ?? -1));

  const usdc = balances.tokens.get(USDC_MINT) ?? 0;
  const solPrice = prices.get(SOL_MINT) ?? null;
  const holdingsUsd = holdings.reduce((n, h) => n + (h.usd ?? 0), 0);
  const cashUsd = usdc + (solPrice ? balances.sol * solPrice : 0);

  let data = stored;
  if (!errors.length && wallets.length) {
    data = withSnapshot(stored, holdingsUsd + cashUsd);
    await writeUser(userId, data);
  }

  const watchlist = (await Promise.all(data.watchlist.map(async w => {
    const rule = await soft(api.rule(profile.country, w.asset, profile.who), null, "Couldn't judge part of your watchlist.");
    return rule && { ...w, name: nameOf.get(w.asset) ?? w.asset, status: rule.status };
  }))).filter(w => w !== null);

  const body: Portfolio = {
    wallets,
    totals: { usd: holdingsUsd + cashUsd, holdings_usd: holdingsUsd, cash_usd: cashUsd, unpriced: holdings.filter(h => h.usd === null).length },
    cash: { sol: balances.sol, sol_usd: solPrice ? balances.sol * solPrice : null, usdc },
    holdings, orders, watchlist, history: data.snapshots, errors,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
