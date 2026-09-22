"use client";

import { useEffect, useState } from "react";

import type { AllowedRegion, AllowedSymbol } from "@/lib/constants";
import { EligibilityResponseSchema, type EligibilityResponse } from "@/lib/types";

export type EligibilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: EligibilityResponse };

/**
 * Every version of `symbol` with its verdict for `region`, from
 * /api/eligibility (real, sourced verdicts). Idle until both are chosen.
 */
export function useEligibility(
  symbol: AllowedSymbol | null,
  region: AllowedRegion | null,
): { state: EligibilityState; retry: () => void } {
  const [state, setState] = useState<EligibilityState>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!symbol || !region) {
      setState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/eligibility?${new URLSearchParams({ symbol, region })}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const body: unknown = await res.json();
        if (!res.ok) throw new Error(`Eligibility check failed (${res.status}).`);
        setState({ status: "ready", data: EligibilityResponseSchema.parse(body) });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: cause instanceof Error ? cause.message : "Eligibility check failed.",
        });
      });

    // Switching stock or country cancels the older request.
    return () => controller.abort();
  }, [symbol, region, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}
