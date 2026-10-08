import "server-only";

import type { Asset, BuyerType, Order, Category, Country, Matrix, Resolution, Rule, TokenBoard, TokenSymbol } from "@/lib/types";

/**
 * The v2 API, read from the server. Rules are fetched uncached: a compliance
 * answer should change the moment its rule does, not an hour later. Reference
 * lists (countries, assets, categories, token symbols) change only with a
 * deploy and are cached for five minutes.
 */

const BASE = (process.env.VESTAIL_API_URL || "http://localhost:8787/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

async function get<T>(path: string, reference = false): Promise<T> {
  // Reference lists are cached briefly, not for a day: a cached copy from an
  // older API (say, before the token list carried mints) must not outlive it.
  const res = await fetch(BASE + path, reference ? { next: { revalidate: 300 } } : { cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "unavailable", body?.error?.message ?? `API returned ${res.status}`);
  return body as T;
}

const qs = (p: Record<string, string | undefined>) =>
  "?" + new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => !!e[1])).toString();

export const api = {
  countries: () => get<Country[]>("/countries", true),
  assets: () => get<Asset[]>("/assets", true),
  categories: () => get<Category[]>("/categories", true),
  tokenSymbols: () => get<TokenSymbol[]>("/tokens", true),
  resolve: (q: string) => get<Resolution>("/resolve" + qs({ q })),
  matrix: (p: { q?: string; who: BuyerType; countries?: string; sort?: "status" | "asset" }) => get<Matrix>("/matrix" + qs(p)),
  rule: (country: string, asset: string, who: BuyerType) => get<Rule>(`/rules/${country}/${asset}` + qs({ who })),
  tokens: (symbol: string, country: string, who: BuyerType) =>
    get<TokenBoard>(`/tokens/${encodeURIComponent(symbol)}` + qs({ country, who })),

  /** One user's recorded Buy presses (GET /orders), with the server's key. */
  async orders(session: string): Promise<Order[]> {
    const key = process.env.VESTAIL_API_KEY;
    if (!key) return [];
    const res = await fetch(BASE + "/orders" + qs({ session, limit: "20" }), { cache: "no-store", headers: { Authorization: `Bearer ${key}` } });
    return res.ok ? res.json() : [];
  },

  /** POST /orders/click with the server's key; the key never reaches the browser. */
  async click(body: {
    country: string; asset: string; who: BuyerType; venue: string;
    acknowledged?: boolean; mint?: string; query?: string; session?: string;
  }): Promise<{ id: string; redirect: string }> {
    const key = process.env.VESTAIL_API_KEY;
    if (!key) throw new ApiError(503, "not_configured", "VESTAIL_API_KEY is not set on this server.");
    const res = await fetch(BASE + "/orders/click", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "unavailable", json?.error?.message ?? "Click refused.");
    return json;
  },
};
