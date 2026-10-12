/**
 * Minimal declarations for @vestail/api, which ships as plain ESM JavaScript.
 *
 * Only the surface lib/server/local-api.ts uses is described. The response
 * bodies stay untyped here on purpose: their shapes come from
 * docs/api/openapi.yaml and are declared in lib/types.ts, which is what the
 * callers assert against.
 */
declare module "@vestail/api" {
  export interface HonoLike {
    fetch(request: Request): Promise<Response>;
  }

  export interface CreateAppOptions {
    /** Keys accepted as `Authorization: Bearer <key>` on click recording. */
    apiKeys?: string[];
    /** Hono middleware. Pass a pass-through to disable per-IP limiting. */
    limiter?: (c: unknown, next: () => Promise<void>) => unknown;
    /** Serve the sample activity figures. Defaults to NODE_ENV !== "production". */
    useSample?: boolean;
    corsOrigins?: string[];
  }

  export function createApp(options?: CreateAppOptions): HonoLike;
}
