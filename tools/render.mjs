/**
 * Perender perangkat lunak (software rasterizer) untuk memeriksa komposisi
 * diorama tanpa browser. Bukan bagian dari aplikasi — hanya alat verifikasi.
 *
 * Pakai: node tools/render.mjs [preset] [output.png]
 */
import * as THREE from 'three';
import zlib from 'node:zlib';
import fs from 'node:fs';

import { buildTerrain, groundHeight } from '../src/world/terrain.js';
import { buildWater } from '../src/world/water.js';
import { riverZ, riverHalf, riverAngle, ISLAND, islandHeight } from '../src/world/river.js';
import { buildAmpera } from '../src/models/ampera.js';
import { buildMasjid } from '../src/models/masjid.js';
import { buildBenteng } from '../src/models/benteng.js';
import { buildMonpera } from '../src/models/monpera.js';
import { buildKemaro } from '../src/models/kemaro.js';
import { buildAlQuran, buildDowntown, buildPasar } from '../src/models/city.js';
import { buildRumahLimas, buildRumahRakit, buildKetek, buildTongkang, buildDock } from '../src/models/vernacular.js';
import { buildVegetation, buildKampung, buildRiverRoads, buildTraffic } from '../src/models/scenery.js';
import { makeRng, mat } from '../src/lib/kit.js';
import { LANDMARKS, TIME_PRESETS } from '../src/data.js';

const W = 1280, H = 800;
const preset = TIME_PRESETS[process.argv[2] || 'pagi'];
const OUT = process.argv[3] || 'render.png';
const CAM = (process.argv[4] || 'overview');

/* ---------------- susun scene (mirror dari scene.js) ---------------- */
const scene = new THREE.Group();
scene.add(buildTerrain());

const water = buildWater();
scene.add(water);

scene.add(buildAmpera());

const place = (g, id, rotY = 0, yOff = 0) => {
  const lm = LANDMARKS.find(l => l.id === id);
  const [x, z] = lm.pos;
  g.position.set(x, Math.max(groundHeight(x, z), 0) + yOff, z);
  g.rotation.y = rotY;
  scene.add(g);
  return g;
};
place(buildMasjid(), 'masjid', 0.22, -0.4);
place(buildMonpera(), 'monpera', 0.5, -0.4);
place(buildBenteng(), 'benteng', -0.08, -0.4);
place(buildAlQuran(), 'alquran', -0.4, -0.4);
place(buildDowntown(makeRng(4242)), 'kota', 0.18, -0.3);

const kem = buildKemaro();
kem.position.set(ISLAND.x, islandHeight(ISLAND.x, ISLAND.z) - 0.6, ISLAND.z);
kem.rotation.y = -0.35;
scene.add(kem);

const pasar = buildPasar(makeRng(4242));
pasar.position.set(-100, Math.max(groundHeight(-100, -135), 0) - 0.2, -135);
pasar.rotation.y = 0.3;
scene.add(pasar);

// kampung limas
const rngV = makeRng(90210);
const lmL = LANDMARKS.find(l => l.id === 'limas');
const cluster = new THREE.Group();
for (const [dx, dz, s, rot] of [[0,0,0.62,0.1],[-17,5,0.46,-0.5],[16,7,0.44,0.55],[-5,-15,0.40,3.0],[14,-13,0.38,2.6]]) {
  const h = buildRumahLimas(s);
  h.position.set(dx, Math.max(groundHeight(lmL.pos[0]+dx, lmL.pos[1]+dz),0.2) - Math.max(groundHeight(lmL.pos[0],lmL.pos[1]),0.2), dz);
  h.rotation.y = rot;
  cluster.add(h);
}
place(cluster, 'limas', 0.15, 0);

// rumah rakit
const rlm = LANDMARKS.find(l => l.id === 'rakit');
for (let i = 0; i < 11; i++) {
  const x = rlm.pos[0] - 34 + i * 7.4 + (rngV() - 0.5) * 2.4;
  const side = i % 3 === 0 ? -1 : 1;
  const z = riverZ(x) + side * (riverHalf(x) - 3.0 - rngV() * 2.2);
  const h = buildRumahRakit(rngV);
  h.position.set(x, 0.1, z);
  h.rotation.y = -riverAngle(x) + (side > 0 ? 0 : Math.PI);
  scene.add(h);
}
for (const [x, side] of [[-70,-1],[-30,-1],[26,1],[58,1],[-95,-1]]) scene.add(buildDock(x, side));

