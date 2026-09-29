/** Convert core results (asset names, trail objects, perCountry functions) to spec shapes. */

export const entityOut = (e, idByName) => ({
  name: e.name, kind: e.kind, ...(e.home && { home: e.home }), asset: idByName[e.asset] || e.asset,
});

export function resolutionOut(r, { own, idByName }) {
  const out = {
    stage: r.stage,
    assets: r.assets.map(i => idByName[own.ASSETS[i]]),
    trail: r.trail.map(t => t.label),
    note: r.note || "",
  };
  if (r.entity) out.entity = entityOut(r.entity, idByName);
  if (r.perCountry) out.perCountry = { rule: r.entity.asset, home: r.entity.home };
  return out;
}
