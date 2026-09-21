import "server-only";

import { PRIVATE_SYMBOLS, type AllowedSymbol } from "@/lib/constants";
import { getSymbolEntry } from "@/lib/registry";
import type {
  Provider,
  RepresentationQuote,
  SymbolView,
} from "@/lib/types";
import { getIssuerMarks } from "@/lib/server/issuerMarks";
import { getTokenMarkets } from "@/lib/server/jupiter";
import { getPythPrices } from "@/lib/server/pyth";

/**
 * Providers whose tokens track one listed share each, which is the only case
 * where a premium against the share price means anything.
 *
 * Tessera and PreStocks tokens are priced in the issuer's own units, so they
 * are compared against the issuer's mark instead.
 */
const SHARE_TRACKING: ReadonlySet<Provider> = new Set([
  "xstocks",
  "ondo",
  "backpack",
]);

function pctDiff(value: number | null, base: number | null): number | null {
  if (value === null || base === null || base === 0) return null;
  return (value / base - 1) * 100;
}

/**
 * Builds the market view for one symbol from three independent sources.
 *
 * They are fetched in parallel and each can fail on its own. A failure
 * removes the numbers that depended on it and adds a warning saying so; it
 * never takes down the whole view, and it never fills a gap with a number
 * from somewhere else without saying where that number came from.
 */
export async function getSymbolView(symbol: AllowedSymbol): Promise<SymbolView> {
  const entry = getSymbolEntry(symbol);
  const reps = entry.representations;
  const isPrivate = PRIVATE_SYMBOLS.has(symbol);

  const feedIds = [
    ...(entry.referenceFeedId ? [entry.referenceFeedId] : []),
    ...reps.flatMap((r) => (r.pythFeedId ? [r.pythFeedId] : [])),
  ];

  const [pyth, jupiter, marks] = await Promise.all([
    getPythPrices(feedIds),
    getTokenMarkets(reps.map((r) => r.mint)),
    getIssuerMarks(),
  ]);

  const warnings: string[] = [];
  if (feedIds.length > 0 && pyth.status === "no_key") {
    warnings.push(
      "Pyth is not configured (PYTH_API_KEY), so there is no listed-share reference price and token prices fall back to Jupiter.",
    );
  } else if (pyth.status === "unauthorized") {
    warnings.push(
      "Pyth rejected the API key, so there is no listed-share reference price and token prices fall back to Jupiter.",
    );
  } else if (pyth.status === "ok") {
    if (pyth.notEntitled.length > 0) {
      warnings.push(
        `The configured Pyth plan does not include ${pyth.notEntitled.length} of ${feedIds.length} feeds for ${symbol} (US equity and tokenized-stock feeds). Those prices fall back to Jupiter, and premiums to the listed share cannot be shown without them.`,
      );
    }
    for (const message of new Set(pyth.errors)) {
      warnings.push(`Pyth: ${message}`);
    }
  }
  if (jupiter.status === "error") {
    warnings.push(`Jupiter market data unavailable: ${jupiter.message}`);
  }

  const pythPrices = pyth.status === "ok" ? pyth.prices : new Map();
  const markets = jupiter.status === "ok" ? jupiter.markets : new Map();

  const referencePrice = entry.referenceFeedId
    ? pythPrices.get(entry.referenceFeedId)
    : undefined;

  const representations: RepresentationQuote[] = reps.map((r) => {
    const pythPrice = r.pythFeedId ? pythPrices.get(r.pythFeedId) : undefined;
    const market = markets.get(r.mint);

    const price = pythPrice?.price ?? market?.usdPrice ?? null;
    const priceSource = pythPrice
      ? ("pyth" as const)
      : market?.usdPrice != null
        ? ("jupiter" as const)
        : null;

    const issuerMark = marks.get(r.mint) ?? null;

    return {
      representation: r,
      price,
      priceSource,
      vsReferencePct: SHARE_TRACKING.has(r.provider)
        ? pctDiff(price, referencePrice?.price ?? null)
        : null,
      issuerMark,
      vsIssuerMarkPct: pctDiff(price, issuerMark),
      liquidityUsd: market?.liquidityUsd ?? null,
    };
  });

  return {
    symbol,
    isPrivate,
    reference: referencePrice
      ? {
          price: referencePrice.price,
          publishTime: referencePrice.publishTime,
          source: "pyth",
        }
      : null,
    representations,
    warnings,
    asOf: new Date().toISOString(),
  };
}
