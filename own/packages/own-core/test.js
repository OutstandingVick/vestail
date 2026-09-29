import { readFileSync } from "node:fs";
import { createOwn } from "./index.js";
const load = f => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url)));
const own = createOwn({ assets: load("assets.json").assets, categories: load("categories.json"), aliases: load("aliases.json"),
  entities: load("entities.json"), countries: load("countries.json"), venues: load("venues.json") });
const cases = [["Google", "entity"], ["tesla shares", "entity"], ["a house", "alias"], ["stocks", "alias"], ["commodities", "alias"], ["regulated sectors", "category"], ["foreign eq", "asset"], ["xyz", "none"]];
let fail = 0;
for (const [q, stage] of cases) { const r = own.resolve(q); const ok = r.stage === stage; if (!ok) fail++; console.log(ok ? "ok  " : "FAIL", q.padEnd(14), r.stage.padEnd(9), r.trail.map(t => t.label).join(" > ")); }
const m = own.matrix("Google", "citizen");
console.log("matrix rows:", m.rows.length, "| US cell:", m.rows.find(r => r.code === "US").cells[0].asset, "| NG cta:", m.rows.find(r => r.code === "NG").cta.venues[0].url);
process.exit(fail ? 1 : 0);