scene.add(buildVegetation(makeRng(777), [[0,0,40],[-115,-82,42],[-45,-70,42],[40,-72,36],[40,72,32],[-60,34,30],[-15,-135,44],[-100,-135,34],[ISLAND.x,ISLAND.z,ISLAND.r+6]]));
scene.add(buildKampung(makeRng(777), [[0,0,40],[-115,-82,42],[-45,-70,42],[40,-72,36],[40,72,32],[-60,34,30],[-15,-135,44],[-100,-135,34],[ISLAND.x,ISLAND.z,ISLAND.r+6]]));
scene.add(buildRiverRoads());

// perahu
const rngB = makeRng(31415);
for (let i = 0; i < 16; i++) {
  const b = buildKetek(rngB);
  const x = -145 + rngB() * 290;
  const off = (rngB() - 0.5) * 34;
  const half = riverHalf(x);
  b.position.set(x, 0.15, riverZ(x) + Math.max(-half+6, Math.min(half-6, off)));
  b.rotation.y = -riverAngle(x);
  scene.add(b);
}
for (let i = 0; i < 3; i++) {
  const t = buildTongkang();
  const x = -130 + i * 95;
  t.position.set(x, 0.1, riverZ(x) + (rngB()-0.5)*12);
  t.rotation.y = -riverAngle(x);
  scene.add(t);
}
const traffic = buildTraffic(makeRng(31415));
traffic.userData.update(0.016);
scene.add(traffic);

scene.updateMatrixWorld(true);

/* ---------------- kamera ---------------- */
const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 1400);
const views = {
  overview:  [[128, 104, 158], [0, 8, -6]],
  ampera:    [[48, 42, 62], [0, 16, 0]],
  masjid:    [[-92, 48, -34], [-52, 12, -74]],
  kemaro:    [[128, 44, 58], [88, 14, 20]],
  ulu:       [[52, 40, 120], [30, 8, 55]],
  low:       [[70, 22, 95], [0, 12, 10]],
  top:       [[10, 230, 60], [0, 0, 0]],
  river:     [[-60, 16, 58], [10, 8, -4]],
  benteng:   [[-40, 34, 10], [-44, 8, -40]],
  limas:     [[34, 26, 104], [34, 6, 58]],
  wide:      [[150, 110, 175], [0, 8, 0]],
};
const [cp, ct] = views[CAM] || views.overview;
camera.position.set(...cp);
camera.lookAt(new THREE.Vector3(...ct));
camera.updateMatrixWorld(true);
camera.updateProjectionMatrix();

const viewProj = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

/* ---------------- rasterizer ---------------- */
const color = new Float32Array(W * H * 3);
const depth = new Float32Array(W * H).fill(Infinity);

// langit gradien
const skyTop = new THREE.Color(preset.sky[0]);
const skyMid = new THREE.Color(preset.sky[1]);
const skyBot = new THREE.Color(preset.sky[2]);
const invVP = new THREE.Matrix4().copy(viewProj).invert();
const tmp = new THREE.Vector3();
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const ndcX = (x + 0.5) / W * 2 - 1;
    const ndcY = 1 - (y + 0.5) / H * 2;
    tmp.set(ndcX, ndcY, 1).applyMatrix4(invVP).sub(camera.position).normalize();
    const h = tmp.y;
    const c = h > 0.06
      ? skyMid.clone().lerp(skyTop, THREE.MathUtils.smoothstep(h, 0.06, 0.62))
      : skyBot.clone().lerp(skyMid, THREE.MathUtils.smoothstep(h, -0.25, 0.06));
    const i = (y * W + x) * 3;
    color[i] = c.r; color[i+1] = c.g; color[i+2] = c.b;
  }
}

const sunDir = new THREE.Vector3(...preset.sun.pos).normalize();
const sunCol = new THREE.Color(preset.sun.color);
const hemiSky = new THREE.Color(preset.hemi.sky);
const hemiGnd = new THREE.Color(preset.hemi.ground);
const fogCol = new THREE.Color(preset.fog);

const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
const wA = new THREE.Vector3(), wB = new THREE.Vector3(), wC = new THREE.Vector3();
const nrm = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
const shade = new THREE.Color();

const clipA = new THREE.Vector4(), clipB = new THREE.Vector4(), clipC = new THREE.Vector4();

/** Proyeksi ke ruang klip homogen (mempertahankan w). */
function toClip(v, out) {
  out.set(v.x, v.y, v.z, 1).applyMatrix4(viewProj);
  return out;
}

/** Interpolasi linear dua titik klip. */
function lerpClip(a, b, t) {
  return new THREE.Vector4(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t,
    a.w + (b.w - a.w) * t
  );
}

const NEAR_EPS = 1e-4;

/**
 * Klip segitiga terhadap bidang near (w > eps) di ruang homogen,
 * lalu kembalikan daftar segitiga hasil klip. Tanpa ini, titik di
 * belakang kamera menghasilkan segitiga raksasa yang salah.
 */
