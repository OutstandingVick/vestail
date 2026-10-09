import type { MatrixRow, Status } from "@/lib/types";

/**
 * Discovery from the matrix alone: what a buyer can own at home that most
 * countries don't allow, what is within reach (conditional), and what they
 * can't own at home but could elsewhere. No invented facts: every item is a
 * verdict the API already gives, compared across countries.
 */
export interface Discovery {
  rare: { asset: string; status: Status; openIn: number }[];
  withinReach: { asset: string; openIn: number }[];
  elsewhere: { asset: string; countries: { code: string; name: string; flag: string }[] }[];
}

export function discover(rows: MatrixRow[], home: string): Discovery {
  const mine = rows.find(r => r.code === home);
  if (!mine) return { rare: [], withinReach: [], elsewhere: [] };
  const openCount = (asset: string) => rows.filter(r => r.cells.find(c => c.asset === asset)?.status === "can_own").length;
  const cells = mine.cells;

  // Can own here but not everywhere: the fewer countries that allow it, the
  // bigger the surprise. The six least common lead.
  const rare = cells.filter(c => c.status === "can_own")
    .map(c => ({ asset: c.asset, status: c.status, openIn: openCount(c.asset) }))
    .filter(c => c.openIn < rows.length)
    .sort((a, b) => a.openIn - b.openIn)
    .slice(0, 6);

  const withinReach = cells.filter(c => c.status === "conditional")
    .map(c => ({ asset: c.asset, openIn: openCount(c.asset) }))
    .sort((a, b) => a.openIn - b.openIn);

  const elsewhere = cells.filter(c => c.status === "cannot_own").map(c => ({
    asset: c.asset,
    countries: rows.filter(r => r.code !== home && r.cells.find(x => x.asset === c.asset)?.status === "can_own")
      .map(r => ({ code: r.code, name: r.name, flag: r.flag })),
  })).filter(e => e.countries.length);

  return { rare, withinReach, elsewhere };
}
