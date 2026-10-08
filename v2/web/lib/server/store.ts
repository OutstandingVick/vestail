import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A small per-user store for things that are the user's own and not rules:
 * their watchlist and their portfolio value history. One JSON file per user
 * under VESTAIL_DATA_DIR (default web/.data, git-ignored).
 *
 * Like the API's click file this suits one server instance; a hosted
 * database replaces it before there is more than one.
 */
export interface WatchItem { asset: string; symbol?: string; added: string }
export interface Snapshot { day: string; usd: number }
export interface UserData { watchlist: WatchItem[]; snapshots: Snapshot[] }

const DIR = path.resolve(process.env.VESTAIL_DATA_DIR || ".data");
const fileFor = (userId: string) => path.join(DIR, `${userId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);

export async function readUser(userId: string): Promise<UserData> {
  try {
    const data = JSON.parse(await readFile(fileFor(userId), "utf8"));
    return { watchlist: data.watchlist ?? [], snapshots: data.snapshots ?? [] };
  } catch {
    return { watchlist: [], snapshots: [] };
  }
}

export async function writeUser(userId: string, data: UserData): Promise<void> {
  await mkdir(DIR, { recursive: true });
  const tmp = fileFor(userId) + ".tmp";
  await writeFile(tmp, JSON.stringify(data));
  await rename(tmp, fileFor(userId));
}

/** Record today's value, one point per day (the latest visit that day wins), a year at most. */
export function withSnapshot(data: UserData, usd: number, now = new Date()): UserData {
  const day = now.toISOString().slice(0, 10);
  const snapshots = [...data.snapshots.filter(s => s.day !== day), { day, usd }].sort((a, b) => a.day.localeCompare(b.day)).slice(-366);
  return { ...data, snapshots };
}
