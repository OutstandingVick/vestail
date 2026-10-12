import "server-only";

import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { EarlyAccessSignup } from "@/lib/early-access-schema";

const localFile = () => path.resolve(process.env.VESTAIL_EARLY_ACCESS_FILE || ".data/early-access.jsonl");
const keyFor = (email: string) => `vestail:early-access:${createHash("sha256").update(email.toLowerCase()).digest("hex")}`;

export async function saveEarlyAccess(signup: EarlyAccessSignup): Promise<"created" | "duplicate"> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const response = await fetch(`${url}/set/${encodeURIComponent(keyFor(signup.email))}/${encodeURIComponent(JSON.stringify(signup))}/nx`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Early access storage is unavailable.");
    const body = await response.json() as { result: "OK" | null };
    return body.result === "OK" ? "created" : "duplicate";
  }
  const file = localFile();
  await mkdir(path.dirname(file), { recursive: true });
  const existing = await readFile(file, "utf8").catch(() => "");
  const duplicate = existing.split("\n").some(line => {
    try { return (JSON.parse(line) as EarlyAccessSignup).email.toLowerCase() === signup.email.toLowerCase(); } catch { return false; }
  });
  if (duplicate) return "duplicate";
  await appendFile(file, `${JSON.stringify(signup)}\n`, { encoding: "utf8", mode: 0o600 });
  return "created";
}
