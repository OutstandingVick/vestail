/**
 * Meteora pools for a token, from Meteora's public data APIs (DLMM and DAMM
 * v2). Only pools pairing the token with USDC or SOL are kept: most DAMM v2
 * pools pair stock tokens with unverified meme tokens, which Vestail won't
 * route anyone into. Read-only; numbers come straight from Meteora.
 */
export const QUOTE_MINTS = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  SOL: "So11111111111111111111111111111111111111112",
};
const HOSTS = { dlmm: "https://dlmm.datapi.meteora.ag", damm_v2: "https://damm-v2.datapi.meteora.ag" };

const num = v => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Shape one data-API pool into what Vestail shows. */
export function shapePool(kind, p, mint, pairs) {
  const other = p.token_x?.address === mint ? p.token_y : p.token_y?.address === mint ? p.token_x : null;
  const pair = other && Object.entries(QUOTE_MINTS).find(([sym, m]) => m === other.address && pairs.includes(sym))?.[0];
  if (!pair || p.is_blacklisted) return null;
  const feeTvl24h = num(p.fee_tvl_ratio?.["24h"]);
  return {
    address: p.address, kind, name: p.name, pair,
    tvlUsd: num(p.tvl),
    volume24hUsd: num(p.volume?.["24h"]),
    fees24hUsd: num(p.fees?.["24h"]),
    feeTvl24hPct: feeTvl24h,
    // Meteora reports fees/TVL over 24h as a percentage; annualised simply (no compounding).
    feeAprPct: feeTvl24h === null ? null : feeTvl24h * 365,
    binStep: num(p.pool_config?.bin_step),
    baseFeePct: num(p.pool_config?.base_fee_pct),
  };
}

/** USDC/SOL pools for `mint` across the requested pool kinds, deepest first. */
export async function meteoraPools(mint, { kinds = ["dlmm", "damm_v2"], pairs = ["USDC", "SOL"], fetchImpl = fetch, timeoutMs = 6000 } = {}) {
  const lists = await Promise.all(kinds.map(async kind => {
    const res = await fetchImpl(`${HOSTS[kind]}/pools?query=${encodeURIComponent(mint)}&page_size=50&sort_by=tvl:desc`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`Meteora ${kind} returned HTTP ${res.status}`);
    const body = await res.json();
    return (body.data || []).map(p => shapePool(kind, p, mint, pairs)).filter(Boolean);
  }));
  return lists.flat().sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0));
}

/** Total USD depth across the pools. */
export const depthUsd = pools => pools.reduce((n, p) => n + (p.tvlUsd ?? 0), 0);
