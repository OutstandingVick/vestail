import "server-only";

import type { CreateAppOptions, HonoLike } from "@vestail/api";

// Run the real Hono API in-process with an internal key and no network limiter.
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

// Keep the import dynamic so Next traces the API's runtime data files instead of bundling them.
let pending: Promise<HonoLike> | null = null;

function getApp(): Promise<HonoLike> {
  pending ??= import(/* webpackIgnore: true */ "@vestail/api").then(m => m.createApp(OPTIONS));
  return pending;
}

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
