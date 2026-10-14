import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const hashKey = key => createHash("sha256").update(key).digest("hex");
const identifier = hash => `key_${hash.slice(0, 12)}`;
const emptyState = () => ({ version: 1, keys: [], usage: {} });

export class MemoryKeyStore {
  constructor(state = emptyState(), now = () => new Date()) {
    this.state = structuredClone(state);
    this.now = now;
  }

  async load() { return this.state; }
  async save(state) { this.state = structuredClone(state); }

  async issue({ mode = "test", label = "Design partner", rateLimit = 60 } = {}) {
    const prefix = mode === "live" ? "vst_live_" : "vst_test_";
    const raw = prefix + randomBytes(24).toString("base64url");
    const hash = hashKey(raw);
    const state = await this.load();
    const record = {
      id: identifier(hash),
      hash,
      prefix,
      label,
      rateLimit,
      createdAt: this.now().toISOString(),
      revokedAt: null,
    };
    state.keys.push(record);
    await this.save(state);
    return { key: raw, ...this.publicRecord(record) };
  }

  publicRecord(record) {
    const { hash: _hash, ...safe } = record;
    return safe;
  }

  async list() {
    const state = await this.load();
    return state.keys.map(record => this.publicRecord(record));
  }

  async revoke(id) {
    const state = await this.load();
    const record = state.keys.find(item => item.id === id);
    if (!record) return null;
    if (!record.revokedAt) record.revokedAt = this.now().toISOString();
    await this.save(state);
    return this.publicRecord(record);
  }

  async authenticate(raw) {
    if (!raw || (!raw.startsWith("vst_test_") && !raw.startsWith("vst_live_"))) return null;
    const candidate = Buffer.from(hashKey(raw), "hex");
    const state = await this.load();
    const record = state.keys.find(item => {
      const stored = Buffer.from(item.hash, "hex");
      return stored.length === candidate.length && timingSafeEqual(stored, candidate);
    });
    return record && !record.revokedAt ? this.publicRecord(record) : null;
  }

  async countUsage(keyId, at = this.now()) {
    const state = await this.load();
    const day = at.toISOString().slice(0, 10);
    state.usage[day] ||= {};
    state.usage[day][keyId] = (state.usage[day][keyId] || 0) + 1;
    await this.save(state);
    return state.usage[day][keyId];
  }

  async usage(keyId) {
    const state = await this.load();
    return Object.entries(state.usage).map(([date, keys]) => ({ date, count: keys[keyId] || 0 })).filter(row => row.count > 0);
  }
}

export class FileKeyStore extends MemoryKeyStore {
  constructor(file, now) {
    super(emptyState(), now);
    this.file = file;
    this.pending = Promise.resolve();
  }

  async readDisk() {
    try { return JSON.parse(await readFile(this.file, "utf8")); }
    catch (error) { if (error.code === "ENOENT") return emptyState(); throw error; }
  }

  async writeDisk(state) {
    await mkdir(dirname(this.file), { recursive: true });
    const temporary = `${this.file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
    await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
    await rename(temporary, this.file);
  }

  exclusive(operation) {
    const result = this.pending.then(operation, operation);
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }

  withMemory(operation, write = false) {
    return this.exclusive(async () => {
      const memory = new MemoryKeyStore(await this.readDisk(), this.now);
      const result = await operation(memory);
      if (write) await this.writeDisk(memory.state);
      return result;
    });
  }

  load() { return this.exclusive(() => this.readDisk()); }
  save(state) { return this.exclusive(() => this.writeDisk(state)); }
  issue(options) { return this.withMemory(store => store.issue(options), true); }
  list() { return this.withMemory(store => store.list()); }
  revoke(id) { return this.withMemory(store => store.revoke(id), true); }
  authenticate(raw) { return this.withMemory(store => store.authenticate(raw)); }
  countUsage(keyId, at) { return this.withMemory(store => store.countUsage(keyId, at), true); }
  usage(keyId) { return this.withMemory(store => store.usage(keyId)); }
}

export const createKeyStore = ({ file = process.env.VESTAIL_PARTNER_KEYS_FILE || ".data/partner-keys.json", now } = {}) => new FileKeyStore(file, now);
