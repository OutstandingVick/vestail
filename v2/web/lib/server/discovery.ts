import "server-only";

import type { DiscoverRow } from "@/components/DiscoverExplorer";
import { discover } from "@/lib/discover";
import { CHAIN_LABEL, INSTRUMENT_LABEL } from "@/lib/instrument";
import { api } from "@/lib/server/api";
import type { Profile, Status, Token } from "@/lib/types";

/** Build the Discover directory from the same rules used everywhere else. */
export async function loadDiscovery(profile: Profile) {
  const [countries, assets, matrix, symbols, markets] = await Promise.all([
    api.countries(), api.assets(), api.matrix({ who: profile.who, sort: "asset" }), api.tokenSymbols(), api.derivatives(),
  ]);
  const country = countries.find(place => place.code === profile.country)!;
  const nameOf = new Map(assets.map(asset => [asset.id, asset.name]));
  const discovery = discover(matrix.rows, profile.country);
  const total = matrix.rows.length;
  const boards = await Promise.all(symbols.map(symbol => api.tokens(symbol.symbol, profile.country, profile.who).catch(() => null)));
  const buyable = boards.flatMap(board => board
    ? board.tokens.filter(token => token.status === "can_own" || token.status === "conditional").map(token => ({ board, token }))
    : []);
  const bySymbol = new Map<string, { name: string; asset: string; symbol: string; tokens: Token[] }>();
  for (const { board, token } of buyable) {
    const entry = bySymbol.get(board.symbol) ?? { name: board.name, asset: board.asset, symbol: board.symbol, tokens: [] };
    entry.tokens.push(token);
    bySymbol.set(board.symbol, entry);
  }
  const judged = await Promise.all(markets.map(market => api.derivative(market.id, profile.country).catch(() => null)));
  const exposure = judged.filter(market => market && (market.status === "can_own" || market.status === "conditional"));
  const rows: DiscoverRow[] = [
    ...discovery.rare.map(item => ({
      id: `advantage-${item.asset}`, name: nameOf.get(item.asset) ?? item.asset, symbol: shortAsset(item.asset),
      kind: "Local advantage" as const, status: "can_own" as const,
      detail: `Open to ${who(profile.who)} in only ${item.openIn} of ${total} covered countries`,
      reach: `${item.openIn}/${total} countries`, href: `/app/asset/${item.asset}`,
    })),
    ...[...bySymbol.values()].map(item => ({
      id: `onchain-${item.symbol}`, name: item.name, symbol: item.symbol, kind: "Buy onchain" as const,
      status: strongest(item.tokens.map(token => token.status).filter(Boolean) as Status[]),
      detail: item.tokens.map(token => `${token.token_symbol} · ${CHAIN_LABEL[token.chain]} · ${INSTRUMENT_LABEL[token.instrument].label}`).join("  •  "),
      reach: `${item.tokens.length} version${item.tokens.length === 1 ? "" : "s"}`,
      href: `/app/asset/${item.asset}?symbol=${item.symbol}`,
    })),
    ...discovery.withinReach.map(item => ({
      id: `reach-${item.asset}`, name: nameOf.get(item.asset) ?? item.asset, symbol: shortAsset(item.asset),
      kind: "Within reach" as const, status: "conditional" as const,
      detail: "A licence, cap, approval, residency rule, or KYC step applies",
      reach: `${item.openIn}/${total} open outright`, href: `/app/asset/${item.asset}`,
    })),
    ...exposure.map(market => ({
      id: `exposure-${market!.id}`, name: market!.name, symbol: market!.coin, kind: "Price exposure" as const,
      status: market!.status as Status, detail: "Hyperliquid perpetual · tracks price only · this is not ownership",
      reach: "Hyperliquid", href: `/app/exposure/${market!.coin.toLowerCase()}`,
    })),
    ...discovery.elsewhere.map(item => ({
      id: `elsewhere-${item.asset}`, name: nameOf.get(item.asset) ?? item.asset, symbol: shortAsset(item.asset),
      kind: "Open elsewhere" as const, status: "cannot_own" as const,
      detail: `Open outright in ${item.countries.map(place => `${place.flag} ${place.name}`).join(", ")}`,
      reach: `${item.countries.length} alternative${item.countries.length === 1 ? "" : "s"}`,
      href: `/app/compare?asset=${item.asset}&who=${profile.who}`,
    })),
  ];
  return { rows, country };
}

const who = (buyer: string) => buyer === "citizen" ? "citizens" : "foreigners";
const shortAsset = (asset: string) => asset.split("_").map(word => word[0]).join("").toUpperCase().slice(0, 4);
const strongest = (statuses: Status[]): Status => statuses.includes("can_own") ? "can_own" : "conditional";
