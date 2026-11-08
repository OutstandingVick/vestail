import { readFile } from "node:fs/promises";
import path from "node:path";

const SITE = path.resolve(process.cwd(), "../site/index.html");

let cached: Promise<string> | null = null;

export async function GET() {
  const development = process.env.NODE_ENV !== "production";
  const html = development
    ? await readFile(SITE, "utf8")
    : await (cached ??= readFile(SITE, "utf8"));
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Deploys replace this file; let the CDN cache it while browsers revalidate.
      "Cache-Control": development
        ? "no-store"
        : "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
