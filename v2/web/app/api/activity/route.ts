import { NextResponse } from "next/server";

import { CHAIN_LABEL } from "@/lib/instrument";
import { api } from "@/lib/server/api";
import { userFrom } from "@/lib/server/privy";
import type { ActivityItem, TokenBoard } from "@/lib/types";

/** GET /api/activity — the verified user's recorded Vestail buy presses. */
export async function GET(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const [orders, assets, countries, symbols, markets] = await Promise.all([
    api.orders(userId, 200), api.assets(), api.countries(), api.tokenSymbols(), api.derivatives(),
  ]);
  const assetName = new Map(assets.map(asset => [asset.id, asset.name]));
  const countryName = new Map(countries.map(country => [country.code, `${country.flag} ${country.name}`]));
  const marketName = new Map(markets.map(market => [market.id, market.name]));
  const symbolByMint = new Map(symbols.flatMap(symbol => symbol.mints.map(mint => [mint, symbol.symbol] as const)));
  const boardCache = new Map<string, Promise<TokenBoard | null>>();

  const items: ActivityItem[] = await Promise.all(orders.map(async order => {
    let name = assetName.get(order.asset) ?? order.asset;
    let symbol: string | undefined;
    let chain = order.chain;
    if (order.market) {
      name = marketName.get(order.market) ?? order.market;
      symbol = order.market.split(":").at(-1);
      chain ??= "hyperliquid";
    } else if (order.mint) {
      symbol = symbolByMint.get(order.mint);
      if (symbol) {
        const key = `${symbol}:${order.country}:${order.who}`;
        const board = await (boardCache.get(key) ?? (() => {
          const pending = api.tokens(symbol!, order.country, order.who).catch(() => null);
          boardCache.set(key, pending);
          return pending;
        })());
        const token = board?.tokens.find(candidate => candidate.address === order.mint || candidate.mint === order.mint);
        name = token?.token_symbol ?? symbol;
        chain ??= token?.chain;
      }
    }
    return {
      ...order,
      chain,
      name,
      symbol,
      chain_label: chain ? CHAIN_LABEL[chain] ?? chain : undefined,
      country_label: countryName.get(order.country) ?? order.country,
    };
  }));

  items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}
