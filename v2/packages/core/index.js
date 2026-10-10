/**
 * vestail-core — the resolution pipeline and rule lookup, decoupled from the UI.
 *
 * Usage:
 *   import { createVestail } from "./index.js";
 *   const core = createVestail({ assets, categories, aliases, entities, countries, venues });
 *   core.resolve("Google")            -> { assets:[3,4], perCountry, trail, note }
 *   core.matrix("Google", "citizen")  -> rows for every country, one status each
 *   core.venues("cryptocurrency", "NG")
 *   core.rule("NG", "citizen", "Cryptocurrency") -> { status, statusKey, sources, verified_at }
 *
 * All data is passed in; nothing is hard-coded. Feed it the JSON files in /data
 * or your own database rows shaped the same way (see /data/schema).
 */

export const STATUS = { 2: "can_own", 1: "conditional", 0: "cannot_own" };
export const STATUS_LABEL = { 2: "Can own", 1: "Conditional", 0: "Cannot own" };

const STOP = new Set(["a","an","the","some","any","my","i","can","could","want","to","own","owning","buy","buying","purchase","hold","holding","in","of","for","as","is","it","do","does","allowed","get","have"]);

export const norm = s => String(s).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9&+\- ]/g, " ").replace(/\s+/g, " ").trim();

export function editDistance(a, b) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}

/** 3 exact, 2 prefix (whole or any word), 1 substring or small typo, 0 miss */
export function fuzzyHit(query, name) {
  const q = norm(query), n = norm(name);
  if (!q) return 0;
  if (n === q) return 3;
  if (n.startsWith(q) || n.split(" ").some(w => w.startsWith(q))) return 2;
  if (n.includes(q)) return 1;
  if (q.length >= 4 && editDistance(q, n) <= Math.floor(q.length / 4)) return 1;
  return 0;
}

