import { ApiError } from "../errors.js";

export const DISCLAIMER = "Vestail provides informational eligibility disclosures, not legal, tax, investment, or compliance advice. A verdict does not certify compliance or guarantee that a transaction will be accepted or completed.";

const PUBLIC_VERDICT = {
  can_own: "eligible",
  conditional: "conditional",
  cannot_own: "restricted",
};

const validSources = sources => (sources || [])
  .filter(source => source && (source.url || source.source_url))
  .map(source => ({
    label: source.label || source.title || source.rule || "Source",
    url: source.url || source.source_url,
  }));

const rawRule = (data, country, who, assetId) =>
  data.raw.countries.countries.find(item => item.code === country)?.rules?.[who]?.[assetId] || null;

const versionOf = data => String(data.raw.countries.version || "unknown");
const classRuleId = (country, residency, asset) => `class:${country}:${residency}:${asset}`;
const tokenRuleId = (country, residency, address) => `token:${country}:${residency}:${encodeURIComponent(address)}`;

function unverified({ ruleId, data, reasons, sources = [], ruleVersion = versionOf(data) }) {
  return {
    ruleId,
    verdict: "unverified",
    reasons: reasons.length ? reasons : ["Vestail does not have a sourced rule for this profile and asset."],
    conditions: [],
    sources,
    lastVerified: null,
    ruleVersion,
    disclaimer: DISCLAIMER,
  };
}

function classEligibility(data, { country, residency, assetId }) {
  const ruleId = classRuleId(country, residency, assetId);
  if (residency === "resident") {
    return unverified({ ruleId, data, reasons: ["The current Vestail rule set does not distinguish residents from citizens or foreigners."] });
  }
  const assetName = data.nameById[assetId];
  if (!assetName) throw new ApiError(400, "invalid_asset", `asset.class: Unknown asset class '${assetId}'.`);
  if (!data.countryByCode[country]) throw new ApiError(400, "invalid_country", `country: Unsupported country '${country}'.`);

  const judged = data.core.rule(country, residency, assetName);
  const raw = rawRule(data, country, residency, assetId);
  const sources = validSources(judged?.sources);
  const conditions = judged?.statusKey === "conditional" ? (raw?.conditions || []) : [];
  if (!judged || !raw || sources.length === 0 || (judged.statusKey === "conditional" && conditions.length === 0)) {
    return unverified({ ruleId, data, reasons: raw?.reasons || [], sources });
  }

  return {
    ruleId,
    verdict: PUBLIC_VERDICT[judged.statusKey],
    reasons: raw.reasons || [`The sourced Vestail rule classifies ${assetName} as ${PUBLIC_VERDICT[judged.statusKey]} for this profile.`],
    conditions,
    sources,
    lastVerified: judged.verified_at,
    ruleVersion: versionOf(data),
    disclaimer: DISCLAIMER,
  };
}

function tokenEligibility(data, input) {
  const { country, residency, asset: selector } = input;
  if (residency === "resident") {
    return unverified({
      ruleId: tokenRuleId(country, residency, selector.id || selector.symbol), data,
      reasons: ["The current Vestail rule set does not distinguish residents from citizens or foreigners."],
    });
  }
  if (!data.countryByCode[country]) throw new ApiError(400, "invalid_country", `country: Unsupported country '${country}'.`);
  const board = data.tokens.board(selector.symbol.toUpperCase(), country, residency, data.core);
  if (!board) throw new ApiError(400, "invalid_asset", `asset.symbol: Unknown tokenized asset symbol '${selector.symbol}'.`);
  const matches = selector.id
    ? board.tokens.filter(token => token.address === selector.id || token.mint === selector.id || token.token_symbol === selector.id)
    : board.tokens;
  if (matches.length !== 1) {
    throw new ApiError(400, "ambiguous_asset", selector.id
      ? `asset.id: No unique issuer version matches '${selector.id}'.`
      : "asset.id: Required when a symbol has more than one issuer version.");
  }
  const token = matches[0];
  const ruleId = tokenRuleId(country, residency, token.address);
  const classSources = validSources(board.class_sources);
  const issuerSources = validSources(token.issuer?.evidence);
  const sources = [...new Map([...classSources, ...issuerSources].map(source => [source.url, source])).values()];
  const reasons = token.issuer?.evidence?.map(item => item.reason).filter(Boolean) || [];
  const conditions = token.status === "conditional"
    ? [token.issuer?.acknowledgement?.requires, token.issuer?.acknowledgement?.limit].filter(Boolean)
    : [];

  // The token verdict is the stricter of the class and issuer rules. Both
  // inputs therefore need provenance before the combined result is verified.
  if (token.status === null || classSources.length === 0 || issuerSources.length === 0) {
    return unverified({ ruleId, data, reasons, sources, ruleVersion: token.issuer?.policy_version || versionOf(data) });
  }
  return {
    ruleId,
    verdict: PUBLIC_VERDICT[token.status],
    reasons: reasons.length ? reasons : [`The sourced issuer and asset-class rules classify this version as ${PUBLIC_VERDICT[token.status]}.`],
    conditions,
    sources,
    lastVerified: board.class_verified_at,
    ruleVersion: `${versionOf(data)}+${token.issuer.policy_version}`,
    disclaimer: DISCLAIMER,
  };
}

