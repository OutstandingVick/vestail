import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  WebGLRenderer,
} from "three";

import { landPositions } from "@/lib/globe/landPoints";

import { createCoins, ORBIT_RADIANS_PER_SECOND, type Coins } from "./coins";
import { globeGeometry, type GlobePlacement } from "./layout";

/**
 * The hero globe, in plain three.js.
 *
 * This module is only ever loaded through a dynamic import, so three.js and
 * the land data stay out of the page's first bundle.
 *
 * An orthographic camera measured in CSS pixels: one scene unit is one
 * pixel of the stage, with y pointing down the page. That makes the globe's
 * on-screen position exactly the one the CSS stand-in uses, and the depth
 * buffer still gives real occlusion for anything that passes behind it.
 */

/** Earth's axial tilt, so the spin reads as a planet rather than a ball. */
const AXIAL_TILT = (23.4 * Math.PI) / 180;
/**
 * The pole leans away from the viewer. Only the globe's upper cap is on
 * screen; without this lean that cap is the Arctic, where land is squashed
 * and unreadable. Leaning it back puts the mid-latitudes, where coastlines
 * are recognisable, in view.
 */
const POLE_LEAN = (-31 * Math.PI) / 180;
/** One revolution every 90 seconds: calm, but visibly alive. */
const SPIN_RADIANS_PER_SECOND = (2 * Math.PI) / 90;
/** Rendering above this pixel ratio costs fill rate for no visible gain. */
const MAX_PIXEL_RATIO = 1.75;

/** Shared light: soft, from the upper left, slightly towards the viewer. */
const LIGHT = "vec3(-0.55, 0.55, 0.65)";
/** Atmosphere shell radius, relative to the globe. */
const ATMOSPHERE = 1.12;

export interface GlobeHandle {
  dispose(): void;
}

export interface GlobeOptions {
  placement: GlobePlacement;
  /** Called once, after the first frame is on screen. */
  onFirstFrame?: () => void;
}

