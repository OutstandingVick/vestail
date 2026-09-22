/**
 * Policy and evaluator tests. Run with `npm test`.
 *
 * Plain .mjs on Node's built-in runner: the .ts modules under test are loaded
 * through Node's type stripping, so there is no test framework to install.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const { PolicyFileSchema, RegionSchema, VerdictSchema } = await import(
  new URL("../lib/types.ts", import.meta.url)
);
const { evaluate } = await import(new URL("../lib/evaluate.ts", import.meta.url));
const { REGION_ALLOWLIST } = await import(
  new URL("../lib/constants.ts", import.meta.url)
);

const readJson = (rel) =>
  JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));

const policyFiles = readdirSync(new URL("../policies/", import.meta.url))
  .filter((f) => f.endsWith(".json"))
  .sort();

const policies = Object.fromEntries(
  policyFiles.map((f) => {
    const policy = PolicyFileSchema.parse(readJson(`../policies/${f}`));
    return [policy.provider, policy];
  }),
);

const registry = readJson("../registry/representations.json");
const allReps = Object.values(registry.symbols).flatMap((s) => s.representations);

/* -------------------------------------------------------------------------- */

describe("policy files", () => {
  it("each declares the provider its filename names", () => {
    for (const f of policyFiles) {
      assert.equal(readJson(`../policies/${f}`).provider, f.replace(".json", ""));
    }
  });

  it("exist for every provider in the registry", () => {
    for (const rep of allReps) {
      assert.ok(policies[rep.provider], `no policy for ${rep.provider}`);
    }
  });

  it("use the same region list as the allowlist", () => {
    assert.deepEqual([...RegionSchema.options], [...REGION_ALLOWLIST]);
  });
});

describe("coverage", () => {
  it("every representation gets a valid verdict in every region", () => {
    for (const rep of allReps) {
      for (const region of REGION_ALLOWLIST) {
        const verdict = evaluate(rep, region, policies[rep.provider]);
        assert.ok(
          verdict,
          `${rep.provider} ${rep.symbol} has no gate for ${region}`,
        );
        VerdictSchema.parse(verdict);
      }
    }
  });
});

describe("researched verdicts (change deliberately, with the policy)", () => {
  const expected = {
    xstocks: { NG: "conditional", US: "restricted", DE: "conditional" },
    ondo: { NG: "conditional", US: "restricted", DE: "conditional" },
    backpack: { NG: "conditional", US: "restricted", DE: "restricted" },
    tessera: { NG: "conditional", US: "restricted", DE: "eligible" },
    prestocks: { NG: "conditional", US: "restricted", DE: "conditional" },
  };

  for (const rep of registry.symbols.SPCX.representations) {
    it(`SPCX via ${rep.provider}`, () => {
      for (const region of REGION_ALLOWLIST) {
        assert.equal(
          evaluate(rep, region, policies[rep.provider]).status,
          expected[rep.provider][region],
          `${rep.provider} in ${region}`,
        );
      }
    });
  }

  it("marks the inferred Backpack DE gate as secondary", () => {
    const rep = registry.symbols.SPCX.representations.find(
      (r) => r.provider === "backpack",
    );
    assert.equal(evaluate(rep, "DE", policies.backpack).sourceQuality, "secondary");
    assert.equal(evaluate(rep, "NG", policies.backpack).sourceQuality, "primary");
  });

  it("attaches symbol-scoped notes only to their symbol", () => {
    const tSpaceX = registry.symbols.SPCX.representations.find(
      (r) => r.provider === "tessera",
    );
    const tOpenAI = registry.symbols.OPENAI.representations.find(
      (r) => r.provider === "tessera",
    );
    const ids = (rep) =>
      evaluate(rep, "DE", policies.tessera).evidence.map((e) => e.ruleId);
    assert.ok(ids(tSpaceX).includes("spacex-listed-no-redemption-date"));
    assert.ok(!ids(tOpenAI).includes("spacex-listed-no-redemption-date"));
  });
});

