import { STATUS } from "@vestail/core";
import { ApiError } from "../errors.js";

/** GET /rules/{country}[/{asset}] — rule lookups for one country. */
export function registerRules(v1, { v, data }) {
  const { core, countryByCode } = data;

  const countryOf = code => {
    const c = countryByCode[code];
    if (!c) throw new ApiError(404, "unknown_country", `No rules for country ${code}.`);
    return c;
  };

  v.route(v1, "get", "/rules/{country}", (c, { params: { country, who } }) => {
    const row = countryOf(country)[who];
    const rules = Object.fromEntries(core.ASSETS.map((name, i) => [data.idByName[name], STATUS[row[i]]]));
    return c.json({ country, who, rules });
  });

  v.route(v1, "get", "/rules/{country}/{asset}", (c, { params: { country, asset, who } }) => {
    countryOf(country);
    const name = data.nameById[asset];
    if (!name) throw new ApiError(404, "unknown_asset", `No asset class with id ${asset}.`);
    const { status, statusKey, sources, verified_at } = core.rule(country, who, name);
    // Nothing is routed for a prohibited cell, matching the core's matrix cta.
    const venues = status ? core.venues(name, country) : [];
    return c.json({ country, asset, who, status: statusKey, venues, sources, verified_at });
  });
}
