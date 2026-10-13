/*
 * Syncs Robinhood Chain stock tokens into data/tokens/evm.json.
 *
 * Robinhood publishes its own asset registry at api.robinhood.com/rhj/assets:
 * every live Stock Token, its contract address and its chain. That is a primary
 * source, which is the only kind this repo is allowed to write rules from.
 *
 * Usage, from the repo root:
 *   node scripts/sync-robinhood-tokens.mjs --symbols NVDA,TSLA
 */

const REGISTRY = "https://api.robinhood.com/rhj/assets";

/** Robinhood Chain. Also in data/tokens/evm.json; they must agree. */
const CHAIN_ID = 4663;

async function fetchRegistry() {
  const res = await fetch(REGISTRY, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${REGISTRY} returned ${res.status}`);
  return res.json();
}

const registry = await fetchRegistry();
process.stderr.write(`registry: ${registry.assets.length} assets\n`);
