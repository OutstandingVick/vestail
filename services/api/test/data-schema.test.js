import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const read = f => JSON.parse(readFileSync(new URL(`../../../data/${f}`, import.meta.url)));
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(read("schema/schemas.json"));
const check = def => ajv.getSchema(`https://vestail.example/schemas#/$defs/${def}`);

test("data/countries.json matches the data schema", () => {
  const country = check("Country");
  for (const c of read("countries.json").countries) assert.ok(country(c), `${c.code}: ${ajv.errorsText(country.errors)}`);
});

test("the schema rejects malformed provenance", () => {
  const rule = check("Rule");
  assert.ok(rule({ status: 2, sources: [{ title: "Land Use Act 1978", url: "https://example.org/act" }], verified_at: "2026-09-29" }));
  assert.ok(!rule({ status: 2, sources: [{ title: "No url" }], verified_at: null }), "a source needs a url");
  assert.ok(!rule({ status: 2, sources: [], verified_at: "last week" }), "verified_at must be a date");
  assert.ok(!rule({ status: 2, sources: [] }), "verified_at must be present, even as null");
});

test("utility protocol rule files match the schema and are named after their protocol", async () => {
  const { readdirSync } = await import("node:fs");
  const protocol = check("Protocol");
  const dir = new URL("../../../data/utilities/protocols/", import.meta.url);
  for (const f of readdirSync(dir).filter(f => f.endsWith(".json"))) {
    const p = JSON.parse(readFileSync(new URL(f, dir)));
    assert.ok(protocol(p), `${f}: ${ajv.errorsText(protocol.errors)}`);
    assert.equal(`${p.protocol}.json`, f);
  }
});

test("the protocol schema rejects unsourced or malformed rules", () => {
  const protocol = check("Protocol");
  const base = { protocol: "x", name: "X", version: "2026-11-11.1", verifiedOn: "2026-11-11", todo: false };
  const rule = { id: "r", status: "eligible", regions: ["NG"], reason: "Read from the terms.", sourceUrl: "https://example.org/terms", sourceQuality: "primary" };
  assert.ok(protocol({ ...base, rules: [rule] }));
  assert.ok(!protocol({ ...base, rules: [{ ...rule, sourceUrl: undefined }] }), "a rule needs a source");
  assert.ok(!protocol({ ...base, rules: [{ ...rule, sourceUrl: "javascript:alert(1)" }] }), "sources are https");
  assert.ok(!protocol({ ...base, rules: [] }), "a non-placeholder needs rules");
  assert.ok(protocol({ ...base, todo: true, verifiedOn: null, rules: [] }), "a placeholder may be empty");
});

test("support.json matches the schema and offers no perps or leverage", () => {
  const support = read("utilities/support.json");
  const ok = check("Support");
  assert.ok(ok(support), ajv.errorsText(ok.errors));
  assert.ok(!ok({ version: "1", utilities: { perps: [] } }), "perps is not a utility");
});
