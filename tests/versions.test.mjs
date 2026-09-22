import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { sortVersions, defaultVersion, isSelectable } = await import(
  new URL("../lib/app/versions.ts", import.meta.url)
);

const v = (mint, structure, status) => ({
  representation: { mint, structure },
  verdict: status === null ? null : { status },
});

describe("version cards", () => {
  it("orders eligible, then conditional, then restricted and unassessed", () => {
    const sorted = sortVersions([
      v("r", "custody_backed", "restricted"),
      v("n", "custody_backed", null),
      v("c", "custody_backed", "conditional"),
      v("e", "spv_exposure", "eligible"),
    ]);
    assert.deepEqual(sorted.map((x) => x.representation.mint), ["e", "c", "r", "n"]);
  });

  it("puts the stronger legal claim first within a status", () => {
    const sorted = sortVersions([
      v("spv", "spv_exposure", "conditional"),
      v("note", "total_return_note", "conditional"),
      v("share", "security_entitlement", "conditional"),
      v("custody", "custody_backed", "conditional"),
    ]);
    assert.deepEqual(sorted.map((x) => x.representation.mint), ["share", "custody", "note", "spv"]);
  });

  it("defaults to the strongest eligible version", () => {
    assert.equal(
      defaultVersion([
        v("loan", "loan_participation", "eligible"),
        v("custody", "custody_backed", "eligible"),
      ]),
      "custody",
    );
  });

  it("never defaults to a conditional or restricted version", () => {
    assert.equal(
      defaultVersion([v("c", "security_entitlement", "conditional"), v("r", "custody_backed", "restricted")]),
      null,
    );
  });

  it("lets only eligible and conditional versions be selected", () => {
    assert.equal(isSelectable(v("a", "custody_backed", "eligible")), true);
    assert.equal(isSelectable(v("a", "custody_backed", "conditional")), true);
    assert.equal(isSelectable(v("a", "custody_backed", "restricted")), false);
    assert.equal(isSelectable(v("a", "custody_backed", null)), false);
  });

  it("keeps the registry order when status and structure tie", () => {
    const sorted = sortVersions([v("first", "custody_backed", "eligible"), v("second", "custody_backed", "eligible")]);
    assert.deepEqual(sorted.map((x) => x.representation.mint), ["first", "second"]);
  });
});
