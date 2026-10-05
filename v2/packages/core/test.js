import { readFileSync } from "node:fs";
import { createVestail } from "./index.js";
const load = f => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url)));
const core = createVestail({ assets: load("assets.json").assets, categories: load("categories.json"), aliases: load("aliases.json"),
  entities: load("entities.json"), countries: load("countries.json"), venues: load("venues.json") });
const cases = [["Google", "entity"], ["tesla shares", "entity"], ["a house", "alias"], ["stocks", "alias"], ["commodities", "alias"], ["regulated sectors", "category"], ["foreign eq", "asset"], ["xyz", "none"]];
let fail = 0;
for (const [q, stage] of cases) { const r = core.resolve(q); const ok = r.stage === stage; if (!ok) fail++; console.log(ok ? "ok  " : "FAIL", q.padEnd(14), r.stage.padEnd(9), r.trail.map(t => t.label).join(" > ")); }
const m = core.matrix("Google", "citizen");
console.log("matrix rows:", m.rows.length, "| US cell:", m.rows.find(r => r.code === "US").cells[0].asset, "| NG cta:", m.rows.find(r => r.code === "NG").cta.venues[0].url);

// Keyed rules: provenance comes through, and a bad rule set fails at load.
const check = (ok, label) => { if (!ok) fail++; console.log(ok ? "ok  " : "FAIL", label); };
const r = core.rule("NG", "citizen", "Cryptocurrency");
check(r && r.statusKey === "conditional" && Array.isArray(r.sources) && r.verified_at === null, "rule() returns status and provenance");
check(core.rule("XX", "citizen", 0) === null && core.rule("NG", "citizen", "Moon rocks") === null, "rule() is null for unknown country or asset");
const countries = load("countries.json");
check(m.rows.length === countries.countries.length, `the matrix has a row per country (${m.rows.length})`);
const withRules = edit => { const c = structuredClone(countries); edit(c.countries[0].rules.citizen); return c; };
const throwsOn = (c, re) => { try { createVestail({ ...base, countries: c }); return false; } catch (e) { return re.test(e.message); } };
const base = { assets: load("assets.json").assets, categories: load("categories.json"), aliases: load("aliases.json"), entities: load("entities.json"), venues: load("venues.json") };
check(throwsOn(withRules(r => delete r.gold_bullion), /NG\.citizen: no rule for gold_bullion/), "a missing asset fails at load");
check(throwsOn(withRules(r => { r.gold_bulion = r.gold_bullion; }), /unknown asset gold_bulion/), "a misspelt asset fails at load");
check(throwsOn(withRules(r => { r.gold_bullion.status = 3; }), /status must be 0, 1 or 2/), "an invalid status fails at load");
const legacy = { countries: countries.countries.map(c => ({ ...c, rules: { citizen: Object.values(c.rules.citizen).map(x => x.status), foreigner: Object.values(c.rules.foreigner).map(x => x.status) } })) };
check(JSON.stringify(createVestail({ ...base, countries: legacy }).matrix("", "foreigner")) === JSON.stringify(core.matrix("", "foreigner")), "positional arrays still give the same matrix");

process.exit(fail ? 1 : 0);
