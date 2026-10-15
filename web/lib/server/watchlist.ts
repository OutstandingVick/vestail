import "server-only";

import { jupiterHeaders } from "@/lib/server/jupiter";
import { api } from "@/lib/server/api";
import { readUser } from "@/lib/server/store";
import type { Profile, TokenBoard, WatchlistRow } from "@/lib/types";
import { parseJupiterSnapshots, selectWatchQuote, type QuoteByMint } from "@/lib/watchlist-quotes";

const JUPITER_SEARCH = "https://api.jup.ag/tokens/v2/search";

/** Read current token prices and 24-hour movement directly from Jupiter. */
export async function readWatchQuotes(mints: string[]): Promise<QuoteByMint> {
  const unique = [...new Set(mints)].slice(0, 100);
  if (!unique.length) return new Map();
  const response = await fetch(`${JUPITER_SEARCH}?query=${encodeURIComponent(unique.join(","))}`, {
    headers: jupiterHeaders(),
    next: { revalidate: 30 },
  });
  if (!response.ok) throw new Error(`Jupiter returned ${response.status}`);
  return parseJupiterSnapshots(await response.json());
}

export interface WatchlistSummary {
  items: WatchlistRow[];
  errors: string[];
}

/** Build the user's watchlist from saved choices, ownership rules and live token prices. */
export async function loadWatchlist(userId: string, profile: Profile): Promise<WatchlistSummary> {
  const [stored, assets] = await Promise.all([readUser(userId), api.assets()]);
  const names = new Map(assets.map(asset => [asset.id, asset.name]));
  const errors: string[] = [];
  const boards = new Map<string, TokenBoard>();
  await Promise.all([...new Set(stored.watchlist.map(item => item.symbol).filter((symbol): symbol is string => !!symbol))].map(async symbol => {
    try { boards.set(symbol, await api.tokens(symbol, profile.country, profile.who)); }
    catch { errors.push(`Live details for ${symbol} are unavailable.`); }
  }));

  const mints = [...boards.values()].flatMap(board => board.tokens.filter(token => token.chain === "solana").map(token => token.mint));
  let quotes: QuoteByMint = new Map();
  try { quotes = await readWatchQuotes(mints); }
  catch { if (mints.length) errors.push("Live watchlist prices are temporarily unavailable."); }
  const asOf = new Date().toISOString();

  const items = (await Promise.all(stored.watchlist.map(async item => {
    const board = item.symbol ? boards.get(item.symbol) : undefined;
    const rule = await api.rule(profile.country, item.asset, profile.who).catch(() => null);
    if (!rule) return null;
    return {
      ...item,
      name: board?.name ?? names.get(item.asset) ?? item.asset,
      status: rule.status,
      quote: board ? selectWatchQuote(board.tokens.filter(token => token.chain === "solana").map(token => ({
        mint: token.mint, tokenSymbol: token.token_symbol, provider: token.provider,
      })), quotes, asOf) : null,
    } satisfies WatchlistRow;
  }))).filter((item): item is WatchlistRow => item !== null);
  return { items, errors };
}
