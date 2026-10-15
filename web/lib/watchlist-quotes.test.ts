import assert from "node:assert/strict";
import test from "node:test";

import { parseJupiterSnapshots, selectWatchQuote } from "./watchlist-quotes.ts";

test("keeps finite live prices from Jupiter", () => {
  const quotes = parseJupiterSnapshots([{ id: "mint-a", symbol: "AAA", usdPrice: 12.5, liquidity: 900, stats24h: { priceChange: 2.4 } }]);
  assert.deepEqual(quotes.get("mint-a"), {
    id: "mint-a", symbol: "AAA", usdPrice: 12.5, liquidity: 900, stats24h: { priceChange: 2.4 },
  });
});

test("selects the most liquid watched representation", () => {
  const quotes = parseJupiterSnapshots([
    { id: "thin", symbol: "AAA1", usdPrice: 10, liquidity: 50, stats24h: { priceChange: 1 } },
    { id: "deep", symbol: "AAA2", usdPrice: 11, liquidity: 500, stats24h: { priceChange: 2 } },
  ]);
  const quote = selectWatchQuote([
    { mint: "thin", tokenSymbol: "AAA1", provider: "first" },
    { mint: "deep", tokenSymbol: "AAA2", provider: "second" },
  ], quotes, "2026-10-15T12:00:00.000Z");
  assert.equal(quote?.mint, "deep");
  assert.equal(quote?.provider, "second");
});
