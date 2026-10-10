import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * GET / — the marketing site, served from v2/app/index.html as it is on disk,
 * so the page edited there is always the page served here (no copy to drift).
 * The site and the app share one origin: its "Open App" buttons go to /app.
 */
const SITE = path.resolve(process.cwd(), "../app/index.html");

export async function GET() {
  return new Response(await readFile(SITE), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
