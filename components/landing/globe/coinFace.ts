import { CanvasTexture, SRGBColorSpace } from "three";

const SIZE = 256;
const ORANGE = "#FF580A";

/**
 * A coin face: a navy disc with an orange rim and the ticker in the site's
 * font. Ticker text only — no company logos.
 *
 * `fontFamily` is the computed family list of the page (next/font gives
 * Outfit a generated name), so the canvas draws in the brand face. The
 * caller must wait for that font to load first; canvas text does not wait.
 */
export function coinFaceTexture(ticker: string, fontFamily: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const c = SIZE / 2;

  // Face: lit from the upper left, like the globe.
  const face = ctx.createRadialGradient(c * 0.7, c * 0.6, 8, c, c, c);
  face.addColorStop(0, "#2d2477");
  face.addColorStop(0.7, "#161a4a");
  face.addColorStop(1, "#0d1233");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // Orange rim on the face, so the edge reads even when the coin is face-on.
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(c, c, c - 8, 0, Math.PI * 2);
  ctx.stroke();

  // A fine inner ring, the way minted coins have a raised border.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, c - 30, 0, Math.PI * 2);
  ctx.stroke();

  // Ticker, shrunk until it fits inside the inner ring (GOOGL is widest).
  let px = 84;
  do {
    ctx.font = `700 ${px}px ${fontFamily}`;
    px -= 2;
  } while (ctx.measureText(ticker).width > SIZE * 0.66 && px > 20);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ticker, c, c + px * 0.04);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
