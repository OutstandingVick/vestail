import { createHash, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors.js";

const digest = s => createHash("sha256").update(s).digest();

export const keysFromEnv = () => (process.env.VESTAIL_API_KEYS || "").split(",").map(s => s.trim()).filter(Boolean);

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
