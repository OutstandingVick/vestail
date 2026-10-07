import "server-only";

/** JUPITER_API_KEY is optional and server-only; never a NEXT_PUBLIC_ variable. */
export function jupiterHeaders(): HeadersInit {
  const key = process.env.JUPITER_API_KEY?.trim();
  return key ? { "x-api-key": key } : {};
}
