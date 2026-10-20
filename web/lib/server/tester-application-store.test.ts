import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { TesterApplication } from "../tester-application-schema.ts";
import { saveTesterApplication } from "./tester-application-store.ts";

const row: TesterApplication = {
  xHandle: "@tester", email: "tester@example.com", country: "Nigeria", relationship: "Citizen",
  wallet: "11111111111111111111111111111111", experience: "Some", reason: "Careful feedback",
  telegram: "vestail_tester", status: "pending", created_at: "2026-10-20T12:00:00.000Z",
};

test("stores a pending tester application without extra fields", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "vestail-testers-"));
  process.env.VESTAIL_TESTER_APPLICATIONS_FILE = path.join(directory, "applications.jsonl");
  delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  try {
    assert.equal(await saveTesterApplication(row), "created");
    const stored = JSON.parse((await readFile(process.env.VESTAIL_TESTER_APPLICATIONS_FILE, "utf8")).trim());
    assert.deepEqual(stored, row);
  } finally { delete process.env.VESTAIL_TESTER_APPLICATIONS_FILE; await rm(directory, { recursive: true, force: true }); }
});
