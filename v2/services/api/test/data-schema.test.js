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
