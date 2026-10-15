import "server-only";

import { jupiterHeaders } from "@/lib/server/jupiter";
import { parseJupiterSnapshots, type QuoteByMint } from "@/lib/watchlist-quotes";

const JUPITER_SEARCH = "https://api.jup.ag/tokens/v2/search";

/** Read current token prices and 24-hour movement directly from Jupiter. */
export async function readWatchQuotes(mints: string[]): Promise<QuoteByMint> {
  const unique = [...new Set(mints)].slice(0, 100);
  if (!unique.length) return new Map();
  const response = await fetch(`${JUPITER_SEARCH}?query=${encodeURIComponent(unique.join(","))}`, {
    headers: jupiterHeaders(),
    next: { revalidate: 30 },
  });
  if (!response.ok) throw new Error(`Jupiter returned ${response.status}`);
  return parseJupiterSnapshots(await response.json());
}
