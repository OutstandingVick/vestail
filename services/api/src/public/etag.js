import { createHash } from "node:crypto";

export async function etag(c, next) {
  await next();
  if (c.req.method !== "GET" || c.res.status !== 200) return;
  const body = await c.res.clone().arrayBuffer();
  const tag = `"${createHash("sha256").update(Buffer.from(body)).digest("base64url")}"`;
  if (c.req.header("If-None-Match") === tag) {
    c.res = new Response(null, { status: 304, headers: c.res.headers });
    c.res.headers.set("ETag", tag);
    return;
  }
  c.res.headers.set("ETag", tag);
  c.res.headers.set("Cache-Control", "private, max-age=300, must-revalidate");
}
