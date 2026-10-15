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

export type { WatchQuote };
