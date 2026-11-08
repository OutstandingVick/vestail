import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { kvCommand } from "./kv.ts";

// Use KV when configured and local files only for development.
export interface WatchItem { asset: string; symbol?: string; added: string }
export interface Snapshot { day: string; usd: number }
export interface UserData { watchlist: WatchItem[]; snapshots: Snapshot[] }

const UNAVAILABLE = "Your watchlist and portfolio history are unavailable.";

const DIR = () => path.resolve(process.env.VESTAIL_DATA_DIR || ".data");
const safeId = (userId: string) => userId.replace(/[^a-zA-Z0-9_-]/g, "_");
const fileFor = (userId: string) => path.join(DIR(), `${safeId(userId)}.json`);
const keyFor = (userId: string) => `vestail:user:${safeId(userId)}`;

function shape(data: unknown): UserData {
  const d = (data ?? {}) as Partial<UserData>;
  return {
    watchlist: Array.isArray(d.watchlist) ? d.watchlist : [],
    snapshots: Array.isArray(d.snapshots) ? d.snapshots : [],
  };
}

export async function readUser(userId: string): Promise<UserData> {
  const stored = await kvCommand(["GET", keyFor(userId)], UNAVAILABLE);
  if (stored) {
    if (typeof stored.result !== "string") return shape(null);
    try { return shape(JSON.parse(stored.result)); } catch { return shape(null); }
  }

  try {
    return shape(JSON.parse(await readFile(fileFor(userId), "utf8")));
  } catch {
    return shape(null);
  }
}

export async function writeUser(userId: string, data: UserData): Promise<void> {
  const stored = await kvCommand(["SET", keyFor(userId), JSON.stringify(data)], UNAVAILABLE);
  if (stored) return;

  await mkdir(DIR(), { recursive: true });
  // Rename an entire temporary file so interrupted writes cannot corrupt user data.
  const tmp = fileFor(userId) + ".tmp";
  await writeFile(tmp, JSON.stringify(data));
  await rename(tmp, fileFor(userId));
}

export function withSnapshot(data: UserData, usd: number, now = new Date()): UserData {
  const day = now.toISOString().slice(0, 10);
  const snapshots = [...data.snapshots.filter(s => s.day !== day), { day, usd }].sort((a, b) => a.day.localeCompare(b.day)).slice(-366);
  return { ...data, snapshots };
}
