import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Registri material & lampu yang "hidup" saat malam.
 *  Semua objek cukup mendaftar di sini, lalu world.setNight() menyalakan
 *  semuanya secara serempak.
 * ------------------------------------------------------------------ */
export const nightEntries = [];

/** Material yang menyala saat malam (jendela, lampu jalan, neon). */
export function litMaterial(color, emissive, max = 2.2, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(emissive),
    emissiveIntensity: 0,
    roughness: 0.6,
    metalness: 0,
    ...opts,
  });
  nightEntries.push({ type: 'mat', ref: m, max });
  return m;
}

/** Lampu titik yang hanya menyala malam hari. */
export function nightLight(color, intensity, distance, decay = 2) {
  const l = new THREE.PointLight(new THREE.Color(color), 0, distance, decay);
  nightEntries.push({ type: 'light', ref: l, max: intensity });
  return l;
}

/** Callback khusus (mis. animasi neon). */
export function onNight(fn) {
  nightEntries.push({ type: 'fn', ref: fn, max: 1 });
}

export function applyNight(n) {
  for (const e of nightEntries) {
    if (e.type === 'mat') e.ref.emissiveIntensity = e.max * n;
    else if (e.type === 'light') e.ref.intensity = e.max * n;
    else e.ref(n);
  }
}

export function disposeNight() {
  nightEntries.length = 0;
}
