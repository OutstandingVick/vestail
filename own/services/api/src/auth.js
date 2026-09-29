import { createHash, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors.js";

const digest = s => createHash("sha256").update(s).digest();

/** API keys from OWN_API_KEYS (comma-separated). No keys configured means no key is accepted. */
export const keysFromEnv = () => (process.env.OWN_API_KEYS || "").split(",").map(s => s.trim()).filter(Boolean);

/**
 * Check `Authorization: Bearer <key>` and return which key matched (its index),
 * so clicks can be attributed to a partner without storing the key itself.
 */
export function createAuth(keys) {
  const hashes = keys.map(digest);
  return header => {
    const m = /^Bearer\s+(.+)$/i.exec(header || "");
    if (m) {
      const h = digest(m[1].trim());
      const i = hashes.findIndex(k => timingSafeEqual(k, h));
      if (i >= 0) return `key_${i}`;
    }
    throw new ApiError(401, "unauthorized", "A valid API key is required: Authorization: Bearer <key>.");
  };
}
