import assert from "node:assert/strict";
import test from "node:test";

import { parseJupiterSnapshots, selectWatchQuote, sortWatchlist } from "./watchlist-quotes.ts";

test("keeps finite live prices from Jupiter", () => {
  const quotes = parseJupiterSnapshots([{ id: "mint-a", symbol: "AAA", usdPrice: 12.5, liquidity: 900, stats24h: { priceChange: 2.4 } }]);
  assert.deepEqual(quotes.get("mint-a"), {
    id: "mint-a", symbol: "AAA", usdPrice: 12.5, liquidity: 900, stats24h: { priceChange: 2.4 },
  });
});

test("drops malformed and non-finite price rows", () => {
  const quotes = parseJupiterSnapshots([
    null,
    { id: "missing-symbol", usdPrice: 10 },
    { id: "nan", symbol: "NAN", usdPrice: Number.NaN },
  ]);
  assert.equal(quotes.size, 0);
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

test("keeps a price when the 24 hour move is unavailable", () => {
  const quotes = parseJupiterSnapshots([{ id: "mint-a", symbol: "AAA", usdPrice: 8, liquidity: null, stats24h: null }]);
  const quote = selectWatchQuote([{ mint: "mint-a", tokenSymbol: "AAA", provider: "issuer" }], quotes, "now");
  assert.equal(quote?.price_usd, 8);
  assert.equal(quote?.change_24h_pct, null);
});

test("returns no quote when no tracked mint is priced", () => {
  const quote = selectWatchQuote([{ mint: "missing", tokenSymbol: "AAA", provider: "issuer" }], new Map(), "now");
  assert.equal(quote, null);
});

test("orders gainers by strongest 24 hour move", () => {
  const quote = (change_24h_pct: number) => ({ price_usd: 10, change_24h_pct, liquidity_usd: 20, token_symbol: "AAA", provider: "issuer", mint: "mint", as_of: "now" });
  const rows = [
    { added: "2026-10-15", quote: quote(-2) },
    { added: "2026-10-14", quote: quote(4) },
  ];
  assert.equal(sortWatchlist(rows, "gainers")[0].quote?.change_24h_pct, 4);
});
