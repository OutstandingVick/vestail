import "server-only";

/**
 * Live market data for the commodity perpetuals, straight from Hyperliquid's
 * public info API (no key). Read-only: Vestail shows the market and routes the
 * buyer to the venue; it never places an order or holds collateral.
 */
const INFO = "https://api.hyperliquid.xyz/info";

export interface MarketLive {
  markPx: number; oraclePx: number; prevDayPx: number; changePct: number;
  fundingHourlyPct: number; openInterestUsd: number; dayVolumeUsd: number;
  maxLeverage: number; isolatedOnly: boolean;
}

async function info<T>(body: object): Promise<T> {
  const res = await fetch(INFO, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`Hyperliquid returned HTTP ${res.status}`);
  return res.json();
}

/** Live data for every market on one HIP-3 dex, keyed by market id ("xyz:GOLD"). */
export async function liveMarkets(dex: string): Promise<Map<string, MarketLive>> {
  const [meta, ctxs] = await info<[{ universe: Array<{ name: string; maxLeverage: number; onlyIsolated?: boolean }> }, Array<Record<string, string>>]>(
    { type: "metaAndAssetCtxs", dex },
  );
  const out = new Map<string, MarketLive>();
  meta.universe.forEach((u, i) => {
    const c = ctxs[i];
    const mark = Number(c.markPx), prev = Number(c.prevDayPx);
    out.set(u.name, {
      markPx: mark, oraclePx: Number(c.oraclePx), prevDayPx: prev, changePct: prev ? ((mark - prev) / prev) * 100 : 0,
      fundingHourlyPct: Number(c.funding) * 100, openInterestUsd: Number(c.openInterest) * mark, dayVolumeUsd: Number(c.dayNtlVlm),
      maxLeverage: u.maxLeverage, isolatedOnly: !!u.onlyIsolated,
    });
  });
  return out;
}

/** Open positions an address holds on one HIP-3 dex (read-only, for the portfolio). */
export async function positionsOf(address: string, dex: string) {
  const state = await info<{ assetPositions: Array<{ position: { coin: string; szi: string; positionValue: string; unrealizedPnl: string; entryPx: string } }> }>(
    { type: "clearinghouseState", user: address, dex },
  );
  return state.assetPositions.map(p => ({
    market: p.position.coin, size: Number(p.position.szi), valueUsd: Number(p.position.positionValue),
    pnlUsd: Number(p.position.unrealizedPnl), entryPx: Number(p.position.entryPx),
  }));
}
