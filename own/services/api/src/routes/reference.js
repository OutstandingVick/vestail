/** Static lists: /assets, /categories, /countries. */
export function registerReference(v1, { v, data }) {
  const { raw, own, idByName } = data;

  const assets = raw.assets.map(({ id, index, name }) => ({ id, index, name }));
  const categories = raw.categories.categories.map(c => ({ id: c.id, name: c.name, assets: c.assets.map(n => idByName[n]) }));
  const countries = own.COUNTRIES.map(({ code, name, flag }) => ({ code, name, flag }));

  v.route(v1, "get", "/assets", c => c.json(assets));
  v.route(v1, "get", "/categories", c => c.json(categories));
  v.route(v1, "get", "/countries", c => c.json(countries));
}