function clipNear(a, b, c) {
  const verts = [a, b, c];
  const inside = verts.filter((v) => v.w > NEAR_EPS);
  if (inside.length === 3) return [[a, b, c]];
  if (inside.length === 0) return [];

  const out = [];
  for (let i = 0; i < 3; i++) {
    const cur = verts[i];
    const nxt = verts[(i + 1) % 3];
    const curIn = cur.w > NEAR_EPS;
    const nxtIn = nxt.w > NEAR_EPS;
    if (curIn) out.push(cur);
    if (curIn !== nxtIn) {
      const t = (NEAR_EPS - cur.w) / (nxt.w - cur.w);
      out.push(lerpClip(cur, nxt, t));
    }
  }
  if (out.length === 3) return [[out[0], out[1], out[2]]];
  if (out.length === 4) return [[out[0], out[1], out[2]], [out[0], out[2], out[3]]];
  return [];
}

let drawn = 0, culled = 0;

function raster(w0, w1, w2, baseCol, emissive, vcol, isWater) {
  const ca = toClip(w0, clipA).clone();
  const cb = toClip(w1, clipB).clone();
  const cc = toClip(w2, clipC).clone();

  const tris = clipNear(ca, cb, cc);
  if (!tris.length) { culled++; return; }

  /* ---- pencahayaan flat, dihitung sekali per segitiga dunia ---- */
  e1.subVectors(w1, w0); e2.subVectors(w2, w0);
  nrm.crossVectors(e1, e2).normalize();
  const cx = (w0.x + w1.x + w2.x) / 3;
  const cy = (w0.y + w1.y + w2.y) / 3;
  const cz = (w0.z + w1.z + w2.z) / 3;
  if (nrm.x * (camera.position.x - cx) + nrm.y * (camera.position.y - cy) + nrm.z * (camera.position.z - cz) < 0) nrm.negate();

  const ndl = Math.max(0, nrm.dot(sunDir));
  const hemiT = nrm.y * 0.5 + 0.5;
  shade.copy(hemiSky).lerp(hemiGnd, 1 - hemiT).multiplyScalar(preset.hemi.intensity * 0.42);
  const amb = preset.ambient * 0.5;
  shade.r += sunCol.r * ndl * preset.sun.intensity * 0.36 + amb;
  shade.g += sunCol.g * ndl * preset.sun.intensity * 0.36 + amb;
  shade.b += sunCol.b * ndl * preset.sun.intensity * 0.36 + amb;

  const bc = vcol || baseCol;
  let r, g, b;
  if (isWater) {
    // tiru shader: campur warna keruh dengan pantulan langit (fresnel)
    const vx = camera.position.x - cx, vy = camera.position.y - cy, vz = camera.position.z - cz;
    const vl = Math.hypot(vx, vy, vz);
    const ndv = Math.max(0, (vx * nrm.x + vy * nrm.y + vz * nrm.z) / vl);
    const fres = Math.pow(1 - ndv, 3.2);
    const spec = Math.pow(Math.max(0, nrm.dot(sunDir)), 60) * preset.water.sun;
    r = bc.r * (1 - fres * 0.62) + skyMid.r * fres * 0.62 + sunCol.r * spec;
    g = bc.g * (1 - fres * 0.62) + skyMid.g * fres * 0.62 + sunCol.g * spec;
    b = bc.b * (1 - fres * 0.62) + skyMid.b * fres * 0.62 + sunCol.b * spec;
  } else {
    r = bc.r * shade.r + emissive.r;
    g = bc.g * shade.g + emissive.g;
    b = bc.b * shade.b + emissive.b;
  }

  const dist = Math.hypot(camera.position.x - cx, camera.position.y - cy, camera.position.z - cz);
  const fog = Math.min(1, 1 - Math.exp(-Math.pow(dist * preset.fogDensity, 2)));
  r = r * (1 - fog) + fogCol.r * fog;
  g = g * (1 - fog) + fogCol.g * fog;
  b = b * (1 - fog) + fogCol.b * fog;

  for (const [q0, q1, q2] of tris) {
    const iw0 = 1 / q0.w, iw1 = 1 / q1.w, iw2 = 1 / q2.w;
    const sx0 = (q0.x * iw0 * 0.5 + 0.5) * W, sy0 = (1 - (q0.y * iw0 * 0.5 + 0.5)) * H, sz0 = q0.z * iw0;
    const sx1 = (q1.x * iw1 * 0.5 + 0.5) * W, sy1 = (1 - (q1.y * iw1 * 0.5 + 0.5)) * H, sz1 = q1.z * iw1;
    const sx2 = (q2.x * iw2 * 0.5 + 0.5) * W, sy2 = (1 - (q2.y * iw2 * 0.5 + 0.5)) * H, sz2 = q2.z * iw2;

    const area = (sx1 - sx0) * (sy2 - sy0) - (sx2 - sx0) * (sy1 - sy0);
    if (Math.abs(area) < 1e-9) continue;

    const minX = Math.max(0, Math.floor(Math.min(sx0, sx1, sx2)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(sx0, sx1, sx2)));
    const minY = Math.max(0, Math.floor(Math.min(sy0, sy1, sy2)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(sy0, sy1, sy2)));
    if (minX > maxX || minY > maxY) continue;

    const invArea = 1 / area;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const l0 = ((sx1 - px) * (sy2 - py) - (sx2 - px) * (sy1 - py)) * invArea;
        const l1 = ((sx2 - px) * (sy0 - py) - (sx0 - px) * (sy2 - py)) * invArea;
        const l2 = 1 - l0 - l1;
        if (l0 < 0 || l1 < 0 || l2 < 0) continue;
        const z = l0 * sz0 + l1 * sz1 + l2 * sz2;
        if (z < -1 || z > 1) continue;
        const idx = y * W + x;
        if (z >= depth[idx]) continue;
        depth[idx] = z;
        const i3 = idx * 3;
        color[i3] = r; color[i3 + 1] = g; color[i3 + 2] = b;
      }
    }
    drawn++;
  }
}

