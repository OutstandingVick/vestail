import "server-only";

export function jupiterHeaders(): HeadersInit {
  const key = process.env.JUPITER_API_KEY?.trim();
  return key ? { "x-api-key": key } : {};
}
