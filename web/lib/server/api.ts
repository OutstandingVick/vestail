import "server-only";

import type { Utilities, Asset, BuyerType, Order, Category, Country, Matrix, ProductActivity, Resolution, Rule, TokenBoard, TokenSymbol } from "@/lib/types";

import { callApi, callPublicApi } from "./local-api.ts";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

// Cache promises so concurrent first reads share the same in-process API call.
const reference_cache = new Map<string, Promise<unknown>>();

async function get<T>(path: string, reference = false): Promise<T> {
  if (reference) {
    const hit = reference_cache.get(path);
    if (hit) return hit as Promise<T>;
    const pending = read<T>(path).catch(err => { reference_cache.delete(path); throw err; });
    reference_cache.set(path, pending);
    return pending;
  }
  return read<T>(path);
}

async function read<T>(path: string): Promise<T> {
  const res = await callApi(path);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "unavailable", body?.error?.message ?? `API returned ${res.status}`);
  return body as T;
}

const qs = (p: Record<string, string | undefined>) =>
  "?" + new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => !!e[1])).toString();

export const api = {
  /** What a holder may do with each version of an asset (trade, lend, borrow, earn), with live numbers. Never cached: verdicts and markets move. */
  async utilities(asset: string, country: string, residency: "citizen" | "resident" | "foreigner"): Promise<Utilities> {
    const res = await callPublicApi(`/utilities?${new URLSearchParams({ asset, country, residency })}`);
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "unavailable", body?.error?.message ?? "Utilities unavailable.");
    return body as Utilities;
  },
  countries: () => get<Country[]>("/countries", true),
  assets: () => get<Asset[]>("/assets", true),
  categories: () => get<Category[]>("/categories", true),
  tokenSymbols: () => get<TokenSymbol[]>("/tokens", true),
  resolve: (q: string) => get<Resolution>("/resolve" + qs({ q })),
  matrix: (p: { q?: string; who: BuyerType; countries?: string; sort?: "status" | "asset" }) => get<Matrix>("/matrix" + qs(p)),
  rule: (country: string, asset: string, who: BuyerType) => get<Rule>(`/rules/${country}/${asset}` + qs({ who })),
  tokens: (symbol: string, country: string, who: BuyerType) =>
    get<TokenBoard>(`/tokens/${encodeURIComponent(symbol)}` + qs({ country, who })),

  activity: () => get<ProductActivity>("/activity"),

  async orders(session: string, limit = 20): Promise<Order[]> {
    const safeLimit = Math.min(200, Math.max(1, Math.trunc(limit)));
    const res = await callApi("/orders" + qs({ session, limit: String(safeLimit) }));
    return res.ok ? res.json() : [];
  },

  async click(body: {
    country: string; asset: string; who: BuyerType; venue: string;
    acknowledged?: boolean; mint?: string; market?: string; query?: string; session?: string;
  }): Promise<{ id: string; redirect: string }> {
    const res = await callApi("/orders/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "unavailable", json?.error?.message ?? "Click refused.");
    return json;
  },
};
