import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { AssetSelector, BatchInput, CheckInput, EligibilityResult, Residency } from "./schemas.js";

const registry = new OpenAPIRegistry();
const ErrorResponse = registry.register("Error", z.object({ error: z.object({ code: z.string(), message: z.string() }) }));
const Eligibility = registry.register("Eligibility", EligibilityResult);
const Check = registry.register("CheckInput", CheckInput);
const Batch = registry.register("BatchInput", BatchInput);
registry.register("AssetSelector", AssetSelector);
registry.register("Residency", Residency);

const errorResponses = {
  400: { description: "Invalid request", content: { "application/json": { schema: ErrorResponse } } },
  401: { description: "Invalid or missing API key", content: { "application/json": { schema: ErrorResponse } } },
  429: { description: "Per-key rate limit exceeded", headers: { "Retry-After": { schema: { type: "integer" } } }, content: { "application/json": { schema: ErrorResponse } } },
};
const secured = [{ bearerAuth: [] }];

registry.registerPath({
  method: "post", path: "/check", summary: "Check one asset for a declared profile", security: secured,
  request: { body: { content: { "application/json": { schema: Check } } } },
  responses: { 200: { description: "Eligibility disclosure", content: { "application/json": { schema: Eligibility } } }, ...errorResponses },
});
registry.registerPath({
  method: "post", path: "/check/batch", summary: "Check up to 100 assets", security: secured,
  request: { body: { content: { "application/json": { schema: Batch } } } },
  responses: { 200: { description: "Eligibility disclosures", content: { "application/json": { schema: z.object({ results: z.array(Eligibility) }) } } }, ...errorResponses },
});
registry.registerPath({
  method: "get", path: "/assets", summary: "List all asset classes and token issuer versions for a profile", security: secured,
  request: { query: z.object({ country: z.string(), residency: Residency }) },
  responses: { 200: { description: "Assets with verdicts", content: { "application/json": { schema: z.object({ assets: z.array(z.object({ asset: z.record(z.string(), z.unknown()) }).and(EligibilityResult)) }) } } }, ...errorResponses },
});
registry.registerPath({
  method: "get", path: "/countries", summary: "List supported countries and sourced-rule coverage", security: secured,
  responses: { 200: { description: "Country coverage", content: { "application/json": { schema: z.object({ countries: z.array(z.object({ code: z.string(), name: z.string(), sourced: z.number(), unverified: z.number(), total: z.number() })) }) } } }, 401: errorResponses[401], 429: errorResponses[429] },
});
registry.registerPath({
  method: "get", path: "/rules/{id}", summary: "Read one rule and its available history", security: secured,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Rule detail", content: { "application/json": { schema: EligibilityResult.extend({ history: z.array(z.unknown()) }) } } }, 401: errorResponses[401], 404: { description: "Rule not found", content: { "application/json": { schema: ErrorResponse } } }, 429: errorResponses[429] },
});

registry.registerComponent("securitySchemes", "bearerAuth", { type: "http", scheme: "bearer", bearerFormat: "Vestail API key" });

export function publicOpenApi() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Vestail Eligibility API",
      version: "1.0.0",
      description: "Country, residency and asset eligibility disclosures backed by Vestail's existing rules engine. No personal data is accepted.",
    },
    servers: [{ url: "/api/v1" }],
  });
}
