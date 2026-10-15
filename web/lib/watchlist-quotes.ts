import type { WatchQuote } from "@/lib/types";

export interface JupiterTokenSnapshot {
  id: string;
  symbol: string;
  usdPrice: number | null;
  liquidity: number | null;
  stats24h: { priceChange?: number | null } | null;
}

export interface QuoteCandidate {
  mint: string;
  tokenSymbol: string;
  provider: string;
}

export type QuoteByMint = Map<string, JupiterTokenSnapshot>;
export type WatchSort = "recent" | "gainers" | "decliners";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseJupiterSnapshots(value: unknown): QuoteByMint {
  const result: QuoteByMint = new Map();
  if (!Array.isArray(value)) return result;
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.symbol !== "string" || !isFiniteNumber(item.usdPrice)) continue;
    const stats = item.stats24h && typeof item.stats24h === "object" ? item.stats24h as Record<string, unknown> : null;
    result.set(item.id, {
      id: item.id,
      symbol: item.symbol,
      usdPrice: item.usdPrice,
      liquidity: isFiniteNumber(item.liquidity) ? item.liquidity : null,
      stats24h: stats ? { priceChange: isFiniteNumber(stats.priceChange) ? stats.priceChange : null } : null,
    });
  }
  return result;
}

export function selectWatchQuote(candidates: QuoteCandidate[], quotes: QuoteByMint, asOf: string): WatchQuote | null {
  const available = candidates.flatMap(candidate => {
    const quote = quotes.get(candidate.mint);
    return quote?.usdPrice ? [{ candidate, quote }] : [];
  });
  available.sort((a, b) => (b.quote.liquidity ?? -1) - (a.quote.liquidity ?? -1));
  const selected = available[0];
  if (!selected) return null;
  return {
    price_usd: selected.quote.usdPrice!,
    change_24h_pct: selected.quote.stats24h?.priceChange ?? null,
    liquidity_usd: selected.quote.liquidity,
    token_symbol: selected.candidate.tokenSymbol,
    provider: selected.candidate.provider,
    mint: selected.candidate.mint,
    as_of: asOf,
  };
}

export function sortWatchlist<T extends { added: string; quote: WatchQuote | null }>(items: T[], sort: WatchSort): T[] {
  const rows = [...items];
  if (sort === "recent") return rows.sort((a, b) => b.added.localeCompare(a.added));
  const direction = sort === "gainers" ? -1 : 1;
  return rows.sort((a, b) => {
    const aChange = a.quote?.change_24h_pct;
    const bChange = b.quote?.change_24h_pct;
    if (aChange == null && bChange == null) return b.added.localeCompare(a.added);
    if (aChange == null) return 1;
    if (bChange == null) return -1;
    return (aChange - bChange) * direction;
  });
}

export type { WatchQuote };
