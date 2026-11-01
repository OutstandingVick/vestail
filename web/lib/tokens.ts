import type { Resolution, TokenSymbol } from "@/lib/types";

export const ONCHAIN_CLASSES = new Set(["domestic_equities", "foreign_equities", "private_company_shares"]);

export function symbolsFor(q: string, resolution: Resolution, all: TokenSymbol[]): TokenSymbol[] {
  const typed = q.trim().toLowerCase();
  const entity = resolution.stage === "entity" ? resolution.entity?.name.toLowerCase() : undefined;
  return all.filter(s =>
    (entity && s.entity?.toLowerCase() === entity) ||
    s.symbol.toLowerCase() === typed ||
    s.name.toLowerCase() === typed,
  );
}
