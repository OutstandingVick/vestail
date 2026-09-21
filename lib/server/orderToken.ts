import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Binds an /execute call to an order this server approved.
 *
 * /api/swap/order checks eligibility before asking Jupiter for a transaction.
 * Without this token, /api/swap/execute would forward *any* signed
 * transaction under Vestail's Jupiter key — so anyone could route arbitrary
 * swaps through it, spending our quota and landing trades we never checked.
 * The token is an HMAC over the Jupiter requestId and an expiry, so it cannot
 * be forged or reused for a different order.
 */

const TTL_SECONDS = 120;

let devSecret: Buffer | undefined;

function secret(): Buffer {
  const configured = process.env.VESTAIL_ORDER_SECRET?.trim();
  if (configured) return Buffer.from(configured, "utf8");

  // A per-process secret only works when order and execute hit the same
  // process, which is true for `next dev` and false on serverless.
  if (process.env.NODE_ENV === "production") {
    throw new Error("VESTAIL_ORDER_SECRET is not set.");
  }
  devSecret ??= randomBytes(32);
  return devSecret;
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
