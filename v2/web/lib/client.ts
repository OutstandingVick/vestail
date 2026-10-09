"use client";

import { getAccessToken } from "@privy-io/react-auth";

/** fetch() to this app's own API routes with the signed-in user's Privy token. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, {
    ...init,
    headers,
  });
}

/** The error message an API route returned, or a fallback. */
export async function errorOf(res: Response, fallback = "Something went wrong."): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error ?? fallback;
}
