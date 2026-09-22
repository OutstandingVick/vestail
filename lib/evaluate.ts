/**
 * The eligibility evaluator: one representation, one self-declared region,
 * one policy file in; one verdict (or an explicit "not assessed") out.
 *
 * Pure and synchronous. No network, no clock except the timestamp it stamps,
 * no imports that execute at runtime — which is what lets the tests load this
 * file straight into Node.
 */

import type {
  Evidence,
  PolicyFile,
  PolicyRule,
  Region,
  RegistryRepresentation,
  SourceQuality,
  Verdict,
  VerdictStatus,
} from "@/lib/types";

const SEVERITY: Record<VerdictStatus, number> = {
  eligible: 0,
  conditional: 1,
  restricted: 2,
};

function applies(
  rule: PolicyRule,
  region: Region,
  symbol: string,
): boolean {
  if (!rule.regions.includes(region)) return false;
  return rule.symbols === undefined || rule.symbols.includes(symbol);
}

function toEvidence(rule: PolicyRule): Evidence {
  return {
    ruleId: rule.id,
    kind: rule.kind,
    reason: rule.reason,
    sourceUrl: rule.source_url,
    sourceQuality: rule.source_quality,
  };
}

/**
 * Returns null when the policy has no gate for this region and symbol.
 *
 * That null is deliberate and must reach the user as "not assessed". The
 * alternative — defaulting to `eligible` — would turn missing research into
 * a confident claim of permission.
 *
 * When several gates apply, the most severe decides. Every gate and note that
 * applies is kept as evidence, gates first, so the user sees all of it.
 */
export function evaluate(
  representation: RegistryRepresentation,
  region: Region,
  policy: PolicyFile,
  now: Date = new Date(),
): Verdict | null {
  if (policy.provider !== representation.provider) {
    throw new Error(
      `policy for ${policy.provider} applied to a ${representation.provider} token`,
    );
  }

  const matching = policy.rules.filter((r) =>
    applies(r, region, representation.symbol),
  );
  const gates = matching.filter(
    (r): r is Extract<PolicyRule, { kind: "gate" }> => r.kind === "gate",
  );
  if (gates.length === 0) return null;

  const status = gates.reduce<VerdictStatus>(
    (worst, g) => (SEVERITY[g.status] > SEVERITY[worst] ? g.status : worst),
    "eligible",
  );
  const deciding = gates.filter((g) => g.status === status);

  const sourceQuality: SourceQuality = deciding.some(
    (g) => g.source_quality === "secondary",
  )
    ? "secondary"
    : "primary";

  // Deciding gates, then any other gates, then notes.
  const ordered = [
    ...deciding,
    ...gates.filter((g) => g.status !== status),
    ...matching.filter((r) => r.kind === "note"),
  ];
  const evidence = ordered.map(toEvidence);

  return {
    mint: representation.mint,
    provider: representation.provider,
    status,
    reasons: evidence.map((e) => e.reason),
    policyVersion: policy.version,
    sourceUrl: deciding[0].source_url,
    sourceQuality,
    evidence,
    summary: deciding[0].short,
    // Only conditional gates carry one (the schema enforces it), so this is
    // set exactly when the verdict is conditional.
    ...(deciding[0].acknowledgement
      ? { acknowledgement: deciding[0].acknowledgement }
      : {}),
    evaluatedAt: now.toISOString(),
  };
}
