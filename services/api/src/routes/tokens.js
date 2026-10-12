import { ApiError } from "../errors.js";

/**
 * GET /tokens and GET /tokens/{symbol} — the tokenised versions of an asset
 * (carried over from Vestail v1) and their verdicts for one country and buyer
 * type. Each token's issuer verdict is capped by the v2 class rule; a token
 * with no issuer gate for the country is not assessed (status null), never
 * eligible. The judging is the core's (packages/core/tokens.js); this route
 * only maps it onto the contract.
 */
export function registerTokens(v1, { v, data }) {
  const { core, tokens, idByName, countryByCode } = data;

  v.route(v1, "get", "/tokens", c => c.json(tokens.list()));

  v.route(v1, "get", "/tokens/{symbol}", (c, { params: { symbol, country, who } }) => {
    if (!countryByCode[country]) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);
    const b = tokens.board(symbol, country, who, core);
    if (!b) throw new ApiError(404, "unknown_symbol", `No tokenised versions of ${symbol}.`);
    return c.json({ ...b, asset: idByName[b.asset] });
  });
}
