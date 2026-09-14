import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ *
 *  Konstanta skala maket
 *  1 unit dunia = 4 meter di dunia nyata
 * ------------------------------------------------------------------ */
export const M2U = 1 / 4;          // meter -> unit
export const GROUND = 1.5;         // tinggi permukaan tanah pada maket
export const WATER_Y = 0.16;       // tinggi muka air Sungai Musi

/* ----------------------------- RNG -------------------------------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rnd = mulberry32(20260914);
export const rand = (a = 1, b) => (b === undefined ? rnd() * a : a + rnd() * (b - a));
export const randInt = (a, b) => Math.floor(a + rnd() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
export const chance = (p) => rnd() < p;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* --------------------------- Material ----------------------------- */
const matCache = new Map();

/** Material standar yang di-cache (warna + opsi). */
/**
 * Material standar yang di-cache.
 * Tekstur ikut menjadi bagian kunci (lewat id-nya) supaya dua material
 * dengan warna sama tetapi peta berbeda tidak saling menimpa —
 * mis. papan nama "SRIWIJAYA" vs "JAKABARING SPORT CITY".
 */
export function mat(color, opts = {}) {
  const TEX_KEYS = ['map', 'emissiveMap', 'roughnessMap', 'normalMap'];
  const texIds = TEX_KEYS.map((k) => (opts[k] ? opts[k].id : 0)).join(',');
  // salinan tanpa tekstur: jangan menyerialkan objek Texture (memicu toJSON)
  const rest = {};
  for (const [k, v] of Object.entries(opts)) if (!TEX_KEYS.includes(k)) rest[k] = v;
  const key = `${color}|${texIds}|${JSON.stringify(rest)}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), ...opts });
    matCache.set(key, m);
  }
  return m;
}

export function allCachedMaterials() {
  return [...matCache.values()];
}

/* --------------------------- Geometri ----------------------------- */
/** Kotak dengan alas berada pada (x, y, z). */
export function gBox(w, h, d, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return g;
}

/** Silinder dengan alas pada (x, y, z). */
export function gCyl(rt, rb, h, seg = 12, x = 0, y = 0, z = 0) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(x, y + h / 2, z);
  return g;
}

/** Prisma segitiga (atap pelana) sepanjang sumbu Z, alas di y. */
export function gGable(w, h, d, x = 0, y = 0, z = 0) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 });
  g.translate(x, y, z - d / 2);
  return g;
}

export function xform(geo, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale)
  );
  geo.applyMatrix4(m);
  return geo;
}

/**
 * Skalakan UV kotak supaya tekstur fasad punya skala konsisten
 * (jendela tidak melar walau ukuran bangunannya beda-beda).
 * Urutan muka BoxGeometry: +x, -x, +y, -y, +z, -z
 */
export function boxUV(geo, w, h, d, unitW = 9, unitH = 4.5) {
  const uv = geo.attributes.uv;
  const per = [d / unitW, d / unitW, w / unitW, w / unitW, w / unitW, w / unitW];
  const perV = [h / unitH, h / unitH, d / unitW, w / unitW, h / unitH, h / unitH];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * per[f], uv.getY(idx) * perV[f]);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

/* ----------------------------- Kit -------------------------------- *
 * Mengumpulkan geometri per-material lalu menggabungkannya menjadi
 * satu Mesh per material (hemat draw call untuk ratusan objek).
 * ------------------------------------------------------------------ */
export class Kit {
  constructor() {
    this.buckets = new Map();
  }
  /** @param {THREE.BufferGeometry} geo @param {THREE.Material} material */
  add(geo, material) {
    if (!material) {
      // geometri tanpa material akan hilang diam-diam setelah merge;
      // lebih baik berisik supaya ketahuan saat pengembangan
      console.warn('[Kit] geometri dibuang: material kosong', geo && geo.type);
      return this;
    }
    if (!geo) return this;
    const idx = materialCacheId(material);
    const kind = geo.index ? 'i' : 'n';
    const key = `${idx}|${kind}`;
    let b = this.buckets.get(key);
    if (!b) { b = { material, geos: [] }; this.buckets.set(key, b); }
    b.geos.push(geo);
    return this;
  }
  /** Bangun Mesh hasil merge ke dalam parent. */
  build(parent, { castShadow = true, receiveShadow = true, name = 'kit' } = {}) {
    const out = [];
    for (const { material, geos } of this.buckets.values()) {
      if (geos.length === 0) continue;
      let merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) continue;
      if (geos.length > 1) geos.forEach((g) => g.dispose());
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.name = name;
      parent.add(mesh);
      out.push(mesh);
    }
    this.buckets.clear();
    return out;
  }
}
const matIds = new WeakMap();
let matSeq = 0;
function materialCacheId(m) {
  let id = matIds.get(m);
  if (id === undefined) { id = ++matSeq; matIds.set(m, id); }
  return id;
}

/* ------------------- Bentuk 2D & tanah maket ---------------------- */
export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Extrude sebuah shape (didefinisikan pada bidang X/Y = dunia X/Z)
 * menjadi slab datar yang menebal ke bawah, puncak di yTop.
 */
export function slabGeometry(shape, yTop, thickness, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? 2 : 1,
    curveSegments: 8,
  });
  // rotasi +90° tentang X: (x,y,z) -> (x,-z,y)  =>  shape.y = dunia.z,
  // arah extrude (+Z) menjadi -Y (ke bawah).
  g.rotateX(Math.PI / 2);
  g.translate(0, yTop, 0);
  return g;
}

/* ------------------------- Kubah & atap --------------------------- */
/** Kubah bawang (khas masjid Palembang / Timur Tengah). */
export function gOnionDome(radius, height, segments = 28) {
  const pts = [];
  const prof = [
    [0.52, 0.00], [0.78, 0.06], [0.95, 0.16], [1.00, 0.28],
    [0.98, 0.42], [0.88, 0.58], [0.72, 0.74], [0.52, 0.88],
    [0.30, 0.97], [0.12, 1.00], [0.00, 1.00],
  ];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r * radius, y * height));
  const g = new THREE.LatheGeometry(pts, segments);
  return g;
}

/** Atap melengkung bergaya Tionghoa (pagoda) — melebar di bawah. */
export function gCurvedRoof(radius, height, sides = 4, rings = 8) {
  const g = new THREE.ConeGeometry(radius, height, sides, rings, true);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const f = (y + height / 2) / height;      // 0 = bawah, 1 = puncak
    const linear = 1 - f;
    const curved = Math.pow(Math.max(linear, 0), 0.42);
    const k = linear > 1e-5 ? curved / linear : 1;
    pos.setX(i, pos.getX(i) * k);
    pos.setZ(i, pos.getZ(i) * k);
    // sudut atap sedikit terangkat
    if (f < 0.06) pos.setY(i, y + height * 0.06);
  }
  pos.needsUpdate = true;
  g.translate(0, height / 2, 0);
  g.computeVertexNormals();
  return g;
}

/* ----------------------------- Lain ------------------------------- */
export function group(name, parent, pos = [0, 0, 0], rotY = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(...pos);
  g.rotation.y = rotY;
  if (parent) parent.add(g);
  return g;
}

export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => m.dispose());
    }
  });
}
