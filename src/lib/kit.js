import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Material & geometry kit — dipakai bersama oleh semua builder       */
/* ------------------------------------------------------------------ */

const matCache = new Map();

/** Material standar ber-cache (hemat draw state & memori). */
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.04,
    flatShading: opts.flat ?? false,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    emissive: new THREE.Color(opts.emissive ?? '#000000'),
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
  matCache.set(key, m);
  return m;
}

/** Material "lampu" — akan dinyalakan/dimatikan oleh preset waktu. */
const emissives = [];
export function lampMat(color, base = '#ffffff') {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(base),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0,
    roughness: 0.4,
    metalness: 0,
  });
  emissives.push(m);
  return m;
}
export function setLampIntensity(v) {
  for (const m of emissives) m.emissiveIntensity = v;
}

const geoCache = new Map();
function cachedGeo(key, factory) {
  if (!geoCache.has(key)) geoCache.set(key, factory());
  return geoCache.get(key);
}
export const BOX = cachedGeo('box', () => new THREE.BoxGeometry(1, 1, 1));
export const CYL = (seg = 16) => cachedGeo('cyl' + seg, () => new THREE.CylinderGeometry(1, 1, 1, seg));
export const CONE = (seg = 4) => cachedGeo('cone' + seg, () => new THREE.ConeGeometry(1, 1, seg));
export const SPH = (seg = 16) => cachedGeo('sph' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(8, seg / 2)));
export const PLANE = cachedGeo('plane', () => new THREE.PlaneGeometry(1, 1));

/** Kotak cepat: box(w,h,d, x,y,z, material) — y adalah posisi dasar (bukan pusat). */
export function box(w, h, d, x, y, z, material, rotY = 0) {
  const m = new THREE.Mesh(BOX, material);
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  if (rotY) m.rotation.y = rotY;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Silinder: cyl(rTop, rBot, h, x, y, z, mat, seg) */
export function cyl(rTop, rBot, h, x, y, z, material, seg = 16) {
  const g = new THREE.CylinderGeometry(rTop, rBot, 1, seg);
  const m = new THREE.Mesh(g, material);
  m.scale.y = h;
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Limas / kerucut: cone(r, h, x, y, z, mat, seg, rotY) */
export function cone(r, h, x, y, z, material, seg = 4, rotY = Math.PI / 4) {
  const m = new THREE.Mesh(CONE(seg), material);
  m.scale.set(r, h, r);
  m.position.set(x, y + h / 2, z);
  m.rotation.y = rotY;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function sphere(r, x, y, z, material, seg = 16) {
  const m = new THREE.Mesh(SPH(seg), material);
  m.scale.setScalar(r);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Atap pelana (gable) memanjang sumbu X, dengan overhang.
 * Menghasilkan prisma segitiga.
 */
export function gableRoof(w, h, d, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false, curveSegments: 1 });
  geo.rotateY(Math.PI / 2);
  geo.translate(w / 2, 0, 0);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Atap limas Palembang: piramida terpotong dengan ujung bubungan
 * sedikit melengkung ke atas (disederhanakan jadi trapesium + bubungan).
 */
export function limasRoof(w, d, h, topScale, material) {
  const hw = w / 2, hd = d / 2;
  const tw = hw * topScale, td = hd * topScale;
  const v = [
    -hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd, // bawah
    -tw, h, -td, tw, h, -td, tw, h, td, -tw, h, td, // atas
  ];
  const idx = [
    0, 1, 5, 0, 5, 4, // -z
    1, 2, 6, 1, 6, 5, // +x
    2, 3, 7, 2, 7, 6, // +z
    3, 0, 4, 3, 4, 7, // -x
    4, 5, 6, 4, 6, 7, // top
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Silinder tipis sebagai batang/rangka antara dua titik. */
export function strut(a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(CYL(6), material);
  m.scale.set(r, len, r);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

/** RNG deterministik supaya kota selalu tergenerasi sama. */
export function makeRng(seed = 1337) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

/** Tandai seluruh mesh di dalam group agar bisa di-raycast ke landmark. */
export function tag(group, id) {
  group.traverse((o) => { if (o.isMesh) o.userData.landmark = id; });
  group.userData.landmark = id;
  return group;
}

export const PALETTE = {
  amperaRed: '#d43b2f',
  amperaRedDark: '#a82a20',
  amperaBlue: '#2f9ec4',
  concrete: '#b9b4a8',
  concreteDark: '#8d887c',
  asphalt: '#4d5257',
  roadLine: '#e8e3d5',
  brick: '#a9784f',
  brickDark: '#8a5e3c',
  plaster: '#e6ddca',
  mosqueGreen: '#12866f',
  mosqueGreenDark: '#0c6354',
  gold: '#d7b146',
  roofRed: '#9e4234',
  roofBrown: '#6d4a30',
  roofDark: '#4a3a2e',
  wood: '#8a6242',
  woodDark: '#5f4229',
  woodLight: '#b08a5e',
  foliage: '#4a7a3c',
  foliageDark: '#356029',
  foliageLight: '#6b9c4a',
  grass: '#7c8f57',
  ground: '#a99a7c',
  white: '#f2ede1',
  glassDay: '#8fb3c4',
  pagodaRed: '#c8453c',
  pagodaGold: '#e0b84e',
};
