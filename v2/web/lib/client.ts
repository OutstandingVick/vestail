"use client";

import { getAccessToken } from "@privy-io/react-auth";

/** fetch() to this app's own API routes with the signed-in user's Privy token. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

/** The error message an API route returned, or a fallback. */
export async function errorOf(res: Response, fallback = "Something went wrong."): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error ?? fallback;
}
