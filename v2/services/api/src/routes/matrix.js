import { ApiError } from "../errors.js";
import { resolutionOut } from "../shape.js";

/** GET /matrix — one row per country for a query and buyer type. */
export function registerMatrix(v1, { v, data }) {
  const { core, idByName, countryByCode } = data;

  v.route(v1, "get", "/matrix", (c, { params: { q = "", who, sort = "status", countries } }) => {
    let only = null;
    if (countries) {
      only = new Set(countries.split(",").map(s => s.trim().toUpperCase()).filter(Boolean));
      const unknown = [...only].filter(code => !countryByCode[code]);
      if (unknown.length) throw new ApiError(400, "unknown_country", `Unknown country: ${unknown.join(", ")}.`);
    }

    const m = core.matrix(q, who, { sortByStatus: sort === "status" });
    const rows = m.rows
      .filter(r => !only || only.has(r.code))
      .map(r => ({
        code: r.code, name: r.name, flag: r.flag, who: r.who,
        cells: r.cells.map(x => ({ asset: idByName[x.asset], index: x.index, status: x.statusKey })),
        summary: r.summary,
        cta: r.cta && { asset: idByName[r.cta.asset], status: r.cta.status, venues: r.cta.venues },
      }));

    return c.json({ query: q, who, resolution: resolutionOut(core.resolve(q), data), rows });
  });
}
