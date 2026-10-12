/*
 * Bake the landing hero's mapped globe into a static SVG for the auth screen.
 * The source geography stays in site/index.html; this keeps both globes visually
 * consistent without shipping the landing page's canvas renderer in Next.js.
 *
 * Usage: node scripts/bake-auth-globe.cjs > web/public/vestail-hero-globe.svg
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "site/index.html"), "utf8");
const match = html.match(/<script id="globe-geo" type="application\/json">([^<]+)<\/script>/);
if (!match) throw new Error("Could not find the hero globe geography.");
const geo = JSON.parse(match[1]);

const RAD = Math.PI / 180;
const tilt = 15 * RAD;
const yaw = -10 * RAD;
const sinT = Math.sin(tilt), cosT = Math.cos(tilt);
const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
const cx = 500, cy = 500, radius = 492;

function project(lon, lat) {
  const la = lat * RAD, lo = lon * RAD, cl = Math.cos(la);
  const x = cl * Math.sin(lo), y = Math.sin(la), z0 = cl * Math.cos(lo);
  const x2 = x * cosY + z0 * sinY;
  const z1 = -x * sinY + z0 * cosY;
  const y2 = y * cosT - z1 * sinT;
  const z = y * sinT + z1 * cosT;
  return { x: cx + x2 * radius, y: cy - y2 * radius, z };
}

const n = value => Number(value.toFixed(1));
function line(points) {
  let d = "", open = false;
  for (const [lon, lat] of points) {
    const p = project(lon, lat);
    if (p.z <= 0) { open = false; continue; }
    d += `${open ? "L" : "M"}${n(p.x)} ${n(p.y)}`;
    open = true;
  }
  return d;
}

const graticule = [];
for (let lon = -150; lon <= 180; lon += 30) {
  const points = [];
  for (let lat = -90; lat <= 90; lat += 3) points.push([lon, lat]);
  graticule.push(line(points));
}
for (let lat = -60; lat <= 60; lat += 30) {
  const points = [];
  for (let lon = -180; lon <= 180; lon += 3) points.push([lon, lat]);
  graticule.push(line(points));
}

const land = [], owned = [], fills = [];
for (const ring of geo.rings) {
  const points = ring.p || ring;
  const pairs = [];
  for (let i = 0; i < points.length; i += 2) pairs.push([points[i], points[i + 1]]);
  const d = line(pairs);
  if (!d) continue;
  (ring.own ? owned : land).push(d);
  if (ring.own) fills.push(`${d}Z`);
}

const pins = (geo.pins || []).map(pin => project(pin.lon, pin.lat)).filter(p => p.z > 0.06);
const labels = (geo.labels || []).filter(label => label.own).map(label => ({ ...label, ...project(label.lon, label.lat) })).filter(label => label.z > 0.18);

process.stdout.write(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="Vestail coverage globe">
  <style>
    .sphere{fill:#e7e4f7;fill-opacity:.72;stroke:#17171a;stroke-opacity:.12}
    .grid{fill:none;stroke:#17171a;stroke-opacity:.09;stroke-width:1}
    .land{fill:none;stroke:#17171a;stroke-opacity:.34;stroke-width:1.2;stroke-linejoin:round}
    .owned-fill{fill:#ff580a;fill-opacity:.07;stroke:none}
    .owned{fill:none;stroke:#ff580a;stroke-opacity:.5;stroke-width:1.7;stroke-linejoin:round}
    .pin-halo{fill:#ff580a;fill-opacity:.2}.pin{fill:#ff580a}
    .label{fill:#b83d00;font:600 13px Inter,Arial,sans-serif;text-anchor:middle}
    @media (prefers-color-scheme:dark){
      .sphere{fill:#f8f7ff;fill-opacity:.06;stroke:#f8f7ff;stroke-opacity:.14}
      .grid{stroke:#f8f7ff;stroke-opacity:.08}.land{stroke:#f8f7ff;stroke-opacity:.3}
      .owned{stroke:#ff7a3c;stroke-opacity:.58}.label{fill:#ffad84}
    }
  </style>
  <circle class="sphere" cx="500" cy="500" r="492"/>
  <path class="grid" d="${graticule.join("")}"/>
  <path class="owned-fill" d="${fills.join("")}"/>
  <path class="land" d="${land.join("")}"/>
  <path class="owned" d="${owned.join("")}"/>
  ${pins.map(p => `<circle class="pin-halo" cx="${n(p.x)}" cy="${n(p.y)}" r="11"/><circle class="pin" cx="${n(p.x)}" cy="${n(p.y)}" r="4"/>`).join("")}
  ${labels.map(label => `<text class="label" x="${n(label.x)}" y="${n(label.y)}">${label.n}</text>`).join("")}
</svg>\n`);
