import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.VESTAIL_INVITE_SECRET || (process.env.NODE_ENV !== "production" ? "vestail-local-invite-secret" : "");
  if (!secret) throw new Error("VESTAIL_INVITE_SECRET is required to store retrievable invitation codes.");
  return createHash("sha256").update(`vestail:invite-code:v1:${secret}`).digest();
}

export function encryptInviteCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptInviteCode(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const [version, iv, tag, data] = value.split(".");
    if (version !== "v1" || !iv || !tag || !data) return undefined;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch { return undefined; }
}
