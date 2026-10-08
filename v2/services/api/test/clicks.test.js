import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClickLog } from "../src/clicks.js";

test("clicks written to a file survive a restart", () => {
  const file = join(mkdtempSync(join(tmpdir(), "clicks-")), "clicks.jsonl");
  const first = createClickLog({ file });
  first.record({ country: "NG", asset: "cryptocurrency", venue: "Luno", session: "s", partner: "key_0" });
  const second = createClickLog({ file });
  assert.equal(second.count(), 1);
  assert.equal(second.bySession("s", "key_0", 10)[0].venue, "Luno");
  assert.equal(second.bySession("s", "key_1", 10).length, 0);
  const next = second.record({ country: "NG", asset: "cryptocurrency", venue: "Luno", session: "s" });
  assert.notEqual(next.id, first.recent(1)[0].id);
});
