import "server-only";

import { JUPITER_EXECUTE_ENDPOINT, JUPITER_ORDER_ENDPOINT } from "@/lib/constants";
import { jupiterHeaders } from "@/lib/server/jupiter";

export interface JupiterOrder {
  requestId: string;
  transaction: string | null;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  taker: string | null;
  router?: string;
  feeBps?: number;
  slippageBps?: number;
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

// Without a taker Jupiter returns only a quote; always pin slippage either way.
export function getOrder(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  taker?: string;
  slippageBps: number;
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
