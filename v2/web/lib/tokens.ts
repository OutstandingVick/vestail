import type { Resolution, TokenSymbol } from "@/lib/types";

/** Asset classes that have tokenised versions onchain. */
export const ONCHAIN_CLASSES = new Set(["domestic_equities", "foreign_equities", "private_company_shares"]);

/**
 * Token symbols a search refers to: the resolved entity's tickers, or a
 * ticker or name typed directly ("NVDA", "SpaceX").
 */
export function symbolsFor(q: string, resolution: Resolution, all: TokenSymbol[]): TokenSymbol[] {
  const typed = q.trim().toLowerCase();
  const entity = resolution.stage === "entity" ? resolution.entity?.name.toLowerCase() : undefined;
  return all.filter(s =>
    (entity && s.entity?.toLowerCase() === entity) ||
    s.symbol.toLowerCase() === typed ||
    s.name.toLowerCase() === typed,
  );
}
