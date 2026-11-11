import { readFileSync, readdirSync } from "node:fs";
import { createUtilities, evaluateProtocol, mostRestrictive } from "./utilities.js";

const D = new URL("../../data/utilities/", import.meta.url);
const load = f => JSON.parse(readFileSync(new URL(f, D)));
const protocols = readdirSync(new URL("protocols/", D)).filter(f => f.endsWith(".json")).map(f => load(`protocols/${f}`));
const support = load("support.json");
const u = createUtilities({ protocols, support });

let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(ok ? "ok  " : "FAIL", label); };
const token = (status, over = {}) => ({ chain: "solana", address: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", status, ...over });
const by = (list, name) => list.find(x => x.utility === name);

// Most restrictive wins, in this order.
check(mostRestrictive("eligible", "conditional") === "conditional", "conditional beats eligible");
check(mostRestrictive("conditional", "unverified") === "unverified", "unverified beats conditional");
check(mostRestrictive("unverified", "restricted") === "restricted", "restricted beats everything");
check(mostRestrictive() === "unverified", "nothing to combine is unverified");

// Issuer (hold) and protocol rules combine.
const ng = u.judge(token("can_own"), "NG");
check(by(ng, "trade").verdict === "eligible", "eligible hold + eligible Jupiter = eligible trade");
const ngCond = u.judge(token("conditional"), "NG");
check(by(ngCond, "trade").verdict === "conditional" && by(ngCond, "earn").verdict === "conditional", "conditional hold caps eligible protocols");
const us = u.judge(token("can_own"), "US");
check(by(us, "trade").verdict === "restricted" && by(us, "earn").verdict === "restricted", "a protocol that bars the US makes the utility restricted even if holding is fine");
const cannot = u.judge(token("cannot_own"), "NG");
check(UT(cannot).every(x => x.verdict === "restricted"), "a token that can't be held can't be traded, lent or pooled");
const unassessed = u.judge(token(null), "NG");
check(by(unassessed, "trade").verdict === "unverified", "an unassessed token makes trade unverified, not eligible");
check(evaluateProtocol(protocols.find(p => p.protocol === "meteora"), "FR").verdict === "unverified", "a country no protocol rule names is unverified");

// Unverified disables actions; risky utilities need an acknowledgement.
const lend = by(ng, "lend");
check(lend.verdict === "unverified" && !lend.actionsEnabled, "lending with only placeholder protocols is unverified and disabled");
const placeholder = createUtilities({ protocols, support: { version: "t", utilities: { lend: [{ protocol: "kamino", chains: ["solana"], assets: "*", action: "supply", risk: "liquidation" }] } } });
const kamino = by(placeholder.judge(token("can_own"), "NG"), "lend").options[0];
check(kamino.verdict === "unverified" && kamino.actionsEnabled === false, "a protocol with no sourced rules is unverified with actions disabled");
check(by(us, "trade").actionsEnabled === false, "restricted disables actions");
const earn = by(ng, "earn");
check(earn.actionsEnabled && earn.acknowledgementRequired && earn.risk === "impermanent_loss", "earn needs an impermanent-loss acknowledgement even when eligible");
const borrowCfg = createUtilities({ protocols: [...protocols, { protocol: "t", name: "T", version: "2026-11-11.1", verifiedOn: "2026-11-11", todo: false, rules: [{ id: "ok", status: "eligible", regions: ["NG"], reason: "Read from terms.", sourceUrl: "https://example.org", sourceQuality: "primary" }] }],
  support: { version: "t", utilities: { borrow: [{ protocol: "t", chains: ["solana"], assets: "*", action: "borrow", risk: "liquidation" }], lend: [{ protocol: "t", chains: ["solana"], assets: "*", action: "supply", risk: "liquidation" }] } } });
const b = borrowCfg.judge(token("can_own"), "NG");
check(by(b, "borrow").acknowledgementRequired && by(b, "lend").acknowledgementRequired, "lend and borrow need a liquidation acknowledgement");
check(by(ng, "trade").acknowledgementRequired === false, "an eligible spot trade needs no acknowledgement");
check(by(ngCond, "trade").acknowledgementRequired === true, "a conditional trade needs the condition acknowledged");

// No perps or leverage, ever.
const refuses = cfg => { try { createUtilities({ protocols, support: cfg }); return false; } catch { return true; } };
check(refuses({ version: "t", utilities: { perps: [] } }), "a perps utility is refused at load");
check(refuses({ version: "t", utilities: { trade: [{ protocol: "jupiter", chains: ["solana"], assets: "*", action: "leverage" }] } }), "a leveraged action is refused");
check(ng.every(x => !/perp|leverage/.test(x.utility)), "no perps utility is ever returned");
check(refuses({ version: "t", utilities: { trade: [{ protocol: "nope", chains: ["solana"], assets: "*", action: "swap" }] } }), "a protocol without a rule file is refused");

function UT(list) { return list.filter(x => x.utility !== "hold"); }
console.log(fail ? `${fail} failed` : "all utility tests pass");
process.exitCode = fail ? 1 : 0;
