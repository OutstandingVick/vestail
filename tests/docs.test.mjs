import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { DOCS_SECTIONS, docsGroups } = await import(
  new URL("../lib/docs/sections.ts", import.meta.url)
);

describe("docs sections", () => {
  it("has a unique, link-safe anchor per section", () => {
    const ids = DOCS_SECTIONS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate anchor");
    for (const id of ids) assert.match(id, /^[a-z][a-z0-9-]*$/);
  });

  it("keeps each group in one run, so the sidebar matches the page order", () => {
    const groups = docsGroups().map((g) => g.group);
    assert.equal(new Set(groups).size, groups.length);
  });

  it("accounts for every section exactly once", () => {
    const grouped = docsGroups().flatMap((g) => g.sections);
    assert.deepEqual(grouped, [...DOCS_SECTIONS]);
  });
});
