import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^([0-9a-f-]+)\.(jpg|png|webp)$/.exec(file);
  if (!match) return new NextResponse(null, { status: 404 });
  try {
    const body = await readFile(path.join(process.cwd(), ".data", "avatars", file));
    return new NextResponse(body, { headers: { "Content-Type": TYPES[match[2]!], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
