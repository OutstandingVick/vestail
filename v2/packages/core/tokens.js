/**
 * Tokenised versions of an asset, carried over from Vestail v1.
 *
 * One ticker exists onchain as several legal claims (a custody-backed
 * certificate, a debt note, a broker entitlement). Each issuer publishes its
 * own terms, so each token gets its own verdict from its issuer's policy file,
 * which v1 sourced rule by rule. That verdict is then capped by the v2 class
 * rule for the buyer's country and buyer type: the stricter of the two decides.
 *
 * Two things are deliberate and must not be "fixed":
 *  - No policy gate for a region means NOT ASSESSED (status null), never
 *    eligible. Missing research is not permission. It is not buyable.
 *  - The class rule can only make a token stricter, never looser.
 *
 * Usage:
 *   const t = createTokens({ representations, policies, symbols });
 *   t.board("NVDA", "NG", "citizen", core)  -> { symbol, asset, class_status, tokens: [...] }
 */

import { STATUS } from "./index.js";

/** v1's issuer statuses on v2's scale. */
const ISSUER_SCALE = { eligible: 2, conditional: 1, restricted: 0 };

/**
 * v1's evaluator, ported unchanged in behaviour: the most severe applicable gate
 * decides; every applicable gate and note is kept as evidence, deciding gates
 * first. Returns null when no gate applies (not assessed).
 */
export function evaluateIssuer(rep, region, policy) {
  if (policy.provider !== rep.provider) throw new Error(`policy for ${policy.provider} applied to a ${rep.provider} token`);
  const matching = policy.rules.filter(r => r.regions.includes(region) && (r.symbols === undefined || r.symbols.includes(rep.symbol)));
  const gates = matching.filter(r => r.kind === "gate");
  if (!gates.length) return null;
  const status = Math.min(...gates.map(g => ISSUER_SCALE[g.status]));
  const deciding = gates.filter(g => ISSUER_SCALE[g.status] === status);
  const ordered = [...deciding, ...gates.filter(g => ISSUER_SCALE[g.status] !== status), ...matching.filter(r => r.kind === "note")];
  return {
    status,
    summary: deciding[0].short,
    acknowledgement: deciding[0].acknowledgement || null,
    policy_version: policy.version,
    evidence: ordered.map(r => ({ rule: r.id, kind: r.kind, reason: r.reason, source_url: r.source_url, source_quality: r.source_quality })),
  };
}

/**
 * What a token legally is, from its issuer's structure. Vestail names the
 * instrument before it says anything about owning it: a debt note that tracks
 * NVIDIA is not NVIDIA stock.
 */
export const INSTRUMENT = {
  custody_backed: "tokenized_equity",
  share_claim: "tokenized_equity",
  total_return_note: "tokenized_debt",
  tokenized_debt: "tokenized_debt",
  security_entitlement: "broker_entitlement",
  spv_exposure: "contractual_exposure",
  loan_participation: "contractual_exposure",
};

