/**
 * Spot trading numbers for a token from Jupiter's public quote API: for each
 * pair (USDC, SOL), what a reference amount buys, the price impact, and which
 * venues the route uses. Read-only quotes; Vestail never trades with leverage.
 */
import { QUOTE_MINTS } from "./meteora.js";

const QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
/** Reference sizes: 100 USDC, 0.5 SOL, in base units. */
const REFERENCE = { USDC: { amount: "100000000", decimals: 6 }, SOL: { amount: "500000000", decimals: 9 } };

export async function jupiterPairs(mint, decimals, { pairs = ["USDC", "SOL"], fetchImpl = fetch, timeoutMs = 6000 } = {}) {
  return Promise.all(pairs.map(async pair => {
    const ref = REFERENCE[pair];
    const url = `${QUOTE}?inputMint=${QUOTE_MINTS[pair]}&outputMint=${mint}&amount=${ref.amount}&slippageBps=100&restrictIntermediateTokens=true`;
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) return { pair, available: false, note: `Jupiter returned HTTP ${res.status}` };
      const q = await res.json();
      if (!q.outAmount || q.outAmount === "0") return { pair, available: false, note: "No route right now." };
      const spend = Number(ref.amount) / 10 ** ref.decimals;
      const out = Number(q.outAmount) / 10 ** decimals;
      return {
        pair, available: true,
        reference: { spend, spendSymbol: pair, receive: out },
        pricePerToken: out > 0 ? spend / out : null,
        priceImpactPct: Number(q.priceImpactPct ?? 0) * 100,
        venues: [...new Set((q.routePlan || []).map(r => r.swapInfo?.label).filter(Boolean))],
      };
    } catch (e) {
      return { pair, available: false, note: e?.name === "TimeoutError" ? "Jupiter timed out." : "Couldn't reach Jupiter." };
    }
  }));
}
