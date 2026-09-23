import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { HOW_CURVE_PATH, howStepAnchor } = await import(new URL("../lib/landing/howCurve.ts", import.meta.url));
const { HOW_STEPS } = await import(new URL("../lib/landing/howSteps.ts", import.meta.url));

describe("how-it-works badge alignment", () => {
  it("keeps every badge on the actual SVG path at wide and narrow desktop sizes", () => {
    // Read the path itself so editing its control points without moving the
    // badges fails. Sample the Bezier independently of the anchor helper.
    const [x0, y0, cx, cy, x1, y1] = HOW_CURVE_PATH.match(/[\d.]+/g).map(Number);
    for (const [width, height] of [[828, 880], [1200, 880], [1200, 1400]]) {
      HOW_STEPS.forEach((_, i) => {
        const t = (i + 0.5) / HOW_STEPS.length;
        const point = howStepAnchor(i, HOW_STEPS.length);
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1;
        const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1;
        assert.ok(Math.abs(point.x - x) * width / 100 < 0.01);
        assert.ok(Math.abs(point.y - y) * height / 100 < 0.01);
        assert.equal(point.y, (i + 0.5) * 100 / HOW_STEPS.length);
      });
    }
  });
});
