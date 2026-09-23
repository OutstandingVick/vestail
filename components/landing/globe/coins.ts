import {
  Color,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type CanvasTexture,
} from "three";

import { coinFaceTexture } from "./coinFace";
import { COIN_COLOURS, COIN_SYMBOLS } from "./coinPalette";

/**
 * The orbit, relative to the globe's radius.
 *
 * The globe is 1.3x the viewport wide with its centre below the screen, so
 * any orbit around it is mostly off-screen too. These values come from a
 * sweep over 1024x768 to 2560x1440 that counted, per lap, the coins actually
 * visible (on screen and not behind the globe), the coins crossing the
 * headline, and the on-screen moments a coin slides behind the globe. This
 * combination keeps about two coins visible on every size, none behind the
 * headline, and every coin visibly passes behind the globe once per lap.
 * Tipping it any flatter makes it an edge-on line rather than an ellipse.
 */
const ORBIT_A = 1.2; // semi-major axis
const ORBIT_C = 1.05; // semi-minor axis, in the orbit's own plane
/** Tipped so the near side rises: coins cross in front of the visible cap. */
const ORBIT_TIP = (-10 * Math.PI) / 180;
/** Rolled so the orbit climbs to the left, across the part of the globe on screen. */
const ORBIT_ROLL = (-36 * Math.PI) / 180;
/** One lap every 48 seconds. */
export const ORBIT_RADIANS_PER_SECOND = (2 * Math.PI) / 48;

/** How many coins a still frame shows at most; the rest rest out of sight. */
const MAX_STILL_VISIBLE = 3;

/** Coin radius as a fraction of the globe's, clamped to readable pixels. */
const COIN_RADIUS = 0.055;
const COIN_MIN_PX = 20;
const COIN_MAX_PX = 44;

/**
 * Thickness, as a fraction of the radius. Minted coins are chunky; a wafer
 * reads as a sticker from the moment it turns, and the turn is most of what
 * these coins do.
 */
const COIN_THICKNESS = 0.22;

export interface Coins {
  group: Group;
  /** Place every coin for orbit phase `phase` (radians). */
  update(phase: number): void;
  /**
   * A still arrangement for reduced motion: one orbit angle per coin.
   *
   * Not a frozen orbit. With coins evenly spaced, the visible arc crosses
   * the copy at every phase, so some coin always lands on the text. Here
   * each coin is placed on its own: up to MAX_STILL_VISIBLE on spots that
   * are on the stage, clear of `avoid` (the copy) and apart from each
   * other; the rest where they cannot be seen (behind the globe or off the
   * stage). Uses the same orbit maths as `update`.
   */
  stillAngles(
    width: number,
    height: number,
    avoid: (x: number, y: number) => boolean,
  ): number[];
  /** Place coin i at orbit angle angles[i]. */
  place(angles: number[]): void;
  /** The largest radius a coin is drawn at, in pixels (the nearest point). */
  maxRadius(): number;
  /** The globe's centre and radius in scene units, after a layout change. */
  setFrame(cx: number, cy: number, r: number): void;
  dispose(): void;
}

/**
 * Coins on a tilted elliptical orbit around the globe.
 *
 * Depth does three things at once, so the orbit reads as 3D:
 *  - occlusion: coins are opaque and depth-tested, so the globe's body
 *    hides them as they pass behind it;
 *  - size: nearer coins are drawn larger (the camera is orthographic, so
 *    this is done explicitly);
 *  - brightness: farther coins are dimmer.
 */
