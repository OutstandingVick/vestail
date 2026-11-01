"use client";

import { getAccessToken } from "@privy-io/react-auth";

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

export async function errorOf(res: Response, fallback = "Something went wrong."): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error ?? fallback;
}
