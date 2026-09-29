import { STATUS } from "@own/core";
import { ApiError } from "../errors.js";

/** GET /rules/{country}[/{asset}] — rule lookups for one country. */
export function registerRules(v1, { v, data }) {
  const { own, countryByCode } = data;

  const countryOf = code => {
    const c = countryByCode[code];
    if (!c) throw new ApiError(404, "unknown_country", `No rules for country ${code}.`);
    return c;
  };

  v.route(v1, "get", "/rules/{country}", (c, { params: { country, who } }) => {
    const row = countryOf(country)[who];
    const rules = Object.fromEntries(own.ASSETS.map((name, i) => [data.idByName[name], STATUS[row[i]]]));
    return c.json({ country, who, rules });
  });
}
