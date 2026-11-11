import { Hono } from "hono";
import { ApiError } from "../errors.js";
import { partnerAccess } from "./access.js";
import { createEligibility } from "./eligibility.js";
import { etag } from "./etag.js";
import { publicOpenApi } from "./openapi.js";
import { AssetsQuery, BatchInput, CheckInput, RuleParams, UtilitiesQuery, parse } from "./schemas.js";
import { createUtilitiesService } from "./utilities.js";

const validated = (schema, value) => {
  const result = parse(schema, value);
  if (result?.error) throw new ApiError(400, "validation_error", result.error.message);
  return result;
};

const jsonBody = async c => {
  try { return await c.req.json(); }
  catch { throw new ApiError(400, "validation_error", "request: A valid JSON body is required."); }
};

export function createPublicApi({ data, keyStore, accessNow, live }) {
  const api = new Hono();
  const eligibility = createEligibility(data);
  const utilities = createUtilitiesService(data, live);

  api.use("*", partnerAccess({ store: keyStore, now: accessNow }));
  api.use("*", etag);

  api.get("/openapi.json", c => c.json(publicOpenApi()));
  api.post("/check", async c => c.json(eligibility.check(validated(CheckInput, await jsonBody(c)))));
  api.post("/check/batch", async c => {
    const { checks } = validated(BatchInput, await jsonBody(c));
    return c.json({ results: checks.map(eligibility.check) });
  });
  api.get("/assets", c => {
    const { country, residency } = validated(AssetsQuery, c.req.query());
    return c.json({ assets: eligibility.assets(country, residency) });
  });
  api.get("/countries", c => c.json({ countries: eligibility.countries() }));
  api.get("/utilities", async c => c.json(await utilities.utilities(validated(UtilitiesQuery, c.req.query()))));
  api.get("/rules/:id", c => {
    const { id } = validated(RuleParams, c.req.param());
    return c.json(eligibility.rule(id));
  });
  return api;
}
