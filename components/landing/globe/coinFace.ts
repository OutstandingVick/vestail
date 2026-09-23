import { CanvasTexture, SRGBColorSpace } from "three";

import type { CoinColours } from "./coinPalette";

const SIZE = 256;

/** Blend two hex colours; t = 0 is `a`, t = 1 is `b`. */
function mix(a: string, b: string, t: number): string {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`;
}

/**
 * A coin face: a coloured field inside a raised rim, with the ticker
 * stamped into it. Ticker text only — no company logos, ever.
 *
 * The coin is lit by real lights in the scene, so this canvas only carries
 * what a mint stamps into the metal: the field, the rim ridge, and the
 * letters. The one thing it fakes is the depth of the stamp — a light edge
 * above each letter and a dark one below, which is what makes type read as
 * pressed into a surface rather than printed on it. At the size these coins
 * are drawn (20-44px) that shading is the whole difference.
 *
 * `fontFamily` is the page's computed family list (next/font gives Outfit a
 * generated name), so the canvas draws in the brand face. The caller must
 * wait for that font to load; canvas text does not wait for it.
 */
export function coinFaceTexture(
  ticker: string,
  colours: CoinColours,
  fontFamily: string,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const c = SIZE / 2;

  // The field, shaded across the face so a flat disc still reads as turned
  // metal: brightest at the upper left, where the scene's light comes from.
  const field = ctx.createLinearGradient(SIZE * 0.2, 0, SIZE * 0.85, SIZE);
  field.addColorStop(0, mix(colours.face, "#ffffff", 0.22));
  field.addColorStop(0.55, colours.face);
  field.addColorStop(1, mix(colours.face, colours.edge, 0.55));
  ctx.fillStyle = field;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // The rim ridge: a band a shade darker than the field, with a hairline of
  // light along its inner edge. Minted coins have one and it is what stops
  // the face reading as a flat sticker.
  ctx.strokeStyle = mix(colours.face, colours.edge, 0.75);
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(c, c, c - 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(c, c, c - 16, 0, Math.PI * 2);
  ctx.stroke();

  // The ticker, shrunk until it clears the rim. OPENAI and KALSHI are the
  // widest; NVDA and SPY are set large.
  let px = 92;
  do {
    ctx.font = `700 ${px}px ${fontFamily}`;
    px -= 2;
  } while (ctx.measureText(ticker).width > SIZE * 0.62 && px > 18);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const y = c + px * 0.04;

  // Stamped: light above, dark below, ink between.
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fillText(ticker, c, y - 2.5);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillText(ticker, c, y + 2.5);
  ctx.fillStyle = colours.ink;
  ctx.fillText(ticker, c, y);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