export function createTokens({ representations, policies, symbols, evm = null }) {
  const SYMBOLS = symbols.symbols || symbols;
  const CHAINS = { solana: { name: "Solana", gas: "SOL", explorer: "https://solscan.io" }, ...(evm?.chains || {}) };

  // One shape for every chain: `address` is the token's address on its chain,
  // `mint` stays as its alias so Solana-era callers keep working.
  const REPS = {};
  for (const [sym, v] of Object.entries(representations.symbols || representations))
    REPS[sym] = { representations: v.representations.map(r => ({ ...r, chain: "solana", address: r.mint })) };
  for (const r of evm?.representations || []) {
    if (!CHAINS[r.chain]) throw new Error(`tokens: unknown chain ${r.chain} for ${r.address}`);
    (REPS[r.symbol] ??= { representations: [] }).representations.push({ ...r, mint: r.address });
  }
  const sameAddress = (a, b) => a === b || (a.startsWith("0x") && a.toLowerCase() === String(b).toLowerCase());
  const POLICY = Object.fromEntries((Array.isArray(policies) ? policies : Object.values(policies)).map(p => [p.provider, p]));

  for (const sym of Object.keys(REPS)) {
    if (!SYMBOLS[sym]) throw new Error(`tokens: no asset class mapping for ${sym}`);
    for (const r of REPS[sym].representations) {
      if (!POLICY[r.provider]) throw new Error(`tokens: no policy for provider ${r.provider}`);
      if (!INSTRUMENT[r.structure]) throw new Error(`tokens: unknown structure ${r.structure} for ${r.address}`);
    }
  }

  /** The v2 asset class name that governs a symbol in one country. */
  function classOf(symbol, code) {
    const s = SYMBOLS[symbol];
    if (s.class === "equity-by-home") return code === s.home ? "Domestic equities" : "Foreign equities";
    return { private_company_shares: "Private company shares" }[s.class] || s.class;
  }

  /** Which side set the final status: "issuer", "class", or "both" when they agree. */
  function decidedBy(issuer, classStatus, status) {
    if (status === null) return null;
    if (!issuer || classStatus < issuer.status) return "class";
    return issuer.status < classStatus ? "issuer" : "both";
  }

  function list() {
    return Object.keys(REPS).map(symbol => ({
      symbol, name: SYMBOLS[symbol].name, entity: SYMBOLS[symbol].entity, home: SYMBOLS[symbol].home,
      providers: [...new Set(REPS[symbol].representations.map(r => r.provider))],
      chains: [...new Set(REPS[symbol].representations.map(r => r.chain))],
      mints: REPS[symbol].representations.map(r => r.address),
    }));
  }

  /** Symbols whose entity name matches (for joining a resolver hit to its tokens). */
  const forEntity = name => list().filter(s => s.entity && s.entity.toLowerCase() === String(name).toLowerCase());

  /**
   * Every token for a symbol, judged for one country and buyer type.
   * `core` is a createVestail() instance, for the class rule.
   * Returns null for an unknown symbol.
   */
  function board(symbol, code, who, core) {
    if (!REPS[symbol]) return null;
    const assetName = classOf(symbol, code);
    const classRule = core.rule(code, who, assetName);
    if (!classRule) return null;
    const tokens = REPS[symbol].representations.map(rep => {
      const issuer = evaluateIssuer(rep, code, POLICY[rep.provider]);
      // A class that forbids the asset forbids every wrapper of it, assessed or not.
      let status;
      if (classRule.status === 0) status = 0;
      else if (!issuer) status = null;
      else status = Math.min(issuer.status, classRule.status);
      return {
        mint: rep.address, address: rep.address, chain: rep.chain, chain_name: CHAINS[rep.chain].name,
        provider: rep.provider, token_symbol: rep.tokenSymbol, name: rep.name,
        instrument: INSTRUMENT[rep.structure], structure: rep.structure, redeemable: rep.redeemable, custodian: rep.custodian, decimals: rep.decimals,
        token_program: rep.tokenProgram ?? null, issuer_source: rep.source,
        assessed: status !== null,
        status: status === null ? null : STATUS[status],
        decided_by: decidedBy(issuer, classRule.status, status),
        issuer: issuer && { ...issuer, status: STATUS[issuer.status] },
      };
    });
    return { symbol, name: SYMBOLS[symbol].name, country: code, who, asset: assetName, class_status: classRule.statusKey,
      class_sources: classRule.sources, class_verified_at: classRule.verified_at, tokens };
  }

  /** One token by its address on any chain (EVM addresses match case-insensitively), judged as in board(). */
  function token(address, code, who, core) {
    for (const symbol of Object.keys(REPS)) {
      if (REPS[symbol].representations.some(r => sameAddress(r.address, address))) {
        const b = board(symbol, code, who, core);
        return b && { ...b, tokens: undefined, token: b.tokens.find(t => sameAddress(t.address, address)) };
      }
    }
    return null;
  }

  return { list, forEntity, board, token, classOf, chains: CHAINS };
}
