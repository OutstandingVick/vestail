import { Hono } from "hono";
import { loadData } from "./data.js";
import { onError, notFound } from "./errors.js";

/** Build the API. Everything it needs is injected so tests can run it in-process. */
export function createApp({ data = loadData() } = {}) {
  const app = new Hono();
  const v1 = new Hono();

  v1.get("/health", c => c.json({ ok: true }));

  app.route("/v1", v1);
  app.onError(onError);
  app.notFound(notFound);
  return app;
}
