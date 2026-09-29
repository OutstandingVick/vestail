import { readFileSync } from "node:fs";
import { createVestail } from "@vestail/core";

const DATA_DIR = new URL("../../../data/", import.meta.url);
const load = f => JSON.parse(readFileSync(new URL(f, DATA_DIR)));

/**
 * Load data/*.json and build the core over it. The core speaks asset names
 * ("Gold bullion"); the API speaks ids ("gold_bullion"), so keep both maps here.
 */
export function loadData() {
  const raw = {
    assets: load("assets.json").assets,
    categories: load("categories.json"),
    aliases: load("aliases.json"),
    entities: load("entities.json"),
    countries: load("countries.json"),
    venues: load("venues.json"),
    activity: load("activity.sample.json"),
  };
  const core = createVestail(raw);
  const idByName = Object.fromEntries(raw.assets.map(a => [a.name, a.id]));
  const nameById = Object.fromEntries(raw.assets.map(a => [a.id, a.name]));
  const countryByCode = Object.fromEntries(core.COUNTRIES.map(c => [c.code, c]));
  return { raw, core, idByName, nameById, countryByCode };
}
