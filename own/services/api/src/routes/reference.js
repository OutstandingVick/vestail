import { fuzzyHit, norm } from "@own/core";
import { entityOut } from "../shape.js";

/** Static lists: /assets, /categories, /countries, /entities. */
export function registerReference(v1, { v, data }) {
  const { raw, own, idByName } = data;

  const assets = raw.assets.map(({ id, index, name }) => ({ id, index, name }));
  const categories = raw.categories.categories.map(c => ({ id: c.id, name: c.name, assets: c.assets.map(n => idByName[n]) }));
  const countries = own.COUNTRIES.map(({ code, name, flag }) => ({ code, name, flag }));

  v.route(v1, "get", "/assets", c => c.json(assets));
  v.route(v1, "get", "/categories", c => c.json(categories));
  v.route(v1, "get", "/countries", c => c.json(countries));

  v.route(v1, "get", "/entities", (c, { params: { q, kind } }) => {
    let list = raw.entities.entities;
    if (kind) list = list.filter(e => norm(e.kind) === norm(kind));
    if (q) list = list.map(e => ({ e, s: fuzzyHit(q, e.name) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.e);
    return c.json(list.map(e => entityOut(e, idByName)));
  });
}
