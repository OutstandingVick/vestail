import "server-only";

import type { CreateAppOptions, HonoLike } from "@vestail/api";

// Run the real Hono API in-process with an internal key and no network limiter.
const INTERNAL_KEY = "vestail-internal";

const OPTIONS: CreateAppOptions = {
  apiKeys: [INTERNAL_KEY],
  limiter: (_c, next) => next(),
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
