import { ApiError } from "../errors.js";

const tag = (url, ref) => url && url + (url.includes("?") ? "&" : "?") + ref;

export function registerVenues(v1, { v, data }) {
  const { core, raw, nameById, countryByCode } = data;

  v.route(v1, "get", "/venues/{asset}", (c, { params: { asset, country, ref } }) => {
    const name = nameById[asset];
    if (!name) throw new ApiError(404, "unknown_asset", `No asset class with id ${asset}.`);
    if (country && !countryByCode[country]) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);

    if (!ref) return c.json(core.venues(name, country));

    const override = "ref=" + encodeURIComponent(ref.replace(/^ref=/, ""));
    const v = raw.venues.venues[name] || { default: [] };
    return c.json((v[country] || v.default || []).map(x => ({ ...x, url: tag(x.url, override) })));
  });
}
