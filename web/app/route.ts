import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * GET / — the marketing site, served from site/index.html as it is on disk,
 * so the page edited there is always the page served here (no copy to drift).
 * The site and the app share one origin: its "Open App" buttons go to /app.
 */
const SITE = path.resolve(process.cwd(), "../site/index.html");

/*
 * Read once per instance. The file is baked into the deployment and cannot
 * change under a running server, so re-reading it per request buys nothing.
 */
let cached: Promise<string> | null = null;

export async function GET() {
  cached ??= readFile(SITE, "utf8");
  return new Response(await cached, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      /*
       * This was no-store, so every visit woke a function and the CDN held
       * nothing — 919ms to first byte on mobile, before a single pixel could
       * be drawn. The page is a static file inside the deployment: it changes
       * when we deploy, never between deploys.
       *
       * So the edge may keep it for a day and serve a stale copy for a week
       * while it revalidates. Browsers still revalidate every time (max-age=0),
       * which keeps a returning visitor from pinning an old page.
       */
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
