import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const Residency = z.enum(["citizen", "resident", "foreigner"]);
export const Verdict = z.enum(["eligible", "conditional", "restricted", "unverified"]);

export const AssetSelector = z.object({
  class: z.string().trim().min(1),
  symbol: z.string().trim().min(1).optional(),
  id: z.string().trim().min(1).optional(),
}).strict();

export const CheckInput = z.object({
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, "must be an ISO 3166-1 alpha-2 code"),
  residency: Residency,
  asset: AssetSelector,
}).strict();

export const BatchInput = z.object({
  checks: z.array(CheckInput).min(1).max(100),
}).strict();

export const AssetsQuery = z.object({
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, "must be an ISO 3166-1 alpha-2 code"),
  residency: Residency,
}).strict();

export const RuleParams = z.object({ id: z.string().trim().min(1) });

export const Source = z.object({ label: z.string(), url: z.string().url() });

export const EligibilityResult = z.object({
  ruleId: z.string(),
  verdict: Verdict,
  reasons: z.array(z.string()),
  conditions: z.array(z.string()),
  sources: z.array(Source),
  lastVerified: z.string().nullable(),
  ruleVersion: z.string(),
  disclaimer: z.string(),
});

export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue.path.length ? issue.path.join(".") : "request";
  return { error: { field, message: `${field}: ${issue.message}` } };
}

export const UtilitiesQuery = z.object({
  asset: z.string().trim().min(1).max(64),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, "must be an ISO 3166-1 alpha-2 code"),
  residency: Residency,
}).strict();

export const UtilityName = z.enum(["hold", "trade", "lend", "borrow", "earn"]);

export const UtilityOption = z.object({
  protocol: z.string(),
  name: z.string(),
  version: z.string(),
  verifiedOn: z.string().nullable(),
  verdict: Verdict,
  protocolVerdict: Verdict,
  holdVerdict: Verdict,
  reasons: z.array(z.string()),
  sources: z.array(z.object({ label: z.string(), url: z.string().url(), quality: z.string().optional() })),
  action: z.string(),
  pairs: z.array(z.string()),
  pools: z.array(z.string()),
  risk: z.enum(["liquidation", "impermanent_loss"]).nullable(),
  actionsEnabled: z.boolean(),
  acknowledgementRequired: z.boolean(),
  live: z.record(z.string(), z.unknown()).nullable(),
  liveError: z.string().optional(),
});

export const Utility = z.object({
  utility: UtilityName,
  verdict: Verdict,
  options: z.array(UtilityOption),
  actionsEnabled: z.boolean(),
  acknowledgementRequired: z.boolean(),
  risk: z.enum(["liquidation", "impermanent_loss"]).nullable(),
  reasons: z.array(z.string()).optional(),
});

export const UtilitiesResult = z.object({
  country: z.string(),
  residency: Residency,
  versions: z.array(z.object({
    asset: z.object({ symbol: z.string(), id: z.string(), tokenSymbol: z.string(), name: z.string(), issuer: z.string(), chain: z.string(), instrument: z.string() }),
    utilities: z.array(Utility),
  })),
  disclaimer: z.string(),
});
