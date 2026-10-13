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

/*
 * A public RPC answering 194 tokens times three calls is 582 requests. Sent at
 * once that reads as an attack and gets throttled, and a throttled call that
 * returns nothing is indistinguishable here from a token that does not exist —
 * which would quietly drop real tokens from the output. Hence a small pool.
 */
async function pooled(items, size, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i], i);
    }
  }));
  return out;
}

/*
 * Retried, because the alternative is worse than slow. A dropped connection or
 * a 429 would otherwise surface as "nothing deployed there" and silently drop
 * a real token from the output — a wrong answer that looks like a right one.
 * Three attempts, backing off; after that the run fails rather than guesses.
 */
async function ethCall(address, selector, attempt = 1) {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "eth_call", params: [{ to: address, data: selector }, "latest"] }),
    });
    if (res.status === 429 || res.status >= 500) throw new Error(`rpc ${res.status}`);
    if (!res.ok) throw Object.assign(new Error(`rpc ${res.status}`), { fatal: true });
    const body = await res.json();
    // "execution reverted" is an answer: there is no such function here.
    if (body.error) return null;
    return body.result;
  } catch (err) {
    if (err.fatal || attempt >= 3) throw err;
    await new Promise(r => setTimeout(r, 250 * 2 ** attempt));
    return ethCall(address, selector, attempt + 1);
  }
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

/**
 * Read a token's own account of itself: symbol, name, decimals, from the
 * contract at that address. Returns null when nothing answers, which is how a
 * registry entry pointing at an address that never shipped shows up.
 */
async function readToken(address) {
  const [symbol, name, decimals] = await Promise.all([
    ethCall(address, SELECTOR.symbol).then(decodeString),
    ethCall(address, SELECTOR.name).then(decodeString),
    ethCall(address, SELECTOR.decimals).then(decodeUint),
  ]);
  if (symbol === null && name === null && decimals === null) return null;
  return { symbol, name, decimals };
}

/**
 * The chain is the authority. Where the registry and the contract disagree on
 * the ticker, that is not a difference to average out — it means one of them
 * is describing a different token, and writing either down would put a wrong
 * address behind a right-looking symbol. Say so and skip it.
 */
function reconcile(ticker, listed, onchain) {
  if (!onchain) return { ok: false, why: "nothing deployed at that address" };
  if (onchain.symbol && onchain.symbol !== ticker) {
    return { ok: false, why: `registry says ${ticker}, the contract says ${onchain.symbol}` };
  }
  if (!Number.isInteger(onchain.decimals)) return { ok: false, why: "no decimals()" };
  return { ok: true, symbol: ticker, name: listed.tokenName, decimals: onchain.decimals };
}

/*
 * Which tickers to sync. Explicit by default: 194 tokens is a catalogue, and a
 * catalogue dropped into the rule set unread is how a product that promises
 * accuracy stops deserving the word. --all exists for when someone has decided
 * to carry all of them.
 */
function parseArgs(argv) {
  const args = { symbols: null, all: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--symbols") args.symbols = (argv[++i] || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    else if (a.startsWith("--symbols=")) args.symbols = a.slice(10).split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    else throw new Error(`unknown argument ${a}`);
  }
  if (!args.all && !args.symbols?.length) {
    throw new Error("name the tickers with --symbols NVDA,TSLA, or pass --all");
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const assets = validate(await fetchRegistry());
const live = onChain(assets);
process.stderr.write(`registry: ${assets.length} assets, ${live.size} live on chain ${CHAIN_ID}\n`);

/*
 * What every Robinhood Stock Token is, legally. These do not vary per ticker,
 * so they are stated once rather than guessed per row.
 *
 * "tokenized_debt" is the whole point: a Stock Token is a debt security issued
 * by Robinhood Assets (Jersey) Limited giving economic exposure to the share
 * and no legal or beneficial right to it. You cannot redeem it for the share,
 * so redeemable is false and there is no custodian holding one for you. That
 * is exactly the distinction Vestail exists to surface — the same ticker, held
 * three ways, with three different answers about what you actually own.
 */
const ISSUER = {
  provider: "robinhood",
  structure: "tokenized_debt",
  redeemable: false,
  custodian: null,
  source: "https://docs.robinhood.com/chain/stock-tokens",
};

/** The registry's display name, minus the issuer's own typography. */
const cleanName = name => name.replace(/\s*•\s*/g, " ").replace(/\s+/g, " ").trim();

function toRepresentation({ ticker, listed, result }) {
  return {
    chain: "robinhood",
    address: listed.address,
    provider: ISSUER.provider,
    symbol: ticker,
    name: cleanName(result.name),
    tokenSymbol: ticker,
    decimals: result.decimals,
    structure: ISSUER.structure,
    redeemable: ISSUER.redeemable,
    custodian: ISSUER.custodian,
    source: ISSUER.source,
  };
}

const wanted = args.all ? [...live.keys()] : args.symbols;
const missing = wanted.filter(t => !live.has(t));
if (missing.length) throw new Error(`not on chain ${CHAIN_ID}: ${missing.join(", ")}`);

const checked = await pooled(wanted, 6, async ticker => {
  const listed = live.get(ticker);
  return { ticker, listed, result: reconcile(ticker, listed, await readToken(listed.address)) };
});

for (const { ticker, result } of checked) {
  process.stderr.write(`  ${result.ok ? "ok  " : "SKIP"} ${ticker.padEnd(7)} ${result.ok ? `${cleanName(result.name)} (${result.decimals} decimals)` : result.why}\n`);
}

const fresh = checked.filter(c => c.result.ok).map(toRepresentation);
process.stderr.write(`verified: ${fresh.length} of ${wanted.length}\n`);

/*
 * Merging, not replacing. data/tokens/evm.json also carries Base entries and
 * anything else added by hand, and a sync of two Robinhood tickers must not
 * take the rest of the file with it. Identity is chain plus address, lowercased
 * — the same contract written with different capitalisation is one token, and
 * letting it in twice would show the buyer the same thing twice.
 */
const key = r => `${r.chain}:${r.address.toLowerCase()}`;

function merge(existing, incoming) {
  const byKey = new Map(existing.map(r => [key(r), r]));
  let added = 0, updated = 0;
  for (const r of incoming) {
    const k = key(r);
    if (!byKey.has(k)) added++;
    else if (JSON.stringify(byKey.get(k)) !== JSON.stringify(r)) updated++;
    byKey.set(k, r);
  }
  // Grouped by chain, then by ticker, so a diff reads as a list of tokens
  // rather than as wherever the registry happened to put them.
  const rows = [...byKey.values()].sort((a, b) =>
    a.chain.localeCompare(b.chain) || a.symbol.localeCompare(b.symbol) || a.provider.localeCompare(b.provider));
  return { rows, added, updated };
}
