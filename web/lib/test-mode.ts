import type { Status } from "@/lib/types";

export const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
export const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim() ?? "";

export interface SimulatedHolding {
  id: string;
  asset: string;
  symbol: string;
  tokenSymbol: string;
  issuer: string;
  amountUsd: number;
  quantity: number;
  priceUsd: number;
  verdict: Status;
  createdAt: string;
}

export type SimulationQuote = Omit<SimulatedHolding, "id" | "createdAt">;

export function testModeEnabled(value = process.env.NEXT_PUBLIC_TEST_MODE): boolean {
  return value === "true";
}

export function simulationAllowed(status: Status | null, acknowledged: boolean): { ok: true } | { ok: false; error: string } {
  if (status === "cannot_own" || status === null) return { ok: false, error: "This asset cannot be purchased in your declared country." };
  if (status === "conditional" && !acknowledged) return { ok: false, error: "Acknowledge the condition before simulating this purchase." };
  return { ok: true };
}

export async function choosePurchasePath<T>({ testMode, simulate, live }: {
  testMode: boolean;
  simulate: () => T | Promise<T>;
  live: () => T | Promise<T>;
}): Promise<T> {
  return testMode ? simulate() : live();
}
