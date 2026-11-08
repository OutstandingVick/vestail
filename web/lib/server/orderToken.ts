import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// HMAC the Jupiter request ID and expiry so /execute accepts only approved orders.

const TTL_SECONDS = 120;

// Next bundles order and execute separately; globalThis shares the development secret.
const globalForSecret = globalThis as { __vestailDevOrderSecret?: Buffer };

function secret(): Buffer {
  const configured = process.env.VESTAIL_ORDER_SECRET?.trim();
  if (configured) return Buffer.from(configured, "utf8");

  if (process.env.NODE_ENV === "production") {
    throw new Error("VESTAIL_ORDER_SECRET is not set.");
  }
  globalForSecret.__vestailDevOrderSecret ??= randomBytes(32);
  return globalForSecret.__vestailDevOrderSecret;
}

export function orderSigningReady(): boolean {
  try {
    secret();
    return true;
  } catch {
    return false;
  }
}

function mac(requestId: string, expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(`${requestId}.${expiresAt}`)
    .digest("base64url");
}

export function signOrder(requestId: string, now = Date.now()): string {
  const expiresAt = Math.floor(now / 1000) + TTL_SECONDS;
  return `${expiresAt}.${mac(requestId, expiresAt)}`;
}

export function verifyOrder(
  token: string,
  requestId: string,
  now = Date.now(),
): boolean {
  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isInteger(expiresAt) || !signature) return false;
  if (expiresAt < Math.floor(now / 1000)) return false;

  const expected = Buffer.from(mac(requestId, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
