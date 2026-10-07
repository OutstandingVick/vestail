import { readFileSync, readdirSync } from "node:fs";
import { createVestail } from "./index.js";
import { createTokens, evaluateIssuer } from "./tokens.js";

const D = new URL("../../data/", import.meta.url);
const load = f => JSON.parse(readFileSync(new URL(f, D)));
const core = createVestail({ assets: load("assets.json").assets, categories: load("categories.json"), aliases: load("aliases.json"),
  entities: load("entities.json"), countries: load("countries.json"), venues: load("venues.json") });
const policies = readdirSync(new URL("tokens/policies/", D)).filter(f => f.endsWith(".json")).map(f => load(`tokens/policies/${f}`));
const tokens = createTokens({ representations: load("tokens/representations.json"), policies, symbols: load("tokens/symbols.json") });

let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(ok ? "ok  " : "FAIL", label); };

const ng = tokens.board("NVDA", "NG", "citizen", core);
check(ng.asset === "Foreign equities", "NVDA is foreign equities in NG");
check(ng.tokens.length === 2 && ng.tokens.every(t => t.status === "conditional"), "both NVDA tokens conditional in NG");
check(ng.tokens.every(t => t.issuer.evidence.every(e => e.source_url)), "issuer evidence carries its sources");

const us = tokens.board("NVDA", "US", "citizen", core);
check(us.asset === "Domestic equities", "NVDA is domestic equities in the US");
check(us.tokens.every(t => t.status === "cannot_own" && t.decided_by === "issuer"), "issuers exclude US persons");

const gb = tokens.board("NVDA", "GB", "citizen", core);
check(gb.tokens.every(t => t.assessed === false && t.status === null), "no policy for GB: not assessed, never eligible");

// A foreigner in NG has can_own on foreign equities, but the issuer is conditional: stricter wins.
const fNG = tokens.board("NVDA", "NG", "foreigner", core);
check(fNG.class_status === "can_own" && fNG.tokens.every(t => t.status === "conditional" && t.decided_by === "issuer"), "issuer caps a looser class rule");

// A forbidding class rule wins even where no issuer gate exists.
const fake = structuredClone(load("countries.json"));
fake.countries.find(c => c.code === "GB").rules.citizen.foreign_equities.status = 0;
const core2 = createVestail({ assets: load("assets.json").assets, categories: load("categories.json"), aliases: load("aliases.json"),
  entities: load("entities.json"), countries: fake, venues: load("venues.json") });
check(tokens.board("NVDA", "GB", "citizen", core2).tokens.every(t => t.status === "cannot_own" && t.decided_by === "class"), "cannot_own class beats not assessed");

check(tokens.board("SPCX", "NG", "citizen", core).asset === "Private company shares", "SpaceX tokens fall under private company shares");
check(tokens.board("NOPE", "NG", "citizen", core) === null, "unknown symbol is null");
check(tokens.forEntity("Nvidia")[0]?.symbol === "NVDA", "entity joins to its symbol");
const mint = ng.tokens[0].mint;
check(tokens.token(mint, "NG", "citizen", core).token.mint === mint, "token by mint");

let threw = false;
try { evaluateIssuer({ provider: "ondo", symbol: "X" }, "NG", policies.find(p => p.provider === "xstocks")); } catch { threw = true; }
check(threw, "policy for the wrong provider throws");

console.log(fail ? `${fail} failed` : "all token tests pass");
process.exit(fail ? 1 : 0);
