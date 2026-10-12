import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESERVATION_TTL_MS = 15 * 60 * 1000;
const PREFIX = "vestail:invite";

export type InviteStatus = "active" | "redeemed" | "revoked" | "expired";
export type InviteRecord = { id: string; hint: string; createdAt: string; expiresAt: string; status: InviteStatus; redeemedAt?: string; revokedAt?: string };

const hashCode = (code: string) => createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
const localRoot = () => path.resolve(process.env.VESTAIL_INVITES_DIR || ".data/invites");
const localPath = (status: Exclude<InviteStatus, "expired">, hash: string) => path.join(localRoot(), status, `${hash}.json`);
const keyFor = (status: Exclude<InviteStatus, "expired">, hash: string) => `${PREFIX}:${status}:${hash}`;
const lockKey = (hash: string) => `${PREFIX}:reserved:${hash}`;
const lockPath = (hash: string) => path.join(localRoot(), "reserved", `${hash}.json`);

function generateCode() {
  const raw = randomBytes(12).toString("hex").toUpperCase().slice(0, 12);
  return `VESTAIL-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function withComputedStatus(record: InviteRecord): InviteRecord {
  return record.status === "active" && Date.parse(record.expiresAt) <= Date.now() ? { ...record, status: "expired" } : record;
}

async function kv(command: string[]) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command), cache: "no-store" });
  if (!response.ok) throw new Error("Invitation storage is unavailable.");
  return response.json() as Promise<{ result: unknown }>;
}

async function saveActive(hash: string, record: InviteRecord) {
  const stored = await kv(["SET", keyFor("active", hash), JSON.stringify(record), "PX", String(CODE_TTL_MS), "NX"]);
  if (stored) return stored.result === "OK";
  const file = localPath("active", hash);
  await mkdir(path.dirname(file), { recursive: true });
  try { await writeFile(file, JSON.stringify(record), { encoding: "utf8", mode: 0o600, flag: "wx" }); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") return false; throw error; }
}

export async function generateInvites(count: number) {
  const invites: Array<InviteRecord & { code: string }> = [];
  while (invites.length < count) {
    const code = generateCode();
    const hash = hashCode(code);
    const createdAt = new Date();
    const record: InviteRecord = { id: randomUUID(), hint: `••••-${code.slice(-4)}`, createdAt: createdAt.toISOString(), expiresAt: new Date(createdAt.getTime() + CODE_TTL_MS).toISOString(), status: "active" };
    if (await saveActive(hash, record)) invites.push({ ...record, code });
  }
  return invites;
}

async function moveLocal(hash: string, status: "redeemed" | "revoked", record: InviteRecord) {
  const from = localPath("active", hash);
  const to = localPath(status, hash);
  await mkdir(path.dirname(to), { recursive: true });
  await rename(from, to);
  await writeFile(to, JSON.stringify(record), { encoding: "utf8", mode: 0o600 });
}

export async function reserveInvite(code: string) {
  const hash = hashCode(code);
  const stored = await kv(["GET", keyFor("active", hash)]);
  if (stored) {
    if (!stored.result) return null;
    const record = JSON.parse(String(stored.result)) as InviteRecord;
    if (Date.parse(record.expiresAt) <= Date.now()) return null;
    const lock = await kv(["SET", lockKey(hash), new Date().toISOString(), "PX", String(RESERVATION_TTL_MS), "NX"]);
    return lock?.result === "OK" ? hash : null;
  }

  const raw = await readFile(localPath("active", hash), "utf8").catch(() => "");
  const record = raw ? JSON.parse(raw) as InviteRecord : null;
  if (!record || Date.parse(record.expiresAt) <= Date.now()) return null;
  const file = lockPath(hash);
  await mkdir(path.dirname(file), { recursive: true });
  const existing = await readFile(file, "utf8").catch(() => "");
  if (existing && Date.parse(existing) + RESERVATION_TTL_MS > Date.now()) return null;
  await writeFile(file, new Date().toISOString(), { encoding: "utf8", mode: 0o600 });
  return hash;
}

export async function completeInvite(hash: string) {
  const stored = await kv(["GETDEL", keyFor("active", hash)]);
  let record: InviteRecord | null = stored ? (stored.result ? JSON.parse(String(stored.result)) as InviteRecord : null) : null;
  if (!stored) {
    const raw = await readFile(localPath("active", hash), "utf8").catch(() => "");
    record = raw ? JSON.parse(raw) as InviteRecord : null;
  }
  if (!record || Date.parse(record.expiresAt) <= Date.now()) return false;
  const redeemed = { ...record, status: "redeemed" as const, redeemedAt: new Date().toISOString() };
  if (stored) {
    await kv(["DEL", lockKey(hash)]);
    await kv(["SET", keyFor("redeemed", hash), JSON.stringify(redeemed)]);
  }
  else {
    await moveLocal(hash, "redeemed", redeemed).catch(() => { record = null; });
    await unlink(lockPath(hash)).catch(() => undefined);
  }
  return Boolean(record);
}

async function recordsFor(status: "active" | "redeemed" | "revoked") {
  const keys = await kv(["KEYS", `${PREFIX}:${status}:*`]);
  if (keys) {
    const names = (keys.result as string[]) ?? [];
    const rows = await Promise.all(names.map(async key => {
      const result = await kv(["GET", key]);
      return result?.result ? JSON.parse(String(result.result)) as InviteRecord : null;
    }));
    return rows.filter((row): row is InviteRecord => Boolean(row));
  }
  const directory = path.join(localRoot(), status);
  const files = await readdir(directory).catch(() => []);
  return Promise.all(files.filter(file => file.endsWith(".json")).map(async file => JSON.parse(await readFile(path.join(directory, file), "utf8")) as InviteRecord));
}

export async function listInvites() {
  const records = (await Promise.all([recordsFor("active"), recordsFor("redeemed"), recordsFor("revoked")])).flat();
  return records.map(withComputedStatus).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function revokeInvite(id: string) {
  const active = await recordsFor("active");
  const record = active.find(item => item.id === id);
  if (!record) return false;
  const keys = await kv(["KEYS", `${PREFIX}:active:*`]);
  if (keys) {
    for (const key of (keys.result as string[]) ?? []) {
      const value = await kv(["GET", key]);
      if (!value?.result || (JSON.parse(String(value.result)) as InviteRecord).id !== id) continue;
      const hash = key.split(":").at(-1)!;
      const removed = await kv(["GETDEL", key]);
      if (!removed?.result) return false;
      await kv(["SET", keyFor("revoked", hash), JSON.stringify({ ...record, status: "revoked", revokedAt: new Date().toISOString() })]);
      return true;
    }
    return false;
  }
  const directory = path.join(localRoot(), "active");
  const files = await readdir(directory).catch(() => []);
  for (const file of files) {
    const value = JSON.parse(await readFile(path.join(directory, file), "utf8")) as InviteRecord;
    if (value.id !== id) continue;
    await moveLocal(file.replace(/\.json$/, ""), "revoked", { ...record, status: "revoked", revokedAt: new Date().toISOString() });
    return true;
  }
  return false;
}
