import { readFileSync, readdirSync } from "node:fs";
import { createVestail } from "@vestail/core";
import { createTokens } from "@vestail/core/tokens";
import { createUtilities } from "@vestail/core/utilities";

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
  const tokens = createTokens({
    representations: load("tokens/representations.json"),
    policies: readdirSync(new URL("tokens/policies/", DATA_DIR)).filter(f => f.endsWith(".json")).map(f => load(`tokens/policies/${f}`)),
    symbols: load("tokens/symbols.json"),
    evm: load("tokens/evm.json"),
  });
  // Utilities: protocol rule files and the hand-edited support config.
  const utilities = createUtilities({
    protocols: readdirSync(new URL("utilities/protocols/", DATA_DIR)).filter(f => f.endsWith(".json")).map(f => load(`utilities/protocols/${f}`)),
    support: load("utilities/support.json"),
  });
  return { raw, core, tokens, utilities, idByName, nameById, countryByCode };
}
