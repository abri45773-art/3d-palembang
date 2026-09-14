import { GROUND } from '../lib/util.js';

/* ------------------------------------------------------------------ *
 *  Tata letak maket.  1 unit = 4 meter.
 *  Sungai Musi mengalir sepanjang sumbu X; Seberang Ilir di z < 0,
 *  Seberang Ulu di z > 0. Jembatan Ampera menyeberang pada x = 0.
 * ------------------------------------------------------------------ */

export const BOUND_X = 420;
export const BOUND_Z = 320;

/** Garis tepian (tebing) sungai sisi utara / Seberang Ilir. */
export const bankN = (x) => -64 + 6 * Math.sin(x * 0.012) + 3 * Math.sin(x * 0.031 + 1.7);
/** Garis tepian sungai sisi selatan / Seberang Ulu. */
export const bankS = (x) => 66 + 5 * Math.sin(x * 0.014 + 2.1) + 3 * Math.sin(x * 0.028 + 0.4);

/** Jalan: axis 'h' = memanjang sumbu X, 'v' = memanjang sumbu Z. */
export const ROADS = {
  h: [
    // Seberang Ilir
    { at: -86, from: -BOUND_X, to: BOUND_X, w: 7, name: 'Jl. Rumah Bari – boulevard tepian Musi' },
    { at: -128, from: -330, to: 340, w: 5, name: 'Jl. Merdeka' },
    { at: -178, from: -330, to: 330, w: 4.5, name: 'Jl. Radial' },
    { at: -228, from: -320, to: 320, w: 4, name: 'Jl. Angkatan 45' },
    { at: -278, from: -280, to: 300, w: 4, name: 'Jl. Demang Lebar Daun' },
    // Seberang Ulu
    { at: 94, from: -BOUND_X, to: BOUND_X, w: 7, name: 'Jl. Sultan Agung – tepian Ulu' },
    { at: 140, from: -330, to: 340, w: 5, name: 'Jl. A. Yani' },
    { at: 196, from: -320, to: 330, w: 4.5, name: 'Jl. Gub. H. Bastari' },
    { at: 252, from: -280, to: 320, w: 4, name: 'Jl. Pangeran Ratu' },
    { at: 300, from: -200, to: 300, w: 4, name: 'Jl. Jakabaring' },
  ],
  v: [
    { at: 0, from: -300, to: -86, w: 8, name: 'Jl. Jend. Sudirman' },
    { at: 0, from: 94, to: 300, w: 8, name: 'Jl. Jend. Sudirman (Ulu)' },
    { at: -96, from: -290, to: -86, w: 4.5 },
    { at: -186, from: -270, to: -86, w: 4 },
    { at: -268, from: -230, to: -86, w: 4 },
    { at: 78, from: -290, to: -86, w: 4.5 },
    { at: 158, from: -280, to: -86, w: 4.5 },
    { at: 246, from: -240, to: -86, w: 4 },
    { at: 322, from: -180, to: -86, w: 4 },
    { at: -96, from: 94, to: 300, w: 4.5 },
    { at: -186, from: 94, to: 260, w: 4 },
    { at: -268, from: 94, to: 200, w: 4 },
    { at: 78, from: 94, to: 300, w: 4.5 },
    { at: 158, from: 94, to: 290, w: 4.5 },
    { at: 246, from: 94, to: 280, w: 4 },
    { at: 322, from: 94, to: 240, w: 4 },
  ],
};

/**
 * Zona yang tidak boleh diisi bangunan generik.
 * Bentuk: {x,z,hw,hd} persegi  |  {x,z,r} lingkaran
 */
export const ZONES = [
  // koridor Jembatan Ampera
  { x: 0, z: 0, hw: 20, hd: 110 },
  // Seberang Ilir
  { x: -100, z: -108, hw: 48, hd: 34 },   // Benteng Kuto Besak
  { x: -100, z: -62, hw: 40, hd: 16 },    // Pelataran BKB
  { x: -34, z: -106, hw: 26, hd: 24 },    // Masjid Agung
  { x: 22, z: -76, hw: 18, hd: 14 },      // Monpera
  { x: 62, z: -100, hw: 22, hd: 16 },     // Pasar 16 Ilir
  { x: 120, z: -70, hw: 22, hd: 14 },     // dermaga / pelabuhan
  { x: 150, z: -196, hw: 52, hd: 40 },    // Taman Kambang Iwak
  { x: 186, z: -124, hw: 30, hd: 26 },    // Palembang Icon
  { x: -196, z: -104, hw: 40, hd: 26 },   // kampung lawas 19/20 Ilir
  { x: 250, z: -200, hw: 46, hd: 40 },    // kompleks perkantoran
  // Seberang Ulu
  { x: -66, z: 92, hw: 44, hd: 22 },      // Kampung Kapitan
  { x: 42, z: 80, hw: 40, hd: 18 },       // Kampung Al-Munawar
  { x: -172, z: 82, hw: 26, hd: 20 },     // Masjid Ki Marogan
  { x: 108, z: 108, hw: 24, hd: 20 },     // Pasar 7 Ulu
  { x: 232, z: 200, r: 78 },              // Gelora Sriwijaya / JSC
  { x: 96, z: 268, hw: 60, hd: 34 },      // kompleks JSC selatan
  { x: -250, z: 200, hw: 50, hd: 46 },    // permukiman Ogan
  // alur anak sungai / kanal
  { x: -141, z: -108, hw: 9, hd: 40 },    // Sungai Sekanak
  { x: 218, z: 104, hw: 8, hd: 45 },      // anak sungai Seberang Ulu
];

/** Jalan terdekat: sumbu dan jaraknya (untuk orientasi bangunan). */
export function nearestRoad(x, z) {
  let best = { axis: 'h', dist: 1e9 };
  for (const r of ROADS.h) {
    if (x >= r.from - 4 && x <= r.to + 4) {
      const d = Math.abs(z - r.at);
      if (d < best.dist) best = { axis: 'h', dist: d };
    }
  }
  for (const r of ROADS.v) {
    if (z >= r.from - 4 && z <= r.to + 4) {
      const d = Math.abs(x - r.at);
      if (d < best.dist) best = { axis: 'v', dist: d };
    }
  }
  return best;
}

export function inZone(x, z) {
  for (const zn of ZONES) {
    if (zn.r) {
      const dx = x - zn.x, dz = z - zn.z;
      if (dx * dx + dz * dz < zn.r * zn.r) return true;
    } else if (Math.abs(x - zn.x) < zn.hw && Math.abs(z - zn.z) < zn.hd) {
      return true;
    }
  }
  return false;
}

/** Jarak ke sumbu jalan terdekat (dipakai untuk menempatkan bangunan). */
export function roadDistance(x, z) {
  let best = 1e9;
  for (const r of ROADS.h) {
    if (z >= r.from - 4 && z <= r.to + 4) best = Math.min(best, Math.abs(z - r.at));
  }
  for (const r of ROADS.v) {
    if (x >= r.from - 4 && x <= r.to + 4) best = Math.min(best, Math.abs(x - r.at));
  }
  return best;
}

export const ROAD_Y = GROUND + 0.02;
