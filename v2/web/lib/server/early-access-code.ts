import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const EARLY_ACCESS_COOKIE = "vestail_early_access";
const AUTH_TTL_SECONDS = 60 * 60 * 24;

function secret() {
  const value = process.env.VESTAIL_INVITE_SECRET || (process.env.NODE_ENV !== "production" ? "vestail-local-invite-secret" : "");
  if (!value) throw new Error("VESTAIL_INVITE_SECRET is required in production.");
  return value;
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(expiresAt: number, inviteHash: string) {
  return createHmac("sha256", secret()).update(`vestail-invite:${expiresAt}:${inviteHash}`).digest("hex");
}

export function createEarlyAccessAuthorization(inviteHash: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + AUTH_TTL_SECONDS;
  return { value: `${expiresAt}.${inviteHash}.${signature(expiresAt, inviteHash)}`, maxAge: AUTH_TTL_SECONDS };
}

export function readEarlyAccessAuthorization(candidate: string | undefined) {
  if (!candidate) return false;
  const [rawExpiry, inviteHash, suppliedSignature] = candidate.split(".");
  const expiresAt = Number(rawExpiry);
  const valid = Number.isSafeInteger(expiresAt)
    && expiresAt > Math.floor(Date.now() / 1000)
    && /^[a-f0-9]{64}$/.test(inviteHash ?? "")
    && Boolean(suppliedSignature)
    && equal(suppliedSignature, signature(expiresAt, inviteHash));
  return valid ? inviteHash : false;
}

export function validEarlyAccessCookie(candidate: string | undefined) {
  return Boolean(readEarlyAccessAuthorization(candidate));
}
