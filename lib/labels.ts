import type { Provider, Structure } from "@/lib/types";

/**
 * Plain-language copy for the legal structures.
 *
 * `holds` answers the only question a buyer actually has: what is my claim,
 * and against whom? It deliberately avoids "you own the stock" for every
 * structure, because for most of them you do not.
 */
export const STRUCTURE_COPY: Record<
  Structure,
  { label: string; holds: string }
> = {
  custody_backed: {
    label: "Custody-backed token",
    holds:
      "A 1:1 claim on a share the issuer holds at a custodian. Redemption runs through the issuer's own onboarding.",
  },
  total_return_note: {
    label: "Debt note",
    holds:
      "A note from the issuer that pays the share's total return. Your claim is on the issuer, not on a share.",
  },
  security_entitlement: {
    label: "Security entitlement",
    holds:
      "A book-entry interest held through a US broker-dealer, redeemable for the real share once you are onboarded.",
  },
  spv_exposure: {
    label: "SPV exposure",
    holds:
      "Economic exposure through a special-purpose vehicle. No shareholder rights, and the company may not recognise the SPV.",
  },
  loan_participation: {
    label: "Loan participation",
    holds:
      "A share of a loan to the issuer's entity, repaid only from a liquidity event, in a 90-day window that then lapses.",
  },
};

export const PROVIDER_NAME: Record<Provider, string> = {
  xstocks: "xStocks",
  ondo: "Ondo",
  backpack: "Backpack",
  tessera: "Tessera",
  prestocks: "PreStocks",
};

/**
 * One plain-English line per structure, for the /app version cards. Shorter
 * than STRUCTURE_COPY: a card has room for a single line, and the Source
 * link carries the detail.
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
