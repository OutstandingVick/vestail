import { ApiError } from "../errors.js";

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
