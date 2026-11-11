import { test } from "node:test";
import assert from "node:assert/strict";
import { loadData } from "../src/data.js";

test("every asset name maps to an id and back", () => {
  const { raw, idByName, nameById } = loadData();
  assert.equal(raw.assets.length, 20);
  for (const a of raw.assets) assert.equal(nameById[idByName[a.name]], a.name);
});

test("the API loads utility rules: Jupiter and Meteora sourced, lenders placeholders", async () => {
  const { loadData } = await import("../src/data.js");
  const { utilities } = loadData();
  assert.equal(utilities.protocols.jupiter.todo, false);
  assert.equal(utilities.protocols.meteora.todo, false);
  for (const p of ["kamino", "marginfi", "save"]) assert.equal(utilities.protocols[p].rules.length, 0);
});
