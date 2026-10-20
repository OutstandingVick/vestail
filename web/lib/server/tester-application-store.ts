import "server-only";

import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { TesterApplication } from "@/lib/tester-application-schema";

export type SaveTesterResult = "created" | "duplicate_email" | "duplicate_wallet";

const localFile = () => path.resolve(process.env.VESTAIL_TESTER_APPLICATIONS_FILE || ".data/tester-applications.jsonl");
const digest = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
const emailKey = (email: string) => `vestail:tester_applications:email:${digest(email)}`;
const walletKey = (wallet: string) => `vestail:tester_applications:wallet:${digest(wallet)}`;
const rowKey = (row: TesterApplication) => `vestail:tester_applications:row:${row.created_at}:${digest(row.email).slice(0, 12)}`;

async function readLocal(): Promise<TesterApplication[]> {
  const contents = await readFile(localFile(), "utf8").catch(() => "");
  return contents.split("\n").flatMap(line => {
    try { return line ? [JSON.parse(line) as TesterApplication] : []; }
    catch { return []; }
  });
}

function localDuplicateEmail(rows: TesterApplication[], email: string): boolean {
  return rows.some(row => row.email.toLowerCase() === email.toLowerCase());
}

function localDuplicateWallet(rows: TesterApplication[], wallet: string): boolean {
  return rows.some(row => row.wallet === wallet);
}

async function saveLocal(application: TesterApplication): Promise<SaveTesterResult> {
  const rows = await readLocal();
  if (localDuplicateEmail(rows, application.email)) return "duplicate_email";
  if (localDuplicateWallet(rows, application.wallet)) return "duplicate_wallet";
  const file = localFile();
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(application)}\n`, { encoding: "utf8", mode: 0o600 });
  return "created";
}

async function kvCommand<T>(url: string, token: string, command: string[]): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Tester application storage is unavailable.");
  return ((await response.json()) as { result: T }).result;
}

async function reserveKey(url: string, token: string, key: string): Promise<boolean> {
  return (await kvCommand<"OK" | null>(url, token, ["SET", key, "1", "NX"])) === "OK";
}

export async function saveTesterApplication(application: TesterApplication): Promise<SaveTesterResult> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return saveLocal(application);

  const email = emailKey(application.email);
  const wallet = walletKey(application.wallet);
  if (!(await reserveKey(url, token, email))) return "duplicate_email";
  if (!(await reserveKey(url, token, wallet))) {
    await kvCommand(url, token, ["DEL", email]);
    return "duplicate_wallet";
  }
  try {
    await kvCommand(url, token, ["SET", rowKey(application), JSON.stringify(application)]);
    return "created";
  } catch (error) {
    await Promise.allSettled([kvCommand(url, token, ["DEL", email]), kvCommand(url, token, ["DEL", wallet])]);
    throw error;
  }
}

/** Read applications for the private owner dashboard. Never expose this from a public route. */
export async function listTesterApplications(limit = 500): Promise<TesterApplication[]> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return (await readLocal())
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  const keys: string[] = [];
  let cursor = "0";
  do {
    const result = await kvCommand<[string, string[]]>(url, token, [
      "SCAN", cursor, "MATCH", "vestail:tester_applications:row:*", "COUNT", "100",
    ]);
    cursor = String(result[0]);
    keys.push(...result[1]);
  } while (cursor !== "0" && keys.length < limit);

  const rows = await Promise.all(keys.slice(0, limit).map(key => kvCommand<string | null>(url, token, ["GET", key])));
  return rows.flatMap(value => {
    try { return value ? [JSON.parse(value) as TesterApplication] : []; }
    catch { return []; }
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