export function createCoins(count: number, fontFamily: string): Coins {
  const group = new Group();
  // 64 segments: at this size the silhouette is the coin, and a faceted
  // edge is the one flaw that reads at 20 pixels.
  const geometry = new CylinderGeometry(1, 1, COIN_THICKNESS, 64, 1);
  const basis = new Matrix4()
    .makeRotationZ(ORBIT_ROLL)
    .multiply(new Matrix4().makeRotationX(ORBIT_TIP));

  const coins = COIN_SYMBOLS.slice(0, count).map((symbol) => {
    const colours = COIN_COLOURS[symbol];
    const texture = coinFaceTexture(symbol, colours, fontFamily);
    // Lit materials, not flat ones: the scene's lights are what make a disc
    // read as a solid object rather than a circle with a picture on it.
    const face = new MeshStandardMaterial({ map: texture, roughness: 0.68, metalness: 0.08 });
    const edge = new MeshStandardMaterial({
      color: new Color(colours.edge),
      roughness: 0.52,
      metalness: 0.16,
    });
    const edgeBase = new Color(colours.edge);
    // CylinderGeometry material groups: 0 side, 1 top cap, 2 bottom cap.
    const mesh = new Mesh(geometry, [edge, face, face]);
    // Turn the top cap towards the camera (+z).
    mesh.rotation.x = Math.PI / 2;
    // Keep the ticker upright once the cap faces the camera.
    mesh.rotation.y = Math.PI / 2;

    const holder = new Group();
    holder.add(mesh);
    group.add(holder);
    return { holder, face, edge, edgeBase, texture };
  });

  let cx = 0;
  let cy = 0;
  let r = 1;
  const p = new Vector3();

  /** Orbit position at angle `theta`, relative to the globe, in radii. */
  function orbitAt(theta: number, out: Vector3) {
    return out.set(Math.cos(theta) * ORBIT_A, 0, Math.sin(theta) * ORBIT_C).applyMatrix4(basis);
  }

  function stillAngles(
    width: number,
    height: number,
    avoid: (x: number, y: number) => boolean,
  ) {
    const q = new Vector3();
    const edge = coinPx() * 1.2; // keep whole coins on the stage
    const shown: Array<{ theta: number; x: number; y: number }> = [];
    const hidden: number[] = [];

    const samples = 360;
    const clear: Array<{ theta: number; x: number; y: number; z: number }> = [];
    for (let k = 0; k < samples; k++) {
      const theta = (k / samples) * Math.PI * 2;
      orbitAt(theta, q);
      const x = cx + q.x * r;
      const y = cy - q.y * r;
      const onStage = x > edge && x < width - edge && y > edge && y < height - edge;
      const behindGlobe = q.z < 0 && q.x * q.x + q.y * q.y < 1;
      if (!onStage || behindGlobe) hidden.push(theta);
      else if (!avoid(x, y)) clear.push({ theta, x, y, z: q.z });
    }

    // Nearest (largest, brightest) spots first, each at least three coin
    // radii from the ones already taken.
    clear.sort((a, b) => b.z - a.z);
    const gap = coinPx() * 3;
    for (const c of clear) {
      if (shown.length === MAX_STILL_VISIBLE) break;
      if (shown.every((s) => Math.hypot(s.x - c.x, s.y - c.y) >= gap)) shown.push(c);
    }

    // Everyone else goes out of sight, spread along the hidden stretch.
    const angles = shown.map((s) => s.theta);
    const rest = coins.length - angles.length;
    for (let i = 0; i < rest; i++) {
      angles.push(hidden.length ? hidden[Math.floor(((i + 0.5) / rest) * hidden.length)] : 0);
    }
    return angles;
  }

  const coinPx = () => Math.min(Math.max(r * COIN_RADIUS, COIN_MIN_PX), COIN_MAX_PX);

  function update(phase: number) {
    place(coins.map((_, i) => phase + (i / coins.length) * Math.PI * 2));
  }

  function place(angles: number[]) {
    const base = coinPx();
    coins.forEach((coin, i) => {
      const theta = angles[i] ?? 0;
      orbitAt(theta, p);

      // 0 at the far side of the orbit, 1 at the near side.
      const depth = (p.z / ORBIT_C + 1) / 2;

      coin.holder.position.set(cx + p.x * r, -cy + p.y * r, p.z * r);
      coin.holder.scale.setScalar(base * (0.62 + 0.55 * depth));
      // A slow wobble, so the orange edge catches the eye as coins travel.
      coin.holder.rotation.set(0.28 + 0.12 * Math.sin(theta), 0.45 * Math.cos(theta), 0);

      // Depth dimming on top of the scene's lighting, so the far side of
      // the orbit still recedes. Slight, because the lights now do the
      // shading: any more and the far coins go grey, which is what this
      // had to do on its own back when the materials were unlit.
      const light = 0.82 + 0.18 * depth;
      coin.face.color.setScalar(light);
      coin.edge.color.copy(coin.edgeBase).multiplyScalar(light);
    });
  }

  return {
    group,
    update,
    stillAngles,
    place,
    maxRadius: () => coinPx() * (0.62 + 0.55),
    setFrame(nextCx, nextCy, nextR) {
      cx = nextCx;
      cy = nextCy;
      r = nextR;
    },
    dispose() {
      geometry.dispose();
      for (const coin of coins) {
        coin.face.dispose();
        coin.edge.dispose();
        (coin.texture as CanvasTexture).dispose();
      }
    },
  };
}
