import { UtilitiesPanel } from "@/components/UtilitiesPanel";
import { api, ApiError } from "@/lib/server/api";
import type { BuyerType } from "@/lib/types";

/** Server side of the Utilities tab: reads /api/v1/utilities for the buyer's declared profile. */
export async function UtilitiesTab({ symbol, country, who, cleanHref, conditions }: {
  symbol: string; country: string; who: BuyerType; cleanHref: string; conditions: Record<string, string[]>;
}) {
  try {
    const data = await api.utilities(symbol, country, who);
    return <UtilitiesPanel data={data} conditions={conditions} buyHref={t => `${cleanHref}?buy=${encodeURIComponent(t)}`} />;
  } catch (e) {
    return <p role="alert" className="text-sm text-cannot">Couldn&apos;t load utilities{e instanceof ApiError ? `: ${e.message}` : ""}.</p>;
  }
}
