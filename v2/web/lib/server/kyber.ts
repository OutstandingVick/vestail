import "server-only";

import { NATIVE_ETH } from "@/lib/chains";

/**
 * KyberSwap's aggregator, which routes on Base and Robinhood Chain without an
 * API key. Two calls: find a route (a price), then build the transaction for
 * a given wallet. Everything it returns is checked before use.
 */
const BASE = "https://aggregator-api.kyberswap.com";
const HEADERS = { "x-client-id": "vestail", "Content-Type": "application/json" };

export interface KyberRoute {
  routeSummary: { tokenIn: string; tokenOut: string; amountIn: string; amountOut: string; amountInUsd: string; amountOutUsd: string; [k: string]: unknown };
  routerAddress: string;
}
export interface KyberBuild { amountIn: string; amountOut: string; data: string; routerAddress: string; transactionValue: string }

async function call<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(url, { ...init, headers: HEADERS, cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.code !== 0) return { ok: false, message: body?.message ?? `KyberSwap returned HTTP ${res.status}` };
    return { ok: true, data: body.data as T };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't reach KyberSwap." };
  }
}

/** A route paying `amountWei` of native ETH for `tokenOut`. */
export const route = (chain: string, tokenOut: string, amountWei: string) =>
  call<KyberRoute>(`${BASE}/${chain}/api/v1/routes?tokenIn=${NATIVE_ETH}&tokenOut=${tokenOut}&amountIn=${amountWei}`);

/** The transaction for that route, sending the output back to `taker`. */
export const build = (chain: string, r: KyberRoute, taker: string, slippageBps: number) =>
  call<KyberBuild>(`${BASE}/${chain}/api/v1/route/build`, {
    method: "POST",
    body: JSON.stringify({ routeSummary: r.routeSummary, sender: taker, recipient: taker, slippageTolerance: slippageBps }),
  });
