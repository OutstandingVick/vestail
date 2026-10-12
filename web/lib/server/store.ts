import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { kvCommand } from "./kv.ts";

/**
 * A small per-user store for things that are the user's own and not rules:
 * their watchlist and their portfolio value history.
 *
 * Two backends, chosen by whether KV is configured. In production it is
 * Upstash/Vercel KV, one key per user; in development it is one JSON file per
 * user under VESTAIL_DATA_DIR (default web/.data, git-ignored).
 *
 * The file backend cannot be the production one. A serverless filesystem is
 * read-only outside /tmp, and /tmp belongs to a single instance and is thrown
 * away — so on a hosted deploy every watchlist add would fail and every
 * portfolio snapshot would vanish, which is exactly the kind of loss a user
 * notices and cannot explain. Invitations and early-access signups already
 * made this choice; this store was the one left behind.
 */
export interface WatchItem { asset: string; symbol?: string; added: string }
export interface Snapshot { day: string; usd: number }
export interface UserData { watchlist: WatchItem[]; snapshots: Snapshot[] }

const UNAVAILABLE = "Your watchlist and portfolio history are unavailable.";

const DIR = () => path.resolve(process.env.VESTAIL_DATA_DIR || ".data");
const safeId = (userId: string) => userId.replace(/[^a-zA-Z0-9_-]/g, "_");
const fileFor = (userId: string) => path.join(DIR(), `${safeId(userId)}.json`);
const keyFor = (userId: string) => `vestail:user:${safeId(userId)}`;

/** An empty user, and the shape anything read back is forced into. */
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
    // A key that was never written reads back as null, which is a new user.
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
  // Written to a temporary name and renamed, so a crash mid-write cannot leave
  // a half-written file where the user's watchlist used to be.
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
