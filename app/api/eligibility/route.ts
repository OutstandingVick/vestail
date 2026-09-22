import { NextResponse } from "next/server";

import { evaluate } from "@/lib/evaluate";
import { POLICIES } from "@/lib/policies";
import { getSymbolEntry, isAllowedSymbol } from "@/lib/registry";
import { RegionSchema, type EligibilityResponse } from "@/lib/types";

/**
 * GET /api/eligibility?symbol=NVDA&region=NG
 *
 * Every tokenized version of `symbol`, each with the verdict the sourced
 * policies give for the self-declared `region`. Real data: the same
 * evaluator and policy files the tests pin, not a mock.
 *
 * The answer only changes when the registry or a policy file does, so it is
 * cached at the edge for five minutes.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const symbol = (params.get("symbol") ?? "").toUpperCase();
  const region = RegionSchema.safeParse(params.get("region"));

  if (!isAllowedSymbol(symbol)) {
    return NextResponse.json({ error: "Unknown stock." }, { status: 404 });
  }
  if (!region.success) {
    return NextResponse.json({ error: "Unknown region." }, { status: 400 });
  }

  const body: EligibilityResponse = {
    symbol,
    region: region.data,
    versions: getSymbolEntry(symbol).representations.map((representation) => ({
      representation,
      verdict: evaluate(representation, region.data, POLICIES[representation.provider]),
    })),
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
