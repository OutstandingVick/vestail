import "server-only";

import type { CreateAppOptions, HonoLike } from "@vestail/api";

/**
 * The v2 API, running inside this process.
 *
 * `services/api` is a Hono app, and a Hono app is just a function from Request
 * to Response — so the web app calls it directly instead of over HTTP. There is
 * no second service to deploy, no port to keep alive, no CORS, no API key on the
 * wire, and no network hop inside a serverless function. The API's own comment
 * says everything it needs is injected "so tests can run it in-process"; this is
 * the same door, used in production.
 *
 * It matters that this is the real API and not a reimplementation. The contract
 * is validated against docs/api/openapi.yaml at request time, and the contract
 * test calls every operation in the spec. A second hand-written client would be
 * a second thing to keep in step with the rules, and the rules are the product.
 *
 * Two things are injected rather than defaulted:
 *
 * - The rate limiter. It keys on the client IP via @hono/node-server's
 *   getConnInfo, and in-process there is no socket to read, so every request
 *   would fall into one "unknown" bucket and the whole site would start
 *   returning 429 after 120 reads a minute. Requests that reach here have
 *   already been served by this server; there is no untrusted caller to limit.
 * - The API key. Click recording is key-gated so partners can be told apart.
 *   The caller here is this server, so it gets one key that exists only in
 *   memory and never leaves the process.
 */
const INTERNAL_KEY = "vestail-internal";

/*
 * /api/v1 (the partner API, which serves /utilities) authenticates partner
 * keys from its own store. In-process the caller is this server, so it gets a
 * store that knows one in-memory key and nothing else: no partner key is
 * read, written or counted.
 */
const INTERNAL_PARTNER_KEY = "vestail-internal-partner";
const internalPartnerStore: NonNullable<CreateAppOptions["partnerKeyStore"]> = {
  authenticate: async key => (key === INTERNAL_PARTNER_KEY ? { id: "vestail-web", rateLimit: Number.MAX_SAFE_INTEGER } : null),
  countUsage: async () => undefined,
};

const OPTIONS: CreateAppOptions = {
  apiKeys: [INTERNAL_KEY],
  limiter: (_c, next) => next(),
  partnerKeyStore: internalPartnerStore,
};

/*
 * Loaded at runtime rather than bundled. The API finds the rule data and the
 * OpenAPI contract with new URL(..., import.meta.url); webpack reads that as an
 * asset reference and tries to resolve it at build time, which fails on a
 * directory and on a .yaml. webpackIgnore leaves the import alone, so Node
 * resolves the package normally and those paths mean what they say. The files
 * are named in next.config.ts under outputFileTracingIncludes, because nothing
 * in the bundle points at them for the tracer to follow.
 *
 * Built once per function instance and reused: loadData() parses every rule
 * file and loadSpec() parses the OpenAPI document, which is not work to repeat
 * per request.
 */
let pending: Promise<HonoLike> | null = null;

function getApp(): Promise<HonoLike> {
  pending ??= import(/* webpackIgnore: true */ "@vestail/api").then(m => m.createApp(OPTIONS));
  return pending;
}

/** The origin is never dialled; Request just requires an absolute URL. */
const ORIGIN = "http://api.vestail.internal";

export async function callApi(path: string, init?: RequestInit): Promise<Response> {
  const app = await getApp();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${INTERNAL_KEY}`);
  return app.fetch(new Request(ORIGIN + "/v1" + path, { ...init, headers }));
}

/** The partner API (/api/v1), for the endpoints the web app shows, such as /utilities. */
export async function callPublicApi(path: string): Promise<Response> {
  const app = await getApp();
  return app.fetch(new Request(ORIGIN + "/api/v1" + path, { headers: { Authorization: `Bearer ${INTERNAL_PARTNER_KEY}` } }));
}
