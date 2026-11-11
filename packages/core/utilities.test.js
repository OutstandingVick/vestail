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

function UT(list) { return list.filter(x => x.utility !== "hold"); }
console.log(fail ? `${fail} failed` : "all utility combination tests pass");
process.exitCode = fail ? 1 : 0;
