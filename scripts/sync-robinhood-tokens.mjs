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

/*
 * The registry says what Robinhood intends to be deployed. The chain says what
 * is. Those can disagree — a stale entry, a typo, an address that never shipped
 * — so every address is read back from the contract itself before it is
 * written down. This is the same standard the two hand-added tokens were held
 * to; the script exists so the standard survives contact with 194 of them.
 */
const RPC = "https://rpc.mainnet.chain.robinhood.com";

/** ERC-20 selectors: the first four bytes of keccak("symbol()") and friends. */
const SELECTOR = { symbol: "0x95d89b41", name: "0x06fdde03", decimals: "0x313ce567" };

let rpcId = 0;

async function ethCall(address, selector) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "eth_call", params: [{ to: address, data: selector }, "latest"] }),
  });
  if (!res.ok) throw new Error(`rpc ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`rpc: ${body.error.message}`);
  return body.result;
}

/*
 * ABI decoding, for the two return types these three calls can produce.
 *
 * A well-behaved ERC-20 returns `string`: a 32-byte offset, a 32-byte length,
 * then the bytes. Older tokens predating the final standard return a fixed
 * `bytes32` padded with zeros. Both appear in the wild, so both are read.
 */
function decodeString(hex) {
  const data = (hex || "").replace(/^0x/, "");
  if (!data) return null;
  const bytes = Buffer.from(data, "hex");

  // bytes32: one word, no offset to follow.
  if (bytes.length === 32) return bytes.toString("utf8").replace(/\0+$/, "") || null;

  const offset = Number(BigInt("0x" + data.slice(0, 64)));
  const length = Number(BigInt("0x" + data.slice(offset * 2, offset * 2 + 64)));
  if (!Number.isFinite(offset) || !Number.isFinite(length)) return null;
  return bytes.subarray(offset + 32, offset + 32 + length).toString("utf8") || null;
}

function decodeUint(hex) {
  const data = (hex || "").replace(/^0x/, "");
  if (!data) return null;
  const n = Number(BigInt("0x" + data));
  return Number.isSafeInteger(n) ? n : null;
}

const assets = validate(await fetchRegistry());
const live = onChain(assets);
process.stderr.write(`registry: ${assets.length} assets, ${live.size} live on chain ${CHAIN_ID}\n`);
