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
