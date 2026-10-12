import "server-only";

import type { CoverageCell } from "@/lib/admin-types";
import { api } from "@/lib/server/api";
import type { BuyerType, Status } from "@/lib/types";

const zero = (): Record<Status, number> => ({ can_own: 0, conditional: 0, cannot_own: 0 });

export async function productCoverage(): Promise<CoverageCell[]> {
  const countries = await api.countries();
  const buyers: BuyerType[] = ["citizen", "foreigner"];
  const matrices = await Promise.all(buyers.map(who => api.matrix({ who })));
  return matrices.flatMap((matrix, index) => matrix.rows.map(row => ({
    country: row.code,
    name: countries.find(country => country.code === row.code)?.name ?? row.name,
    who: buyers[index],
    totals: { ...zero(), ...row.summary },
  })));
}
