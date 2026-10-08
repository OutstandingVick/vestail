/** Cache-Control per docs/api/API.md: reference and the token list 24h, matrix, rules and token verdicts 1h, activity never. */
const POLICIES = [
  [/^\/v1\/(assets|categories|countries|entities|venues)(\/|$)/, "public, max-age=86400"],
  [/^\/v1\/(tokens|derivatives)$/, "public, max-age=86400"],
  [/^\/v1\/(matrix|rules|tokens|derivatives)(\/|$)/, "public, max-age=3600"],
  [/^\/v1\/activity$/, "no-store"],
];

export async function cacheControl(c, next) {
  await next();
  if (c.res.status >= 300) return;
  const hit = POLICIES.find(([re]) => re.test(c.req.path));
  if (hit) c.res.headers.set("Cache-Control", hit[1]);
}
