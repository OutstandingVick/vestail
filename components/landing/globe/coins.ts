import {
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type CanvasTexture,
} from "three";

import { coinFaceTexture } from "./coinFace";

/** All eight; the mobile variant uses the first `count`. */
export const COIN_TICKERS = ["NVDA", "TSLA", "AAPL", "SPY", "QQQ", "MSFT", "GOOGL", "AMZN"];

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

/** Coin radius as a fraction of the globe's, clamped to readable pixels. */
const COIN_RADIUS = 0.055;
const COIN_MIN_PX = 20;
const COIN_MAX_PX = 44;

const ORANGE = 0xff580a;

export interface Coins {
  group: Group;
  /** Place every coin for orbit phase `phase` (radians). */
  update(phase: number): void;
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
  const geometry = new CylinderGeometry(1, 1, 0.16, 48, 1);
  const basis = new Matrix4()
    .makeRotationZ(ORBIT_ROLL)
    .multiply(new Matrix4().makeRotationX(ORBIT_TIP));

  const coins = COIN_TICKERS.slice(0, count).map((ticker) => {
    const texture = coinFaceTexture(ticker, fontFamily);
    const face = new MeshBasicMaterial({ map: texture });
    const edge = new MeshBasicMaterial({ color: ORANGE });
    // CylinderGeometry material groups: 0 side, 1 top cap, 2 bottom cap.
    const mesh = new Mesh(geometry, [edge, face, face]);
    // Turn the top cap towards the camera (+z).
    mesh.rotation.x = Math.PI / 2;
    // Keep the ticker upright once the cap faces the camera.
    mesh.rotation.y = Math.PI / 2;

    const holder = new Group();
    holder.add(mesh);
    group.add(holder);
    return { holder, face, edge, texture };
  });

  let cx = 0;
  let cy = 0;
  let r = 1;
  const p = new Vector3();

  function update(phase: number) {
    const coinPx = Math.min(Math.max(r * COIN_RADIUS, COIN_MIN_PX), COIN_MAX_PX);
    coins.forEach((coin, i) => {
      const theta = phase + (i / coins.length) * Math.PI * 2;
      p.set(Math.cos(theta) * ORBIT_A, 0, Math.sin(theta) * ORBIT_C).applyMatrix4(basis);

      // 0 at the far side of the orbit, 1 at the near side.
      const depth = (p.z / ORBIT_C + 1) / 2;

      coin.holder.position.set(cx + p.x * r, -cy + p.y * r, p.z * r);
      coin.holder.scale.setScalar(coinPx * (0.62 + 0.55 * depth));
      // A slow wobble, so the orange edge catches the eye as coins travel.
      coin.holder.rotation.set(0.28 + 0.12 * Math.sin(theta), 0.45 * Math.cos(theta), 0);

      const light = 0.35 + 0.65 * depth;
      coin.face.color.setScalar(light);
      coin.edge.color.setHex(ORANGE).multiplyScalar(light);
    });
  }

  return {
    group,
    update,
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
