import { ApiError } from "../errors.js";

/**
 * GET /derivatives[?q=] and GET /derivatives/{id}?country= — commodity price
 * exposure (Hyperliquid perpetuals), judged by the venue's rule. Every market
 * is instrument commodity_derivative: price exposure, never ownership.
 */
export function registerDerivatives(v1, { v, data }) {
  const { derivatives, countryByCode } = data;

  v.route(v1, "get", "/derivatives", (c, { params: { q } }) => c.json(q ? derivatives.find(q) : derivatives.list()));

  v.route(v1, "get", "/derivatives/{id}", (c, { params: { id, country } }) => {
    if (!countryByCode[country]) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);
    const m = derivatives.judge(id, country);
    if (!m) throw new ApiError(404, "unknown_market", `No market ${id}.`);
    return c.json(m);
  });
}
