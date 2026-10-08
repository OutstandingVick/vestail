import { NextResponse } from "next/server";

import { api } from "@/lib/server/api";
import { balancesOf, pricesOf, SOL_MINT, USDC_MINT } from "@/lib/server/holdings";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";
import { readUser, withSnapshot, writeUser } from "@/lib/server/store";
import { walletsOf } from "@/lib/server/wallets";
import { ethBalance, tokenBalance, usdPrice } from "@/lib/server/evmHoldings";
import { positionsOf } from "@/lib/server/hyperliquid";
import { isEvmChain, NATIVE_ETH, type EvmChainKey } from "@/lib/chains";
import type { Holding, Portfolio } from "@/lib/types";

/**
 * GET /api/portfolio — the signed-in user's dashboard, all from real sources:
 * balances read onchain from their own Privy-linked wallets (Solana, Base,
 * Robinhood Chain), prices from Jupiter and KyberSwap, open Hyperliquid
 * positions, each holding's verdict for their declared country, their recorded
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
  const [linked, symbols, assets, orders, stored] = await Promise.all([
    soft(walletsOf(userId), { solana: [] as string[], evm: [] as string[] }, "Couldn't read your linked wallets from Privy."),
    soft(api.tokenSymbols(), [], "Couldn't load the list of tokenised stocks."),
    soft(api.assets(), [], "Couldn't load the asset classes."),
    soft(api.orders(userId), [], "Couldn't load your buys."),
    readUser(userId),
  ]);
  const nameOf = new Map(assets.map(a => [a.id, a.name]));
  const wallets = linked.solana;

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
        mint: t.mint, symbol: s.symbol, token_symbol: t.token_symbol, name: s.name, provider: t.provider, chain: t.chain,
        amount, usd: price ? amount * price : null, status: t.status, asset: board.asset,
      });
    }
  }
  // EVM chains: the tracked stock tokens and ETH on Base and Robinhood Chain.
  const evm = linked.evm;
  const eth: Record<EvmChainKey, number> = { base: 0, robinhood: 0 };
  let ethUsd = 0;
  if (evm.length) {
    for (const chain of ["base", "robinhood"] as const) {
      const amounts = await soft(Promise.all(evm.map(w => ethBalance(chain, w))), [] as number[], `Couldn't read ETH balances on ${chain}.`);
      eth[chain] = amounts.reduce((a, b) => a + b, 0);
    }
    const ethPrice = eth.base + eth.robinhood > 0 ? await usdPrice("base", NATIVE_ETH, 18) : null;
    ethUsd = ethPrice ? (eth.base + eth.robinhood) * ethPrice : 0;

    for (const s of symbols.filter(x => (x.chains ?? []).some(c => isEvmChain(c)))) {
      const board = await soft(api.tokens(s.symbol, profile.country, profile.who), null, `Couldn't judge your ${s.symbol} holdings.`);
      for (const t of board?.tokens ?? []) {
        if (!isEvmChain(t.chain)) continue;
        const chain = t.chain;
        const amounts = await soft(Promise.all(evm.map(w => tokenBalance(chain, t.address, w, t.decimals))), [] as number[], `Couldn't read ${t.token_symbol} on ${t.chain_name}.`);
        const amount = amounts.reduce((a, b) => a + b, 0);
        if (!amount) continue;
        const price = await usdPrice(chain, t.address, t.decimals);
        holdings.push({
          mint: t.address, symbol: s.symbol, token_symbol: t.token_symbol, name: s.name, provider: t.provider, chain: t.chain,
          amount, usd: price ? amount * price : null, status: t.status, asset: board!.asset,
        });
      }
    }
  }
  holdings.sort((a, b) => (b.usd ?? -1) - (a.usd ?? -1));

  // Hyperliquid: open commodity positions, read-only. Price exposure, not holdings.
  const positions = [];
  for (const w of evm) {
    for (const p of await soft(positionsOf(w, "xyz"), [], "Couldn't read your Hyperliquid positions.")) {
      const m = await soft(api.derivative(p.market, profile.country), null, `Couldn't judge ${p.market}.`);
      positions.push({ ...p, name: m?.name ?? p.market, coin: p.market.split(":")[1] ?? p.market, status: m?.status ?? null });
    }
  }
  const positionsUsd = positions.reduce((n, p) => n + p.pnlUsd, 0);

  const usdc = balances.tokens.get(USDC_MINT) ?? 0;
  const solPrice = prices.get(SOL_MINT) ?? null;
  const holdingsUsd = holdings.reduce((n, h) => n + (h.usd ?? 0), 0);
  const cashUsd = usdc + (solPrice ? balances.sol * solPrice : 0) + ethUsd;

  let data = stored;
  if (!errors.length && (wallets.length || evm.length)) {
    data = withSnapshot(stored, holdingsUsd + cashUsd);
    await writeUser(userId, data);
  }

  const watchlist = (await Promise.all(data.watchlist.map(async w => {
    const rule = await soft(api.rule(profile.country, w.asset, profile.who), null, "Couldn't judge part of your watchlist.");
    return rule && { ...w, name: nameOf.get(w.asset) ?? w.asset, status: rule.status };
  }))).filter(w => w !== null);

  const body: Portfolio = {
    wallets: [...wallets, ...evm], evm_wallets: evm,
    totals: { usd: holdingsUsd + cashUsd, holdings_usd: holdingsUsd, cash_usd: cashUsd, unpriced: holdings.filter(h => h.usd === null).length, positions_pnl_usd: positionsUsd },
    cash: { sol: balances.sol, sol_usd: solPrice ? balances.sol * solPrice : null, usdc, eth, eth_usd: ethUsd },
    holdings, positions, orders, watchlist, history: data.snapshots, errors,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
