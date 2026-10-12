import { test } from "node:test";
import assert from "node:assert/strict";
import { get } from "./helpers.js";

test("reference endpoints cache for a day", async () => {
  for (const p of ["/assets", "/categories", "/countries", "/entities"])
    assert.equal((await get(p)).headers.get("cache-control"), "public, max-age=86400", p);
});

test("errors are not cached", async () => {
  assert.equal((await get("/nope")).headers.get("cache-control"), null);
});
