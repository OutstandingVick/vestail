/*
 * Verifies Vestail's selected trade.xyz HIP-3 perpetual markets against
 * Hyperliquid's primary info API, then merges them into the derivative list.
 *
 * Usage:
 *   node scripts/sync-hyperliquid-markets.mjs --all --dry-run
 *   node scripts/sync-hyperliquid-markets.mjs --markets SP500,NIFTY
 *   node scripts/sync-hyperliquid-markets.mjs --list
 */

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const INFO = "https://api.hyperliquid.xyz/info";
const OUT = new URL("../data/derivatives/hyperliquid.json", import.meta.url);
const USER_AGENT = "vestail-market-sync (+https://vestail.fun)";

// Names and classifications were checked against the benchmark owners and
// Hyperliquid's primary annotation/category endpoints. related_asset is null:
// equity-index classification depends on the buyer's home market, which the
// current derivative row cannot express. DXY and VIX are not ownable classes.
export const MARKET_SPECS = {
  SP500: { name: "S&P 500 Index", category: "indices", related_asset: null, aliases: ["s&p", "s&p 500", "sp500", "spx", "us 500"] },
  NIFTY: { name: "NIFTY 50 Index", category: "indices", related_asset: null, aliases: ["nifty", "nifty 50", "india 50"] },
  JP225: { name: "Japan 225 Index", category: "indices", related_asset: null, aliases: ["jp225", "nikkei", "nikkei 225", "japan 225"] },
  KR200: { name: "Korea 200 Index", category: "indices", related_asset: null, aliases: ["kr200", "kospi", "kospi 200", "korea 200"] },
  IBOV: { name: "Bovespa Index", category: "indices", related_asset: null, aliases: ["ibov", "bovespa", "ibovespa", "brazil 60"] },
  DXY: { name: "U.S. Dollar Index", category: "fx", related_asset: null, aliases: ["dxy", "dollar index", "us dollar index", "dollar basket"] },
  VIX: { name: "Cboe Volatility Index", category: "indices", related_asset: null, aliases: ["vix", "volatility index", "fear index"] },
  XYZ100: { name: "XYZ100 Index", category: "indices", related_asset: null, aliases: ["xyz100", "xyz 100", "us technology 100", "nasdaq 100"] },
};

export function parseArgs(argv) {
  const args = { markets: null, all: false, dryRun: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all") args.all = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--markets") args.markets = parseMarkets(argv[++i]);
    else if (arg.startsWith("--markets=")) args.markets = parseMarkets(arg.slice(10));
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!args.list && !args.all && !args.markets?.length) throw new Error("pass --all or name markets with --markets SP500,NIFTY");
  return args;
}

function parseMarkets(value = "") {
  return [...new Set(value.split(",").map(value => value.trim().toUpperCase().replace(/^XYZ:/, "")).filter(Boolean))];
}

export function validateMeta(meta) {
  if (!meta || !Array.isArray(meta.universe)) throw new Error("Hyperliquid meta response has no universe array");
  if (!meta.universe.length) throw new Error("Hyperliquid meta universe is empty");
  const seen = new Set();
  for (const market of meta.universe) {
    if (!market || typeof market.name !== "string" || !market.name.startsWith("xyz:")) throw new Error("Hyperliquid meta contains a malformed market");
    if (seen.has(market.name)) throw new Error(`Hyperliquid meta repeats ${market.name}`);
    seen.add(market.name);
  }
  return meta.universe;
}

export function validateCategories(rows) {
  if (!Array.isArray(rows)) throw new Error("Hyperliquid category response is not an array");
  const result = new Map();
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== "string" || typeof row[1] !== "string") {
      throw new Error("Hyperliquid category response contains a malformed row");
    }
    if (result.has(row[0])) throw new Error(`Hyperliquid categories repeat ${row[0]}`);
    result.set(row[0], row[1]);
  }
  return result;
}

export function verifyMarket(coin, spec, universe, categories, annotation = null) {
  const id = `xyz:${coin}`;
  const live = universe.find(market => market.name === id);
  if (!live) return { ok: false, why: `${id} is absent from Hyperliquid's xyz universe` };
  const apiCategory = categories.get(id) ?? annotation?.category ?? null;
  if (apiCategory && apiCategory !== spec.category) {
    return { ok: false, why: `${id} is ${apiCategory} in Hyperliquid, not ${spec.category}` };
  }
  if (coin === "XYZ100" && !/100.+non-financial.+U\.S\. stock exchange/i.test(annotation?.description ?? "")) {
    return { ok: false, why: "xyz:XYZ100 has no primary annotation describing what it tracks" };
  }
  return { ok: true, live, market: { id, coin, ...spec } };
}

export function merge(existing, incoming) {
  const output = structuredClone(existing);
  const byId = new Map(output.markets.map((market, index) => [market.id, index]));
  let added = 0, updated = 0;
  for (const market of incoming) {
    const index = byId.get(market.id);
    if (index === undefined) {
      byId.set(market.id, output.markets.push(market) - 1);
      added++;
    } else if (JSON.stringify(output.markets[index]) !== JSON.stringify(market)) {
      output.markets[index] = market;
      updated++;
    }
  }
  return { data: output, added, updated };
}

async function info(type, extra = {}) {
  const response = await fetch(INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ type, ...extra }),
  });
  if (!response.ok) throw new Error(`${INFO} returned ${response.status} for ${type}`);
  return response.json();
}

export async function verifiedMarkets(coins, request = info) {
  const universe = validateMeta(await request("meta", { dex: "xyz" }));
  const categories = validateCategories(await request("perpCategories"));
  const verified = [], refused = [];
  for (const coin of coins) {
    const spec = MARKET_SPECS[coin];
    if (!spec) { refused.push({ coin, why: "no reviewed Vestail market specification" }); continue; }
    const annotation = await request("perpAnnotation", { coin: `xyz:${coin}` });
    const result = verifyMarket(coin, spec, universe, categories, annotation);
    if (result.ok) verified.push({ ...result.market, isDelisted: result.live.isDelisted === true });
    else refused.push({ coin, why: result.why });
  }
  return { verified, refused };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const coins = args.all ? Object.keys(MARKET_SPECS) : args.markets ?? Object.keys(MARKET_SPECS);
    const { verified, refused } = await verifiedMarkets(coins);
    for (const market of verified) process.stdout.write(`  ok   ${market.id.padEnd(12)} ${market.category}${market.isDelisted ? " (delisted)" : ""}\n`);
    for (const item of refused) process.stderr.write(`refuse ${item.coin}: ${item.why}\n`);
    if (args.list) process.exit(refused.length ? 1 : 0);
    if (verified.length !== coins.length || refused.length) throw new Error(`verified ${verified.length} of ${coins.length} requested markets`);
    const rows = verified.map(({ isDelisted: _isDelisted, ...market }) => market);
    const existing = JSON.parse(readFileSync(OUT, "utf8"));
    const result = merge(existing, rows);
    process.stdout.write(`verified ${verified.length} markets; ${result.added} new, ${result.updated} updated\n`);
    if (!args.dryRun) writeFileSync(OUT, JSON.stringify(result.data, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