export function createEligibility(data) {
  const normalize = input => ({
    ...input,
    country: input.country.toUpperCase(),
    asset: { ...input.asset, class: input.asset.class.toLowerCase() },
  });

  function check(value) {
    const input = normalize(value);
    return input.asset.symbol
      ? tokenEligibility(data, input)
      : classEligibility(data, { country: input.country, residency: input.residency, assetId: input.asset.id || input.asset.class });
  }

  function assets(country, residency) {
    const profile = { country: country.toUpperCase(), residency };
    const classes = data.raw.assets.map(asset => ({
      asset: { class: asset.id, id: asset.id, name: asset.name, type: "asset_class" },
      ...check({ ...profile, asset: { class: asset.id, id: asset.id } }),
    }));
    if (residency === "resident") return classes;
    const tokens = [];
    for (const symbol of data.tokens.list()) {
      const board = data.tokens.board(symbol.symbol, profile.country, residency, data.core);
      if (!board) continue;
      for (const token of board.tokens) {
        tokens.push({
          asset: {
            class: board.asset,
            symbol: symbol.symbol,
            id: token.address,
            name: token.name,
            type: "tokenized_asset",
            issuer: token.provider,
            chain: token.chain,
            tokenSymbol: token.token_symbol,
          },
          ...check({ ...profile, asset: { class: board.asset, symbol: symbol.symbol, id: token.address } }),
        });
      }
    }
    return [...classes, ...tokens];
  }

  function countries() {
    return data.core.COUNTRIES.map(country => {
      let sourced = 0;
      let unverified = 0;
      for (const residency of ["citizen", "foreigner"]) {
        for (const asset of data.raw.assets) {
          const result = classEligibility(data, { country: country.code, residency, assetId: asset.id });
          result.verdict === "unverified" ? unverified++ : sourced++;
        }
      }
      return { code: country.code, name: country.name, sourced, unverified, total: sourced + unverified };
    });
  }

  function rule(id) {
    const [kind, country, residency, ...rest] = id.split(":");
    if (!kind || !country || !residency || !rest.length) throw new ApiError(404, "rule_not_found", `No rule '${id}'.`);
    let current;
    if (kind === "class") current = check({ country, residency, asset: { class: rest.join(":"), id: rest.join(":") } });
    else if (kind === "token") {
      const address = decodeURIComponent(rest.join(":"));
      const found = data.tokens.token(address, country, residency, data.core);
      if (!found) throw new ApiError(404, "rule_not_found", `No rule '${id}'.`);
      current = check({ country, residency, asset: { class: data.idByName[found.asset], symbol: found.symbol, id: address } });
    } else throw new ApiError(404, "rule_not_found", `No rule '${id}'.`);
    return { ...current, history: current.lastVerified ? [{ at: current.lastVerified, verdict: current.verdict, ruleVersion: current.ruleVersion, sources: current.sources }] : [] };
  }

  return { check, assets, countries, rule };
}
