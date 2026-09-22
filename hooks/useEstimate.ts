"use client";

import { useEffect, useState } from "react";

import type { AllowedRegion } from "@/lib/constants";
import { SwapErrorSchema, SwapQuoteSchema, type SwapQuote } from "@/lib/types";

export type EstimateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quote: SwapQuote }
  | { status: "no_route" }
  | { status: "error"; message: string };

/** Wait this long after the last keystroke before asking for a price. */
const DEBOUNCE_MS = 450;

/**
 * A price estimate for "You get": what `amount` of the pay token buys of the
 * selected version. Quote-only (no wallet needed, nothing to sign), and
 * debounced so typing does not fire a request per keystroke, which keyless
 * Jupiter would rate-limit.
 *
 * `amount` is in the pay token's base units; null means "nothing to price".
 */
export function useEstimate(params: {
  inputMint: string;
  outputMint: string | null;
  amount: bigint | null;
  region: AllowedRegion | null;
}): EstimateState {
  const { inputMint, outputMint, amount, region } = params;
  const [state, setState] = useState<EstimateState>({ status: "idle" });
  const amountKey = amount?.toString() ?? null;

  useEffect(() => {
    if (!outputMint || !region || !amountKey || amountKey === "0") {
      setState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ inputMint, outputMint, amount: amountKey, region });
      fetch(`/api/swap/order?${query}`, { signal: controller.signal })
        .then(async (res) => {
          const body: unknown = await res.json();
          if (!res.ok) {
            const err = SwapErrorSchema.safeParse(body);
            if (err.success && err.data.code === "no_route") {
              setState({ status: "no_route" });
              return;
            }
            throw new Error(err.success ? err.data.error : `Pricing failed (${res.status}).`);
          }
          setState({ status: "ready", quote: SwapQuoteSchema.parse(body) });
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setState({
            status: "error",
            message: cause instanceof Error ? cause.message : "Pricing failed.",
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [inputMint, outputMint, amountKey, region]);

  return state;
}
