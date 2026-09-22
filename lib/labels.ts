import type { Provider, Structure } from "@/lib/types";

export const PROVIDER_NAME: Record<Provider, string> = {
  xstocks: "xStocks",
  ondo: "Ondo",
  backpack: "Backpack",
  tessera: "Tessera",
  prestocks: "PreStocks",
};

/**
 * One plain-English line per structure, for the /app version cards. A card
 * has room for a single line; the Source link carries the detail.
 */
export const STRUCTURE_PLAIN: Record<Structure, string> = {
  custody_backed: "Backed 1:1 by real shares held in custody",
  total_return_note: "Tracks the price, not the share itself",
  security_entitlement: "A legally recognised share via a licensed broker",
  spv_exposure: "Exposure through a holding vehicle, with no shareholder rights",
  loan_participation: "A loan repaid only if the company lists or is sold",
};

/** Two-letter monogram for a ticker badge: "NVDA" -> "NV". No logos, ever. */
export function monogram(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase();
}