/* -------------------------------------------------------------------------- */

describe("evaluate()", () => {
  const rep = { ...registry.symbols.SPCX.representations[0], provider: "ondo" };
  const url = "https://example.com/terms";
  const policy = (rules) =>
    PolicyFileSchema.parse({
      provider: "ondo",
      version: "2026-01-01.1",
      reviewedAt: "2026-01-01",
      rules,
    });
  const gate = (id, status, extra = {}) => ({
    id,
    kind: "gate",
    status,
    regions: ["NG"],
    reason: `${id} reason`,
    short: `${id} short`,
    ...(status === "conditional"
      ? { acknowledgement: { limit: `${id} limit`, requires: `${id} requires` } }
      : {}),
    source_url: url,
    source_quality: "primary",
    ...extra,
  });
  const note = (id, extra = {}) => ({
    id,
    kind: "note",
    regions: ["NG"],
    reason: `${id} reason`,
    source_url: url,
    source_quality: "primary",
    ...extra,
  });

  it("returns null, never eligible, when no gate applies", () => {
    assert.equal(evaluate(rep, "NG", policy([note("only-a-note")])), null);
    assert.equal(evaluate(rep, "US", policy([gate("ng-only", "eligible")])), null);
  });

  it("lets the most severe gate decide and lists it first", () => {
    const v = evaluate(
      rep,
      "NG",
      policy([gate("ok", "eligible"), gate("bad", "restricted"), gate("meh", "conditional")]),
    );
    assert.equal(v.status, "restricted");
    assert.deepEqual(v.evidence.map((e) => e.ruleId), ["bad", "ok", "meh"]);
    assert.equal(v.reasons.length, 3);
  });

  it("never lets a note change the status", () => {
    const v = evaluate(rep, "NG", policy([gate("ok", "eligible"), note("scary")]));
    assert.equal(v.status, "eligible");
    assert.deepEqual(v.evidence.map((e) => e.kind), ["gate", "note"]);
  });

  it("ignores rules scoped to other symbols", () => {
    const v = evaluate(
      rep,
      "NG",
      policy([gate("ok", "eligible"), gate("other", "restricted", { symbols: ["NVDA"] })]),
    );
    assert.equal(v.status, "eligible");
  });

  it("is only as certain as its weakest deciding gate", () => {
    const v = evaluate(
      rep,
      "NG",
      policy([
        gate("a", "conditional"),
        gate("b", "conditional", { source_quality: "secondary" }),
        gate("c", "eligible"),
      ]),
    );
    assert.equal(v.sourceQuality, "secondary");
  });

  it("ignores a secondary source on a gate that did not decide", () => {
    const v = evaluate(
      rep,
      "NG",
      policy([gate("a", "restricted"), gate("b", "eligible", { source_quality: "secondary" })]),
    );
    assert.equal(v.sourceQuality, "primary");
  });

  it("refuses a policy for a different provider", () => {
    assert.throws(() =>
      evaluate({ ...rep, provider: "xstocks" }, "NG", policy([gate("x", "eligible")])),
    );
  });

  it("rejects a note that carries a status", () => {
    assert.throws(() => policy([{ ...note("n"), status: "restricted" }]));
  });

  it("requires an acknowledgement on conditional gates, and only there", () => {
    const { acknowledgement, ...bare } = gate("c", "conditional");
    assert.ok(acknowledgement);
    assert.throws(() => policy([bare]));
    assert.throws(() =>
      policy([gate("e", "eligible", { acknowledgement: { limit: "x", requires: "y" } })]),
    );
  });

  it("requires a short reason of at most 90 characters on gates", () => {
    const { short, ...noShort } = gate("g", "eligible");
    assert.ok(short);
    assert.throws(() => policy([noShort]));
    assert.throws(() => policy([gate("g", "eligible", { short: "x".repeat(91) })]));
  });

  it("rejects duplicate rule ids", () => {
    assert.throws(() => policy([gate("dup", "eligible"), gate("dup", "restricted")]));
  });
});