export function mountGlobe(
  stage: HTMLElement,
  canvas: HTMLCanvasElement,
  { placement, onFirstFrame }: GlobeOptions,
): GlobeHandle {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  const scene = new Scene();
  const camera = new OrthographicCamera(0, 1, 0, -1, 0.1, 40_000);
  camera.position.z = 20_000;

  // globe (position + scale) > tilt (axial tilt) > spin (rotation about y)
  const globe = new Group();
  const tilt = new Group();
  const spin = new Group();
  tilt.rotation.set(POLE_LEAN, 0, AXIAL_TILT);
  // Start with the Atlantic, Europe and Africa turned towards the lit cap.
  spin.rotation.y = -0.6;
  globe.add(tilt);
  tilt.add(spin);
  scene.add(globe);

  /* Body: an opaque, softly lit sphere. It hides the far-side dots and,
     later, anything that orbits behind it. */
  const bodyMaterial = new ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        float lambert = max(dot(n, normalize(${LIGHT})), 0.0);
        vec3 night = vec3(0.039, 0.071, 0.165);
        vec3 day = vec3(0.23, 0.17, 0.52);
        vec3 color = mix(night, day, lambert * 0.8);
        // A thin violet rim where the surface turns away from the viewer.
        float rim = pow(1.0 - max(n.z, 0.0), 3.0);
        color += vec3(0.42, 0.32, 0.95) * rim * 0.35;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const body = new Mesh(new SphereGeometry(1, 96, 64), bodyMaterial);
  spin.add(body);

  /* Land: one soft dot per land point, brighter where the light falls and
     fading towards the limb so the edge reads as curvature. */
  const dotGeometry = new BufferGeometry();
  const positions = landPositions();
  for (let i = 0; i < positions.length; i++) positions[i] *= 1.003;
  dotGeometry.setAttribute("position", new BufferAttribute(positions, 3));

  const dotMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSize: { value: 3 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uPixelRatio;
      varying float vFacing;
      varying float vLight;
      void main() {
        vec3 n = normalize(mat3(modelMatrix) * position);
        vFacing = n.z;
        vLight = max(dot(n, normalize(${LIGHT})), 0.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uPixelRatio * (0.6 + 0.4 * max(vFacing, 0.0));
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vFacing;
      varying float vLight;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float disc = smoothstep(0.5, 0.2, d);
        float limb = smoothstep(0.0, 0.18, vFacing);
        vec3 color = mix(vec3(0.62, 0.54, 1.0), vec3(1.0, 0.98, 1.0), vLight);
        gl_FragColor = vec4(color, disc * limb * (0.5 + 0.5 * vLight));
      }
    `,
  });
  spin.add(new Points(dotGeometry, dotMaterial));

  /* Atmosphere: a slightly larger shell drawn from the inside (back faces),
     added on top of whatever is behind it. Seen face-on, the shell's back
     faces only show outside the globe, between the limb (where the normal's
     z is -sqrt(1 - 1/ATMOSPHERE^2)) and the shell's edge (z = 0). The glow
     peaks at the limb and fades to nothing at the edge, a little brighter
     on the lit side. Lives on the globe group: a sphere needs no spin. */
  const limbZ = Math.sqrt(1 - 1 / (ATMOSPHERE * ATMOSPHERE));
  const atmosphereMaterial = new ShaderMaterial({
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        float t = clamp(-n.z / ${limbZ.toFixed(4)}, 0.0, 1.0);
        float intensity = pow(t, 2.2);
        vec2 toLight = normalize(${LIGHT}.xy);
        float side = 0.65 + 0.35 * max(dot(normalize(n.xy), toLight), 0.0);
        vec3 color = vec3(0.58, 0.46, 1.0) * intensity * side;
        gl_FragColor = vec4(color, intensity * side);
      }
    `,
  });
  const atmosphere = new Mesh(new SphereGeometry(ATMOSPHERE, 96, 64), atmosphereMaterial);
  globe.add(atmosphere);

  /* Coins. Their faces are drawn with canvas text, which does not wait for
     web fonts, so they are created once the brand font has loaded. Until
     then the globe turns on its own. */
  let coins: Coins | undefined;
  let orbitPhase = 0.9;
  let disposed = false;
  const fontFamily = getComputedStyle(document.body).fontFamily;
  document.fonts
    .load(`700 64px ${fontFamily}`)
    .catch(() => undefined)
    .then(() => {
      if (disposed) return;
      coins = createCoins(placement.coins, fontFamily);
      scene.add(coins.group);
      layout();
      coins.update(orbitPhase);
      render();
    });

  /* Layout: follow the stage's size, in CSS pixels. */
  let width = 0;
  let height = 0;
  function layout() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    if (width === 0 || height === 0) return;

    renderer.setSize(width, height, false);
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = -height;
    camera.updateProjectionMatrix();

    const { r, cx, cy } = globeGeometry(placement, width, height);
    globe.position.set(cx, -cy, 0);
    globe.scale.setScalar(r);
    coins?.setFrame(cx, cy, r);
    // Dot spacing grows with the radius; keep dots about half the gap.
    dotMaterial.uniforms.uSize.value = Math.min(Math.max(r * 0.0054, 1.6), 4.6);
  }
  const resizeObserver = new ResizeObserver(() => {
    layout();
    render();
  });
  resizeObserver.observe(stage);
  layout();

  /* Loop. Time-based, so speed does not depend on the display's refresh
     rate, and the step is capped so a background tab does not jump. */
  let frame = 0;
  let last = performance.now();
  let firstFrameSent = false;

  function render() {
    if (width === 0 || height === 0) return;
    renderer.render(scene, camera);
    if (!firstFrameSent) {
      firstFrameSent = true;
      onFirstFrame?.();
    }
  }

  function tick(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    spin.rotation.y += SPIN_RADIANS_PER_SECOND * dt;
    orbitPhase += ORBIT_RADIANS_PER_SECOND * dt;
    coins?.update(orbitPhase);
    render();
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      coins?.dispose();
      resizeObserver.disconnect();
      dotGeometry.dispose();
      dotMaterial.dispose();
      body.geometry.dispose();
      bodyMaterial.dispose();
      atmosphere.geometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
    },
  };
}
