import { ApiError } from "../errors.js";

/**
 * POST /orders/click — record a Buy press and return the tagged redirect.
 * The redirect is only ever a url the rule lookup would list, so a
 * cannot_own cell (no venues) or a venue without an online url is refused.
 * Tagging is the core's; this route adds no ref logic of its own.
 */
export function registerOrders(v1, { v, data, clicks, auth }) {
  const { own, nameById, countryByCode } = data;

  // Authenticate before the body is validated, so callers without a key learn nothing.
  v1.use("/orders/*", async (c, next) => {
    c.set("partner", auth(c.req.header("Authorization")));
    await next();
  });

  v.route(v1, "post", "/orders/click", (c, { body }) => {
    const partner = c.get("partner");
    const { country, asset, who, venue, query, session } = body;

    const row = countryByCode[country];
    if (!row) throw new ApiError(400, "unknown_country", `Unknown country: ${country}.`);
    const name = nameById[asset];
    if (!name) throw new ApiError(400, "unknown_asset", `No asset class with id ${asset}.`);

    const status = row[who][own.ASSETS.indexOf(name)];
    const match = status ? own.venues(name, country).find(x => x.name === venue) : null;
    if (!match?.url) throw new ApiError(400, "validation", `${venue} is not a venue for ${asset} in ${country} for a ${who}.`);

    const click = clicks.record({ country, asset, who, venue, query, session, partner });
    return c.json({ id: click.id, redirect: match.url }, 201);
  });
}
