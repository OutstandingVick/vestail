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

const STORAGE_KEY = "vestail:test-holdings:v1";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readSimulatedHoldings(storage: StorageLike): SimulatedHolding[] {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isSimulatedHolding) : [];
  } catch {
    return [];
  }
}

export function addSimulatedHolding(storage: StorageLike, holding: SimulatedHolding): SimulatedHolding[] {
  const next = [holding, ...readSimulatedHoldings(storage)].slice(0, 100);
  try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Test holdings may stay in memory when storage is unavailable. */ }
  return next;
}

export function resetSimulatedHoldings(storage: StorageLike): void {
  try { storage.removeItem(STORAGE_KEY); } catch { /* Private browsing may deny storage. */ }
}

function isSimulatedHolding(value: unknown): value is SimulatedHolding {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SimulatedHolding>;
  return typeof row.id === "string" && typeof row.asset === "string" && typeof row.symbol === "string"
    && typeof row.tokenSymbol === "string" && typeof row.issuer === "string" && typeof row.amountUsd === "number"
    && typeof row.quantity === "number" && typeof row.priceUsd === "number" && typeof row.createdAt === "string"
    && ["can_own", "conditional", "cannot_own"].includes(row.verdict ?? "");
}
