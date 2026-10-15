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

export type { WatchQuote };
