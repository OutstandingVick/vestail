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
