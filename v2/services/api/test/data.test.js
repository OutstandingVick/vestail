import { test } from "node:test";
import assert from "node:assert/strict";
import { loadData } from "../src/data.js";

test("every asset name maps to an id and back", () => {
  const { raw, idByName, nameById } = loadData();
  assert.equal(raw.assets.length, 20);
  for (const a of raw.assets) assert.equal(nameById[idByName[a.name]], a.name);
});
