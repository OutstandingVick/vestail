import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

// Public API pages must be reachable from the documentation index.
const API = new URL("../docs/api/", import.meta.url);
const REFERENCE = new URL("./reference/", API);

const markdown = dir => readdirSync(dir).filter(f => f.endsWith(".md"));
const read = url => readFileSync(url, "utf8");

test("README.md links every page in docs/api/", () => {
  const index = read(new URL("./README.md", API));
  const missing = markdown(API)
    .filter(f => f !== "README.md")
    .filter(f => !index.includes(f));

  assert.deepEqual(missing, [], `docs/api/README.md does not link: ${missing.join(", ")}`);
});

test("llms.txt lists every page in docs/api/", () => {
  const index = read(new URL("./llms.txt", API));
  const missing = markdown(API).filter(f => !index.includes(f));

  assert.deepEqual(missing, [], `docs/api/llms.txt does not list: ${missing.join(", ")}`);
});

test("the reference index links every reference page", () => {
  const index = read(new URL("./README.md", REFERENCE));
  const missing = markdown(REFERENCE)
    .filter(f => f !== "README.md")
    .filter(f => !index.includes(f));

  assert.deepEqual(missing, [], `reference/README.md does not link: ${missing.join(", ")}`);
});

test("there are pages to find, so none of this passes vacuously", () => {
  assert.ok(markdown(API).length >= 8);
  assert.ok(markdown(REFERENCE).length >= 8);
});
