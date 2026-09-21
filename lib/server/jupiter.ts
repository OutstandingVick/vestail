import "server-only";

/**
 * Jupiter reads, server-side.
 *
 * JUPITER_API_KEY is optional. Keyless requests work today but sit on an
 * undocumented rate limit (the registry sync hits 429s within a few calls),
 * so the key is sent whenever it is configured and nothing else changes.
 * It must never be a NEXT_PUBLIC_ variable: that would inline it into the
 * client bundle.
 */

const JUPITER_TOKENS_API = "https://api.jup.ag/tokens/v2";

export function jupiterHeaders(): HeadersInit {
  const key = process.env.JUPITER_API_KEY?.trim();
  return key ? { "x-api-key": key } : {};
}

export interface TokenMarket {
  usdPrice: number | null;
  liquidityUsd: number | null;
}

export type TokenMarketResult =
  | { status: "ok"; markets: Map<string, TokenMarket> }
  | { status: "error"; message: string };

/** Price and liquidity for up to 100 mints in a single request. */
export async function getTokenMarkets(
  mints: string[],
): Promise<TokenMarketResult> {
  if (mints.length === 0) return { status: "ok", markets: new Map() };

  try {
    const res = await fetch(
      `${JUPITER_TOKENS_API}/search?query=${mints.slice(0, 100).join(",")}`,
      { headers: jupiterHeaders(), next: { revalidate: 15 } },
    );
    if (!res.ok) {
      return {
        status: "error",
        message:
          res.status === 429
            ? "Jupiter rate-limited the request."
            : `Jupiter returned HTTP ${res.status}.`,
      };
    }

    const tokens = (await res.json()) as Array<{
      id: string;
      usdPrice?: number | null;
      liquidity?: number | null;
    }>;
    return {
      status: "ok",
      markets: new Map(
        tokens.map((t) => [
          t.id,
          { usdPrice: t.usdPrice ?? null, liquidityUsd: t.liquidity ?? null },
        ]),
      ),
    };
  } catch (cause) {
    return {
      status: "error",
      message:
        cause instanceof Error ? cause.message : "Jupiter request failed.",
    };
  }
}
