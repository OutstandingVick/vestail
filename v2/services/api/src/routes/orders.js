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
  const { core, nameById, countryByCode } = data;

  // Authenticate before the body is validated, so callers without a key learn nothing.
  v1.use("/orders/*", async (c, next) => {
    c.set("partner", auth(c.req.header("Authorization")));
    await next();
  });

  v.route(v1, "post", "/orders/click", (c, { body }) => {
    const partner = c.get("partner");
    const { country, asset, who, venue, query, session, acknowledged } = body;

    const row = countryByCode[country];
    if (!row) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);
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
}
