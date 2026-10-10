import { readFile } from "node:fs/promises";
import path from "node:path";

/** GET /assets/* — the marketing site's images, from v2/app/assets. Nothing outside that folder is served. */
const ROOT = path.resolve(process.cwd(), "../app/assets");
const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".gif": "image/gif",
};

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = path.resolve(ROOT, ...(await params).path);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!file.startsWith(ROOT + path.sep) || !type) return new Response("Not found", { status: 404 });
  try {
    return new Response(await readFile(file), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