export function createVestail(data) {
  const ASSETS = data.assets.map(a => (typeof a === "string" ? a : a.name));
  const A = Object.fromEntries(ASSETS.map((a, i) => [a, i]));
  const catSrc = data.categories.categories || data.categories;
  const CATEGORIES = Array.isArray(catSrc) ? Object.fromEntries(catSrc.map(c => [c.name, c.assets])) : catSrc;
  const ALIASES = data.aliases.aliases || data.aliases;
  const ENTITIES = data.entities.entities || data.entities;
  const ASSET_IDS = data.assets.map(a => (typeof a === "string" ? null : a.id));

  /**
   * One buyer type's rules as a status array in asset order, plus provenance.
   * Keyed rules ({ asset_id: { status, sources, verified_at } }) are the data
   * format; positional arrays are still accepted for the inline app data.
   * A keyed set must cover exactly the known assets, so a missing or misspelt
   * asset fails at load instead of shifting every rule after it.
   */
  function ruleRow(rules, where) {
    if (Array.isArray(rules)) {
      if (rules.length !== ASSETS.length) throw new Error(`${where}: expected ${ASSETS.length} rules, got ${rules.length}`);
      return { statuses: rules, provenance: rules.map(() => ({ sources: [], verified_at: null })) };
    }
    if (ASSET_IDS.includes(null)) throw new Error(`${where}: keyed rules need assets with ids`);
    const extra = Object.keys(rules).filter(k => !ASSET_IDS.includes(k));
    if (extra.length) throw new Error(`${where}: unknown asset ${extra.join(", ")}`);
    const rows = ASSET_IDS.map(id => {
      const r = rules[id];
      if (!r) throw new Error(`${where}: no rule for ${id}`);
      if (![0, 1, 2].includes(r.status)) throw new Error(`${where}.${id}: status must be 0, 1 or 2`);
      return r;
    });
    return { statuses: rows.map(r => r.status), provenance: rows.map(r => ({ sources: r.sources || [], verified_at: r.verified_at ?? null })) };
  }

  const COUNTRIES = (data.countries.countries || data.countries).map(c => {
    const src = c.rules || c;
    const citizen = ruleRow(src.citizen, `${c.code}.citizen`), foreigner = ruleRow(src.foreigner, `${c.code}.foreigner`);
    return { code: c.code, name: c.name, flag: c.flag, citizen: citizen.statuses, foreigner: foreigner.statuses,
      provenance: { citizen: citizen.provenance, foreigner: foreigner.provenance } };
  });
  const VENUES = data.venues ? (data.venues.venues || data.venues) : {};
  const REF = data.venues && data.venues.ref ? data.venues.ref : null;

  const assetsOf = names => names.map(n => A[n]);

  // Stage 1 — named entity
  function stageEntity(q) {
    let best = null, bestScore = 0;
    for (const e of ENTITIES) { const s = fuzzyHit(q, e.name); if (s > bestScore) { best = e; bestScore = s; } }
    if (!best || bestScore < 1) return null;
    const trail = [{ label: best.name }, { label: best.kind + (best.home ? ` (${best.home})` : "") }];
    if (best.asset === "equity-by-home") {
      trail.push({ label: "Equities" }, { label: `Domestic in ${best.home}, foreign elsewhere` });
      return { stage: "entity", entity: best, assets: assetsOf(["Domestic equities", "Foreign equities"]),
        perCountry: c => [c.code === best.home ? A["Domestic equities"] : A["Foreign equities"]], trail,
        note: `${best.name} is a listed company from ${best.home}, so it counts as domestic equity there and foreign equity everywhere else.` };
    }
    trail.push({ label: best.asset });
    return { stage: "entity", entity: best, assets: [A[best.asset]], trail, note: `${best.name} is a ${best.kind.toLowerCase()}, governed by the ${best.asset.toLowerCase()} rule.` };
  }
  // Stage 2 — alias
  function stageAlias(q) {
    const nq = norm(q); let bestKey = null, bestScore = 0;
    for (const key of Object.keys(ALIASES)) { const s = fuzzyHit(nq, key); if (s > bestScore) { bestKey = key; bestScore = s; } }
    if (!bestKey || bestScore < 1) return null;
    const target = ALIASES[bestKey];
    if (CATEGORIES[target]) return { stage: "alias", assets: assetsOf(CATEGORIES[target]), trail: [{ label: bestKey }, { label: target }, { label: `${CATEGORIES[target].length} asset classes` }], note: `“${bestKey}” is a category, so all ${target.toLowerCase()} classes are shown.` };
    return { stage: "alias", assets: [A[target]], trail: [{ label: bestKey }, { label: target }], note: `“${bestKey}” maps to the ${target.toLowerCase()} rule.` };
  }
  // Stage 3 — category
  function stageCategory(q) {
    for (const cat of Object.keys(CATEGORIES)) if (fuzzyHit(q, cat) >= 1)
      return { stage: "category", assets: assetsOf(CATEGORIES[cat]), trail: [{ label: cat }, { label: `${CATEGORIES[cat].length} asset classes` }], note: "" };
    return null;
  }
  // Stage 4 — asset name
  function stageAsset(q) {
    const hits = ASSETS.map((a, i) => ({ i, s: fuzzyHit(q, a) })).filter(h => h.s > 0);
    if (!hits.length) return null;
    const top = Math.max(...hits.map(h => h.s)); const idx = hits.filter(h => h.s === top).map(h => h.i);
    return { stage: "asset", assets: idx, trail: [{ label: idx.length === 1 ? ASSETS[idx[0]] : `${idx.length} asset names match` }], note: "" };
  }
  const runStages = q => stageEntity(q) || stageAlias(q) || stageCategory(q) || stageAsset(q);
  function cleanQuery(query) {
    const kept = norm(query).split(" ").filter(w => w && !STOP.has(w));
    return { full: kept.join(" "), tokens: kept.slice().sort((a, b) => b.length - a.length) };
  }

  /** Resolve free text to asset indices (+ a trail explaining how). */
  function resolve(query) {
    const empty = { stage: "none", assets: [], trail: [], note: "" };
    if (!query || !query.trim()) return { ...empty, stage: "all", assets: ASSETS.map((_, i) => i) };
    const { full, tokens } = cleanQuery(query);
    let r = full ? runStages(full) : null;
    if (!r && tokens.length > 1) for (const t of tokens) { r = stageEntity(t); if (r) break; }
    if (!r && tokens.length > 1) for (const t of tokens) { r = runStages(t); if (r) break; }
    if (!r) return empty;
    r.trail = r.trail.filter((t, i, arr) => !i || t.label !== arr[i - 1].label);
    r.assetNames = r.assets.map(i => ASSETS[i]);
    return r;
  }

  /** Venues for one asset (index or name) in one country, with the ref tag applied. */
  function venues(asset, code) {
    const name = typeof asset === "number" ? ASSETS[asset] : asset;
    const v = VENUES[name] || { default: [] };
    return (v[code] || v.default || []).map(x => ({ ...x, url: x.url && REF ? x.url + (x.url.includes("?") ? "&" : "?") + REF : x.url }));
  }

  /** Full matrix for a query + buyer type: one row per country. */
  function matrix(query = "", who = "citizen", { sortByStatus = true } = {}) {
    const res = resolve(query);
    const rows = COUNTRIES.map(c => {
      const idx = res.perCountry ? res.perCountry(c) : res.assets;
      let cells = idx.map(i => ({ asset: ASSETS[i], index: i, status: c[who][i], statusKey: STATUS[c[who][i]] }));
      if (sortByStatus) cells = cells.slice().sort((a, b) => b.status - a.status || a.index - b.index);
      const count = k => cells.filter(x => x.status === k).length;
      const cta = cells.length === 1 ? { asset: cells[0].asset, status: cells[0].statusKey, venues: cells[0].status ? venues(cells[0].index, c.code) : [] } : null;
      return { code: c.code, name: c.name, flag: c.flag, who, cells, summary: { can_own: count(2), conditional: count(1), cannot_own: count(0) }, cta };
    });
    if (sortByStatus) rows.sort((a, b) => b.summary.can_own - a.summary.can_own || a.summary.cannot_own - b.summary.cannot_own || a.name.localeCompare(b.name));
    return { query, who, resolution: { stage: res.stage, trail: res.trail, note: res.note, assets: res.assetNames || [] }, rows };
  }

  /** One rule with its provenance, or null for an unknown country or asset (index or name). */
  function rule(code, who, asset) {
    const c = COUNTRIES.find(x => x.code === code);
    const i = typeof asset === "number" ? asset : A[asset];
    if (!c || i === undefined || !c[who]) return null;
    const status = c[who][i];
    return { status, statusKey: STATUS[status], ...c.provenance[who][i] };
  }

  return { ASSETS, COUNTRIES, resolve, venues, matrix, rule, stages: { stageEntity, stageAlias, stageCategory, stageAsset } };
}
