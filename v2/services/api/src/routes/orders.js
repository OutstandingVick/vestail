import { ApiError } from "../errors.js";

/**
 * POST /orders/click — record a Buy press and return the tagged redirect.
 * The redirect is only ever a url the rule lookup would list, so a
 * cannot_own cell (no venues) or a venue without an online url is refused.
 * A conditional rule is only routed once the buyer has acknowledged the
 * condition (acknowledged: true), as in Vestail v1; the page's checkbox is a
 * convenience, this check is the guarantee.
 * Tagging is the core's; this route adds no ref logic of its own.
 */
export function registerOrders(v1, { v, data, clicks, auth }) {
  const { core, tokens, nameById, idByName, countryByCode } = data;

  // Authenticate before the body is validated, so callers without a key learn nothing.
  v1.use("/orders/*", async (c, next) => {
    c.set("partner", auth(c.req.header("Authorization")));
    await next();
  });

  /** GET /orders?session= — one buyer's recorded Buy presses, for their own history. */
  v.route(v1, "get", "/orders", (c, { params: { session, limit } }) => {
    const rows = clicks.bySession(session, c.get("partner"), limit ?? 50);
    return c.json(rows.map(x => ({
      id: x.id, at: new Date(x.at).toISOString(), country: x.country, asset: x.asset, who: x.who, venue: x.venue,
      ...(x.mint ? { mint: x.mint, chain: x.chain ?? "solana" } : {}), acknowledged: !!x.acknowledged,
    })));
  });

  v.route(v1, "post", "/orders/click", (c, { body }) => {
    const partner = c.get("partner");
    const { country, asset, who, venue, query, session, acknowledged, mint } = body;

    const row = countryByCode[country];
    if (!row) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);
    if (mint) return swapClick(c, { partner, country, asset, who, venue, query, session, acknowledged, mint });
    const name = nameById[asset];
    if (!name) throw new ApiError(400, "unknown_asset", `No asset class with id ${asset}.`);

    const status = row[who][core.ASSETS.indexOf(name)];
    const match = status ? core.venues(name, country).find(x => x.name === venue) : null;
    if (!match?.url) throw new ApiError(400, "validation", `${venue} is not a venue for ${asset} in ${country} for a ${who}.`);
    if (status === 1 && acknowledged !== true)
      throw new ApiError(400, "acknowledgement_required", `${asset} is conditional in ${country} for a ${who}; the buyer must acknowledge the condition first.`);

    const click = clicks.record({ country, asset, who, venue, query, session, partner, acknowledged: status === 1 });
    return c.json({ id: click.id, redirect: match.url }, 201);
  });

  /**
   * A tokenised version bought onchain: through Jupiter on Solana, KyberSwap on
   * the EVM chains. Judged by the token
   * verdict (issuer capped by class), never by the class rule alone: not
   * assessed and cannot_own are refused, conditional needs the acknowledgement.
   * The asset sent must be the class that governs the token in that country.
   */
  function swapClick(c, { partner, country, asset, who, venue, query, session, acknowledged, mint }) {
    const found = tokens.token(mint, country, who, core);
    if (!found) throw new ApiError(400, "unknown_mint", `Vestail does not know the token ${mint}.`);
    if (idByName[found.asset] !== asset)
      throw new ApiError(400, "validation", `${mint} is governed by ${idByName[found.asset]} in ${country}, not ${asset}.`);
    const t = found.token;
    const route = t.chain === "solana" ? "Jupiter" : "KyberSwap";
    if (venue !== route) throw new ApiError(400, "validation", `${t.chain_name} tokens are routed through ${route}.`);
    if (!t.assessed) throw new ApiError(400, "not_assessed", `${t.token_symbol} has not been assessed for ${country}; it is not routed.`);
    if (t.status === "cannot_own") throw new ApiError(400, "validation", `${t.token_symbol} cannot be owned in ${country} by a ${who}.`);
    if (t.status === "conditional" && acknowledged !== true)
      throw new ApiError(400, "acknowledgement_required", `${t.token_symbol} is conditional in ${country} for a ${who}; the buyer must acknowledge the condition first.`);
    const click = clicks.record({ country, asset, who, venue, query, session, partner, mint: t.address, chain: t.chain, acknowledged: t.status === "conditional" });
    const redirect = t.chain === "solana"
      ? `https://jup.ag/swap/USDC-${t.address}?ref=vestail`
      : `https://kyberswap.com/swap/${t.chain}?outputCurrency=${t.address}&ref=vestail`;
    return c.json({ id: click.id, redirect }, 201);
  }
}
