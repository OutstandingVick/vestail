import "server-only";

import type { Asset, BuyerType, Order, Category, Country, Matrix, ProductActivity, Resolution, Rule, TokenBoard, TokenSymbol } from "@/lib/types";

/**
 * The v2 API, called in-process.
 *
 * This used to fetch over HTTP from VESTAIL_API_URL, defaulting to
 * http://localhost:8787/v1. That default is unreachable from a deployed
 * function, so with the variable unset every signed-in page threw a
 * server-side exception — which is exactly what happened in production. The
 * Hono app is now called directly (see local-api.ts): same code, same spec
 * validation, no second service and no network.
 *
 * Caching is unchanged in intent. Rules are read fresh, because a compliance
 * answer should change the moment its rule does. Reference lists change only
 * with a deploy, so they are memoised for the lifetime of the function
 * instance rather than through Next's fetch cache, which no longer applies
 * now that nothing is fetched.
 */
import { callApi } from "./local-api.ts";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/*
 * Reference data is baked into the deployment, so a value read once is good
 * until the next deploy. The promise is cached, not the result, so concurrent
 * first calls share one trip through the API rather than racing.
 */
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

  /** One user's recorded Buy presses (GET /orders). */
  async orders(session: string, limit = 20): Promise<Order[]> {
    const safeLimit = Math.min(200, Math.max(1, Math.trunc(limit)));
    const res = await callApi("/orders" + qs({ session, limit: String(safeLimit) }));
    return res.ok ? res.json() : [];
  },

  /** POST /orders/click. The key is internal to this process and never reaches the browser. */
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
