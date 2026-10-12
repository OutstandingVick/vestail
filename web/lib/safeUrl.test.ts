import assert from "node:assert/strict";
import { test } from "node:test";

import { safeHttps } from "./safeUrl.ts";

test("https passes", () => assert.equal(safeHttps("https://docs.ondo.finance/x"), "https://docs.ondo.finance/x"));
test("javascript: is dropped", () => assert.equal(safeHttps("javascript:alert(1)"), null));
test("data: is dropped", () => assert.equal(safeHttps("data:text/html,<script>1</script>"), null));
test("plain http is dropped", () => assert.equal(safeHttps("http://example.com"), null));
test("relative and junk are dropped", () => { assert.equal(safeHttps("/app"), null); assert.equal(safeHttps("  "), null); assert.equal(safeHttps(undefined), null); });
