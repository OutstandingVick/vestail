import { resolutionOut } from "../shape.js";

/** GET /resolve?q= — text to asset classes, always with the trail. */
export function registerResolve(v1, { v, data }) {
  v.route(v1, "get", "/resolve", (c, { params: { q } }) => c.json(resolutionOut(data.own.resolve(q), data)));
}
