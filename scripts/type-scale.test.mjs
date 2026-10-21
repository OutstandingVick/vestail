import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/*
 * The marketing page's type scale is one number: the root is 100% and drops to
 * 80% below 600px, and every font-size is rem so the whole page follows.
 *
 * That only holds while it holds completely. A single px font-size added later
 * sits outside the scale and stays desktop-sized on a phone — and because the
 * page has no build step and no other tests, nothing would notice. This is the
 * thing that notices.
 */
const PAGE = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");

test("every font-size on the marketing page is in rem", () => {
  const pixels = [...PAGE.matchAll(/font-size:\s*([^;}]*\d(?:\.\d+)?px[^;}]*)/g)].map(m => m[1].trim());
  assert.deepEqual(
    pixels,
    [],
    `these font-sizes are in px and will not scale on a phone:\n  ${pixels.join("\n  ")}`,
  );
});

test("the root carries the scale, and drops to 80% on a phone", () => {
  assert.match(PAGE, /html\s*\{[^}]*font-size:\s*100%/, "the root should state 100%, not assume it");
  assert.match(
    PAGE,
    /@media \(max-width: 600px\) \{ html \{ font-size: 80%; \} \}/,
    "the phone scale should be one rule against the root",
  );
});

test("spacing is not measured in rem, so the scale moves text only", () => {
  const spacing = [...PAGE.matchAll(/(padding|margin|gap|border-radius):\s*([^;}]*rem[^;}]*)/g)].map(
    m => `${m[1]}: ${m[2].trim()}`,
  );
  assert.deepEqual(
    spacing,
    [],
    `these are in rem and will shrink with the type, changing the layout's proportions:\n  ${spacing.join("\n  ")}`,
  );
});
