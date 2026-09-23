import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { trustConnectors } = await import(new URL("../lib/landing/trustConnectors.ts", import.meta.url));

const inside = (x, y, box) =>
  x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;

describe("trust connector geometry", () => {
  it("links consecutive cards in reading order at different sizes and text heights", () => {
    for (const width of [350, 480]) {
      const boxes = [
        { x: 24, y: 24, width, height: 340 },
        { x: width + 128, y: 164, width, height: 380 },
        { x: 24, y: 520, width, height: 470 },
        { x: width + 128, y: 660, width, height: 340 },
      ];
      const paths = trustConnectors(boxes);
      assert.equal(paths.length, 3);
      paths.forEach((path, i) => {
        const coordinates = path.match(/-?[\d.]+/g).map(Number);
        assert.equal(coordinates.length, 8);
        assert.ok(coordinates.every(Number.isFinite));
        const [x1, y1, , , , , x2, y2] = coordinates;
        assert.ok(inside(x1, y1, boxes[i]), "starts under its source card");
        assert.ok(inside(x2, y2, boxes[i + 1]), "ends under the next card");
        assert.ok(y2 > y1, "follows the downward reading order");
        assert.equal(x2 > x1, i % 2 === 0, "alternates across the centre");
      });
    }
  });

  it("draws no dangling line for fewer than two cards", () => {
    assert.deepEqual(trustConnectors([]), []);
    assert.deepEqual(trustConnectors([{ x: 0, y: 0, width: 350, height: 340 }]), []);
  });
});
