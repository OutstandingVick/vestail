import { NextResponse } from "next/server";

import { isAllowedSymbol } from "@/lib/registry";
import { getSymbolView } from "@/lib/server/symbolView";

/**
 * GET /api/representations/:symbol
 *
 * Every representation of one allowlisted symbol with live market data. This
 * is the only path by which Pyth and Jupiter are called, so their API keys
 * never leave the server.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const symbol = (await params).symbol.toUpperCase();

  if (!isAllowedSymbol(symbol)) {
    return NextResponse.json(
      { error: `${symbol} is not a symbol Vestail resolves.` },
      { status: 404 },
    );
  }

  const view = await getSymbolView(symbol);

  return NextResponse.json(view, {
    headers: {
      // A short shared cache lets Vercel's CDN absorb repeat views, which
      // matters while Jupiter is keyless and rate-limited per IP.
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
    },
  });
}
