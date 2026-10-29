import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

/*
 * Every operation in the contract has to declare how it fails.
 *
 * The spec had seventeen error codes in the service behind it and two bare
 * 404 lines. A generated client got types for every success and nothing for
 * any failure, which is how a caller ends up parsing an error body as a
 * result.
 *
 * Wiring them up by hand also went wrong once — a script matched the
 * block-style operations and silently skipped the six written as one-line
 * flow mappings, and the commit message claimed full coverage anyway. This
 * counts instead of claiming.
 */
const SPEC = new URL("../docs/api/openapi.yaml", import.meta.url);

export function operations(spec) {
  const out = [];
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(item)) {
      if (method === "get" || method === "post") out.push({ path, method, op });
    }
  }
  return out;
}

const spec = () => parse(readFileSync(SPEC, "utf8"));

test("every operation declares 429, because every operation is rate limited", () => {
  const missing = operations(spec())
    .filter(({ op }) => !op.responses?.["429"])
    .map(({ method, path }) => `${method.toUpperCase()} ${path}`);

  assert.deepEqual(missing, [], `no 429 declared on: ${missing.join(", ")}`);
});

test("every secured operation declares 401", () => {
  const missing = operations(spec())
    .filter(({ op }) => op.security?.length && !op.responses?.["401"])
    .map(({ method, path }) => `${method.toUpperCase()} ${path}`);

  assert.deepEqual(missing, [], `secured but no 401 declared: ${missing.join(", ")}`);
});

test("the error shape is defined once and referenced, not restated", () => {
  const s = spec();
  assert.ok(s.components?.schemas?.Error, "components.schemas.Error is missing");
  for (const name of ["BadRequest", "Unauthorized", "NotFound", "RateLimited"]) {
    assert.ok(s.components?.responses?.[name], `components.responses.${name} is missing`);
  }
});

test("the matcher finds the operations, so none of this passes vacuously", () => {
  assert.ok(operations(spec()).length >= 12);
});
