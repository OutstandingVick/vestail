import { Hono } from "hono";
import { loadData } from "./data.js";
import { onError, notFound } from "./errors.js";
import { loadSpec } from "./spec.js";
import { createValidator } from "./validate.js";
import { cacheControl } from "./cache.js";
import { registerReference } from "./routes/reference.js";
import { registerResolve } from "./routes/resolve.js";

/** Build the API. Everything it needs is injected so tests can run it in-process. */
export function createApp({ data = loadData(), spec = loadSpec() } = {}) {
  const app = new Hono();
  const v1 = new Hono();
  const ctx = { v: createValidator(spec), data };

  app.use(cacheControl);
  v1.get("/health", c => c.json({ ok: true }));
  v1.get("/openapi.json", c => c.json(spec));
  registerReference(v1, ctx);
  registerResolve(v1, ctx);

  app.route("/v1", v1);
  app.onError(onError);
  app.notFound(notFound);
  return app;
}
