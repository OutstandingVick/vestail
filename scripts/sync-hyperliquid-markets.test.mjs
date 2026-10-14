import assert from "node:assert/strict";
import test from "node:test";

import { MARKET_SPECS, merge, parseArgs, validateCategories, validateMeta, verifiedMarkets, verifyMarket } from "./sync-hyperliquid-markets.mjs";

const universe = Object.keys(MARKET_SPECS).map(coin => ({ name: `xyz:${coin}`, ...(coin === "VIX" ? { isDelisted: true } : {}) }));
const categories = new Map(Object.keys(MARKET_SPECS).map(coin => [`xyz:${coin}`, MARKET_SPECS[coin].category]));
const xyzAnnotation = { category: "indices", description: "XYZ100 tracks an index of 100 actively traded non-financial companies listed on a U.S. stock exchange." };

test("requires an explicit sync mode and normalizes market names", () => {
  assert.throws(() => parseArgs([]), /pass --all/);
  assert.deepEqual(parseArgs(["--markets", "xyz:sp500, nifty,SP500"]).markets, ["SP500", "NIFTY"]);
  assert.equal(parseArgs(["--all", "--dry-run"]).dryRun, true);
  assert.equal(parseArgs(["--list"]).list, true);
  assert.throws(() => parseArgs(["--guess"]), /unknown argument/);
  assert.throws(() => parseArgs(["--markets="]), /pass --all/);
});

test("validates the primary universe before using it", () => {
  assert.throws(() => validateMeta({}), /no universe/);
  assert.throws(() => validateMeta({ universe: [] }), /empty/);
  assert.throws(() => validateMeta({ universe: [{ name: "SP500" }] }), /malformed/);
  assert.throws(() => validateMeta({ universe: [null] }), /malformed/);
  assert.throws(() => validateMeta({ universe: [{ name: "xyz:SP500" }, { name: "xyz:SP500" }] }), /repeats/);
  assert.equal(validateMeta({ universe })[0].name, "xyz:SP500");
});

test("validates category rows before trusting them", () => {
  assert.throws(() => validateCategories({}), /not an array/);
  assert.throws(() => validateCategories([["xyz:SP500"]]), /malformed/);
  assert.throws(() => validateCategories([["xyz:SP500", null]]), /malformed/);
  assert.throws(() => validateCategories([["xyz:SP500", "indices"], ["xyz:SP500", "indices"]]), /repeat/);
});

test("refuses a requested market missing from the primary universe", () => {
  const result = verifyMarket("SP500", MARKET_SPECS.SP500, [], categories);
  assert.equal(result.ok, false);
  assert.match(result.why, /absent/);
});

test("refuses a category that disagrees with Hyperliquid", () => {
  const wrong = new Map(categories); wrong.set("xyz:SP500", "stocks");
  assert.match(verifyMarket("SP500", MARKET_SPECS.SP500, universe, wrong).why, /stocks/);
});

test("requires Hyperliquid's own description before naming XYZ100", () => {
  assert.match(verifyMarket("XYZ100", MARKET_SPECS.XYZ100, universe, categories, null).why, /no primary annotation/);
  assert.equal(verifyMarket("XYZ100", MARKET_SPECS.XYZ100, universe, categories, xyzAnnotation).ok, true);
});

test("keeps buyer-dependent index mappings unasserted", () => {
  assert.ok(Object.values(MARKET_SPECS).every(market => market.related_asset === null));
});

test("reviewed aliases are normalized for deterministic search", () => {
  assert.ok(Object.values(MARKET_SPECS).every(spec => spec.aliases.every(alias => alias === alias.toLowerCase() && alias.trim() === alias)));
});

test("merges additively and leaves unrelated markets intact", () => {
  const existing = { venue: { name: "Hyperliquid" }, markets: [{ id: "xyz:GOLD", coin: "GOLD" }] };
  const added = { id: "xyz:SP500", coin: "SP500", ...MARKET_SPECS.SP500 };
  const result = merge(existing, [added]);
  assert.equal(result.added, 1);
  assert.equal(result.data.markets[0].id, "xyz:GOLD");
  assert.equal(existing.markets.length, 1);
});

test("a verified correction updates the matching market only", () => {
  const existing = { markets: [{ id: "xyz:SP500", coin: "SP500", name: "Old name" }, { id: "xyz:GOLD", coin: "GOLD" }] };
  const corrected = { id: "xyz:SP500", coin: "SP500", ...MARKET_SPECS.SP500 };
  const result = merge(existing, [corrected]);
  assert.equal(result.updated, 1);
  assert.equal(result.data.markets[1].id, "xyz:GOLD");
});

test("rechecking unchanged data produces no catalogue churn", () => {
  const market = { id: "xyz:SP500", coin: "SP500", ...MARKET_SPECS.SP500 };
  const result = merge({ markets: [market] }, [market]);
  assert.deepEqual({ added: result.added, updated: result.updated }, { added: 0, updated: 0 });
});

test("a requested market that cannot be verified makes the batch incomplete", async () => {
  const request = async (type, extra) => {
    if (type === "meta") return { universe: [{ name: "xyz:SP500" }] };
    if (type === "perpCategories") return [["xyz:SP500", "indices"]];
    if (type === "perpAnnotation" && extra.coin === "xyz:SP500") return { category: "indices" };
  };
  const result = await verifiedMarkets(["SP500", "NIFTY"], request);
  assert.deepEqual(result.verified.map(market => market.coin), ["SP500"]);
  assert.equal(result.refused.length, 1);
});

test("verification reports a delisted universe entry honestly", async () => {
  const request = async type => type === "meta"
    ? { universe: [{ name: "xyz:VIX", isDelisted: true }] }
    : type === "perpCategories" ? [["xyz:VIX", "indices"]] : { category: "indices" };
  const result = await verifiedMarkets(["VIX"], request);
  assert.equal(result.verified[0].isDelisted, true);
});

test("an unreviewed market is refused even when Hyperliquid lists it", async () => {
  const request = async type => type === "meta"
    ? { universe: [{ name: "xyz:UNKNOWN" }] }
    : type === "perpCategories" ? [["xyz:UNKNOWN", "indices"]] : null;
  const result = await verifiedMarkets(["UNKNOWN"], request);
  assert.match(result.refused[0].why, /no reviewed/);
});
