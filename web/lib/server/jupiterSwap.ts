import "server-only";

import { JUPITER_EXECUTE_ENDPOINT, JUPITER_ORDER_ENDPOINT } from "@/lib/constants";
import { jupiterHeaders } from "@/lib/server/jupiter";

/**
 * Jupiter Swap API V2, Meta-Aggregator path: GET /order -> sign -> POST
 * /execute. Only the fields Vestail reads are typed; the rest pass through
 * unused.
 */

export interface JupiterOrder {
  requestId: string;
  /** Base64 v0 transaction; "" when the swap cannot be built (see errorCode). */
  transaction: string | null;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  taker: string | null;
  router?: string;
  feeBps?: number;
  slippageBps?: number;
  /** Percent, e.g. 2.37 means 2.37%. (priceImpactPct is the same as a fraction.) */
  priceImpact?: number;
  gasless?: boolean;
  signatureFeeLamports?: number;
  signatureFeePayer?: string | null;
  prioritizationFeeLamports?: number;
  prioritizationFeePayer?: string | null;
  rentFeeLamports?: number;
  rentFeePayer?: string | null;
  lastValidBlockHeight?: string;
  errorCode?: number;
  errorMessage?: string;
}

export interface JupiterExecuteResult {
  status: "Success" | "Failed";
  signature?: string;
  code: number;
  error?: string;
  totalInputAmount?: string;
  totalOutputAmount?: string;
}

export type JupiterCall<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      /** Jupiter's error body when it sent JSON, e.g. { code: -1003, error }. */
      body?: unknown;
    };

async function call<T>(url: string, init: RequestInit): Promise<JupiterCall<T>> {
  try {
    const res = await fetch(url, { ...init, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
      return {
        ok: false,
        status: res.status,
        message:
          res.status === 429
            ? "Jupiter is rate-limiting requests. Try again in a moment."
            : `Jupiter returned HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`,
        body,
      };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (cause) {
    return {
      ok: false,
      status: 502,
      message: cause instanceof Error ? cause.message : "Could not reach Jupiter.",
    };
  }
}

/**
 * Without `taker`, Jupiter returns a price but no transaction.
 *
 * `slippageBps` is always sent. Left off, Jupiter picks the slippage itself,
 * and whatever it picks is what the user ends up signing for.
 */
export function getOrder(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  taker?: string;
  slippageBps: number;
  /** Routers to keep out of the answer, e.g. "jupiterz". */
  excludeRouters?: string;
}): Promise<JupiterCall<JupiterOrder>> {
  const query = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: String(params.slippageBps),
    ...(params.taker ? { taker: params.taker } : {}),
    ...(params.excludeRouters ? { excludeRouters: params.excludeRouters } : {}),
  });
  return call<JupiterOrder>(`${JUPITER_ORDER_ENDPOINT}?${query}`, {
    headers: jupiterHeaders(),
  });
}

/**
 * Whether a failed /order call means "no route". Jupiter answers HTTP 400
 * { "error": "Failed to get quotes" } when nothing can fill the swap
 * (checked against dust-sized orders); a 500 is something else going wrong.
 */
export function isNoRoute(result: JupiterCall<JupiterOrder>): boolean {
  if (result.ok) return result.data.outAmount === "0";
  const body = result.body as { error?: unknown } | undefined;
  return result.status === 400 && body?.error === "Failed to get quotes";
}

export function executeOrder(body: {
  signedTransaction: string;
  requestId: string;
}): Promise<JupiterCall<JupiterExecuteResult>> {
  return call<JupiterExecuteResult>(JUPITER_EXECUTE_ENDPOINT, {
    method: "POST",
    headers: { ...jupiterHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
