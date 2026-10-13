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

/*
 * The registry is someone else's JSON over the network, so nothing is trusted
 * until it is checked. A malformed or truncated response must stop the run
 * rather than quietly produce a short, plausible-looking token list.
 */
function validate(registry) {
  if (!registry || !Array.isArray(registry.assets)) throw new Error("registry has no assets array");
  if (!registry.assets.length) throw new Error("registry is empty");

  const bad = [];
  for (const a of registry.assets) {
    const d = a.deployments?.find(x => x.chainId === CHAIN_ID);
    if (!a.tokenSymbol) bad.push(`${a.id}: no tokenSymbol`);
    else if (!a.tokenName) bad.push(`${a.tokenSymbol}: no tokenName`);
    else if (d && !/^0x[0-9a-fA-F]{40}$/.test(d.contractAddress || "")) bad.push(`${a.tokenSymbol}: bad address`);
  }
  if (bad.length) throw new Error(`registry entries are malformed:\n  ${bad.slice(0, 5).join("\n  ")}`);
  return registry.assets;
}

/** Live tokens on Robinhood Chain, keyed by ticker. */
function onChain(assets) {
  const out = new Map();
  for (const a of assets) {
    if (a.status !== "ASSET_STATUS_ACTIVE") continue;
    const d = a.deployments.find(x => x.chainId === CHAIN_ID);
    if (d) out.set(a.tokenSymbol, { ...a, address: d.contractAddress });
  }
  return out;
}

const assets = validate(await fetchRegistry());
const live = onChain(assets);
process.stderr.write(`registry: ${assets.length} assets, ${live.size} live on chain ${CHAIN_ID}\n`);
