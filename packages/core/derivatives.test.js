import { readFileSync } from "node:fs";
import { createDerivatives } from "./derivatives.js";

const D = new URL("../../data/derivatives/", import.meta.url);
const load = f => JSON.parse(readFileSync(new URL(f, D)));
const d = createDerivatives({ venue: load("hyperliquid.json"), policies: [load("policies/hyperliquid.json")] });

let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(ok ? "ok  " : "FAIL", label); };

check(["xyz:GOLD", "xyz:CL", "xyz:COPPER"].every(id => d.list().some(m => m.id === id)), "the original commodity markets remain covered");
check(d.list().length === 11, "the venue catalogue carries eleven reviewed markets");
check(new Set(d.list().map(m => m.id)).size === d.list().length, "every market id is unique");
check(d.list().every(m => ["commodities", "indices", "fx"].includes(m.category)), "every market has a reviewed category");
check(d.list().every(m => Array.isArray(m.aliases) && m.aliases.length), "every market can be found by a buyer phrase");
check(d.list().filter(m => m.category === "indices").every(m => m.related_asset === null), "index baskets do not assert a buyer-independent ownership class");
check(d.list().every(m => m.instrument === "perpetual_future"), "every market is a perpetual future, never ownership");
check(d.find("can I buy oil")[0]?.id === "xyz:CL", "oil finds WTI crude");
check(d.find("copper")[0]?.id === "xyz:COPPER", "copper finds copper");
check(d.find("goldman sachs").length === 0, "goldman is not gold");
check(d.find("s&p 500")[0]?.id === "xyz:SP500", "S and P searches find SP500");
check(d.find("nifty 50")[0]?.id === "xyz:NIFTY", "NIFTY 50 searches find NIFTY");
check(d.judge("xyz:GOLD", "US").status === "cannot_own", "US persons barred");
check(d.judge("xyz:GOLD", "NG").status === "conditional" && d.judge("xyz:GOLD", "NG").issuer.acknowledgement, "NG conditional with an acknowledgement");
check(d.judge("xyz:GOLD", "GB").assessed === false && d.judge("xyz:GOLD", "GB").status === null, "no rule for GB: not assessed");
check(d.judge("xyz:NOPE", "NG") === null, "unknown market is null");

console.log(fail ? `${fail} failed` : "all derivative tests pass");
process.exit(fail ? 1 : 0);
