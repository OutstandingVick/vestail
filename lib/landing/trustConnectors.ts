export interface TrustBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Join consecutive cards, with endpoints tucked under their inner edges. */
export function trustConnectors(boxes: readonly TrustBox[]): string[] {
  return boxes.slice(0, -1).map((from, index) => {
    const to = boxes[index + 1];
    const rightward = to.x > from.x;
    const x1 = from.x + from.width * (rightward ? 0.9 : 0.1);
    const y1 = from.y + from.height * (rightward ? 0.5 : 0.8);
    const x2 = to.x + to.width * (rightward ? 0.1 : 0.9);
    const y2 = to.y + to.height * (rightward ? 0.35 : 0.2);
    const middle = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${middle} ${y1} ${middle} ${y2} ${x2} ${y2}`;
  });
}
