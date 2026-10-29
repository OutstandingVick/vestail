import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

/*
 * docs/api/errors.md has to list every error code the API can raise.
 *
 * It drifted once already, and badly: API.md documented four codes while the
 * service raised seventeen. Nobody noticed because nothing could. A client
 * written against that page branches on a quarter of the failures and falls
 * through on the rest — and this is a compliance product, where falling
 * through means showing a buyer no answer rather than a wrong one, if you are
 * lucky.
 *
 * So the page is checked against the source. Add a code without documenting it
 * and this fails by name.
 */
const SRC = new URL("../services/api/src/", import.meta.url);
const DOC = new URL("../docs/api/errors.md", import.meta.url);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const url = new URL(entry, dir);
    if (statSync(url).isDirectory()) out.push(...walk(new URL(entry + "/", dir)));
    else if (entry.endsWith(".js")) out.push(url);
  }
  return out;
}

/** Every code passed to ApiError(status, code, …) or errorBody(code, …). */
export function codesInSource(files) {
  const found = new Set();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/ApiError\(\s*\d+\s*,\s*"([a-z_]+)"/g)) found.add(m[1]);
    for (const m of text.matchAll(/errorBody\(\s*"([a-z_]+)"/g)) found.add(m[1]);
  }
  return [...found].sort();
}

/** Every code the document mentions in a table cell or inline code span. */
export function codesInDoc(markdown) {
  return [...new Set([...markdown.matchAll(/`([a-z][a-z_]{3,})`/g)].map(m => m[1]))].sort();
}

test("every error code the API raises is documented", () => {
  const raised = codesInSource(walk(SRC));
  const documented = new Set(codesInDoc(readFileSync(DOC, "utf8")));
  const missing = raised.filter(code => !documented.has(code));

  assert.deepEqual(
    missing,
    [],
    `docs/api/errors.md does not mention: ${missing.join(", ")}.\n` +
      `Add it to the table with a real message from the source, not an invented one.`,
  );
});

test("the source actually raises something, so the check cannot pass vacuously", () => {
  const raised = codesInSource(walk(SRC));
  assert.ok(raised.length >= 15, `only found ${raised.length} codes in the source; the matcher is probably broken`);
  assert.ok(raised.includes("rate_limited"));
  assert.ok(raised.includes("acknowledgement_required"));
});
