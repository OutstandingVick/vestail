import { Hono } from "hono";

/** Build the API. Everything it needs is injected so tests can run it in-process. */
export function createApp() {
  const app = new Hono();
  const v1 = new Hono();

  v1.get("/health", c => c.json({ ok: true }));

  app.route("/v1", v1);
  return app;
}
