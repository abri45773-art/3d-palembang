/**
 * Geometri Sungai Musi — satu-satunya sumber kebenaran bentuk sungai.
 * Semua modul (terrain, air, dermaga, perahu) memakai fungsi ini agar konsisten.
 */

/** Titik tengah sungai pada koordinat x tertentu. */
export function riverZ(x) {
  return 16 * Math.sin(x / 80) + 0.06 * x;
}

/** Setengah lebar sungai pada koordinat x tertentu. */
export function riverHalf(x) {
  return 30 + 6 * Math.sin(x / 50);
}

/** Kemiringan aliran (radian) — untuk mengarahkan perahu & dermaga. */
export function riverAngle(x) {
  const d = (16 / 80) * Math.cos(x / 80) + 0.06;
  return Math.atan(d);
}

/** Jarak bertanda dari tepi sungai. <0 di dalam air, >0 di darat. */
export function distToBank(x, z) {
  return Math.abs(z - riverZ(x)) - riverHalf(x);
}

/** Pulau Kemaro: delta di tengah sungai. */
export const ISLAND = { x: 88, z: 20, r: 23 };

export function islandHeight(x, z) {
  const d = Math.hypot(x - ISLAND.x, z - ISLAND.z);
  if (d > ISLAND.r) return 0;
  const t = 1 - d / ISLAND.r;
  return Math.pow(t, 0.6) * 4.2;
}
