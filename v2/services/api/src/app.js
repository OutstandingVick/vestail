import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadData } from "./data.js";
import { onError, notFound } from "./errors.js";
import { loadSpec } from "./spec.js";
import { createValidator } from "./validate.js";
import { cacheControl } from "./cache.js";
import { createClickLog } from "./clicks.js";
import { registerReference } from "./routes/reference.js";
import { registerResolve } from "./routes/resolve.js";
import { registerMatrix } from "./routes/matrix.js";
import { registerRules } from "./routes/rules.js";
import { registerVenues } from "./routes/venues.js";
import { registerActivity } from "./routes/activity.js";
import { registerOrders } from "./routes/orders.js";
import { registerTokens } from "./routes/tokens.js";
import { registerDerivatives } from "./routes/derivatives.js";
import { createAuth, keysFromEnv } from "./auth.js";
import { rateLimit } from "./ratelimit.js";

/** Build the API. Everything it needs is injected so tests can run it in-process. */
export function createApp({
  data = loadData(),
  spec = loadSpec(),
  clicks = createClickLog({ file: process.env.VESTAIL_CLICKS_FILE || null }),
  useSample = process.env.NODE_ENV !== "production",
  apiKeys = keysFromEnv(),
  limiter = rateLimit({ limit: Number(process.env.VESTAIL_RATE_LIMIT) || 120 }),
  corsOrigins = (process.env.VESTAIL_CORS_ORIGINS || "*").split(",").map(s => s.trim()),
} = {}) {
  const app = new Hono();
  const v1 = new Hono();
  const ctx = { v: createValidator(spec), data, clicks, useSample, auth: createAuth(apiKeys) };

  // Browsers call the API from the Vestail page, which may be another origin or a
  // file:// page (Origin: null). Auth is a bearer header, not cookies, so "*" is safe.
  app.use(cors({
    origin: corsOrigins.includes("*") ? "*" : corsOrigins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  }));
  app.use(limiter);
  app.use(cacheControl);
  v1.get("/health", c => c.json({ ok: true }));
  v1.get("/openapi.json", c => c.json(spec));
  registerReference(v1, ctx);
  registerResolve(v1, ctx);
  registerMatrix(v1, ctx);
  registerRules(v1, ctx);
  registerVenues(v1, ctx);
  registerActivity(v1, ctx);
  registerTokens(v1, ctx);
  registerDerivatives(v1, ctx);
  registerOrders(v1, ctx);

  app.route("/v1", v1);
  app.onError(onError);
  app.notFound(notFound);
  return app;
}
