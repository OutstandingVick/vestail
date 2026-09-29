import { ApiError } from "../errors.js";

/** Append a ref tag the same way the core does. */
const tag = (url, ref) => url && url + (url.includes("?") ? "&" : "?") + ref;

/**
 * GET /venues/{asset}?country=&ref= — where to buy. Without ref the core's
 * tagging applies unchanged; ref overrides the tag value as the spec allows.
 * Both "partner_xyz" and "ref=partner_xyz" are accepted (API.md shows the latter).
 */
export function registerVenues(v1, { v, data }) {
  const { own, raw, nameById, countryByCode } = data;

  v.route(v1, "get", "/venues/{asset}", (c, { params: { asset, country, ref } }) => {
    const name = nameById[asset];
    if (!name) throw new ApiError(404, "unknown_asset", `No asset class with id ${asset}.`);
    if (country && !countryByCode[country]) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);

    if (!ref) return c.json(own.venues(name, country));

    const override = "ref=" + encodeURIComponent(ref.replace(/^ref=/, ""));
    const v = raw.venues.venues[name] || { default: [] };
    return c.json((v[country] || v.default || []).map(x => ({ ...x, url: tag(x.url, override) })));
  });
}