/* ---------------- traversal ---------------- */
const waterDeep = new THREE.Color(preset.water.deep);
const waterShallow = new THREE.Color(preset.water.shallow);
const lampBoost = preset.lightsOn;

const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3();
const zero = new THREE.Color(0, 0, 0);
const vcTmp = new THREE.Color();
let meshCount = 0;

scene.traverse((o) => {
  if (!o.isMesh) return;
  meshCount++;
  const geo = o.geometry;
  const posAttr = geo.attributes.position;
  if (!posAttr) return;

  const materials = Array.isArray(o.material) ? o.material : [o.material];
  const m0 = materials[0];
  let base = m0.color ? m0.color.clone() : new THREE.Color(0.7, 0.7, 0.7);
  let emis = zero;
  const isWater = o.name === 'water';
  if (isWater) {
    base = waterShallow.clone().lerp(waterDeep, 0.4);
  } else if (m0.emissive && m0.emissive.getHex() !== 0) {
    emis = m0.emissive.clone().multiplyScalar(lampBoost * 0.9);
  }
  if (m0.transparent && m0.opacity < 0.5) return;

  const colAttr = m0.vertexColors ? geo.attributes.color : null;
  const index = geo.index;
  const triCount = index ? index.count / 3 : posAttr.count / 3;

  const instances = o.isInstancedMesh ? o.count : 1;
  const instMat = new THREE.Matrix4();

  for (let inst = 0; inst < instances; inst++) {
    let worldMat = o.matrixWorld;
    if (o.isInstancedMesh) {
      o.getMatrixAt(inst, instMat);
      worldMat = new THREE.Matrix4().multiplyMatrices(o.matrixWorld, instMat);
    }
    for (let t = 0; t < triCount; t++) {
      const a = index ? index.getX(t * 3) : t * 3;
      const b = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const c = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      pA.fromBufferAttribute(posAttr, a).applyMatrix4(worldMat);
      pB.fromBufferAttribute(posAttr, b).applyMatrix4(worldMat);
      pC.fromBufferAttribute(posAttr, c).applyMatrix4(worldMat);
      let vc = null;
      if (colAttr) {
        vc = vcTmp.setRGB(
          (colAttr.getX(a) + colAttr.getX(b) + colAttr.getX(c)) / 3,
          (colAttr.getY(a) + colAttr.getY(b) + colAttr.getY(c)) / 3,
          (colAttr.getZ(a) + colAttr.getZ(b) + colAttr.getZ(c)) / 3);
      }
      raster(pA, pB, pC, base, emis, vc, isWater);
    }
  }
});

/* ---------------- tulis PNG ---------------- */
const buf = Buffer.alloc(H * (W * 3 + 1));
let o = 0;
for (let y = 0; y < H; y++) {
  buf[o++] = 0;
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) {
      // tone map ACES ringkas + gamma
      let v = color[i + k] * preset.exposure;
      v = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14);
      v = Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2);
      buf[o++] = Math.round(v * 255);
    }
  }
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
let TBL = null;
function crc32(b) {
  if (!TBL) { TBL = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TBL[n] = c; } }
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TBL[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
fs.writeFileSync(OUT, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(buf, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]));
console.log(`${OUT}  view=${CAM} preset=${process.argv[2] || 'pagi'}  meshes=${meshCount} tris drawn=${drawn} culled=${culled}`);
