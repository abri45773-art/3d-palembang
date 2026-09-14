import * as THREE from 'three';
import { Kit, GROUND, mat, gBox, gCyl, gGable, gCurvedRoof, group, rnd, rand, pick, chance } from '../lib/util.js';
import { litMaterial, nightLight } from './lights.js';
import { bankN, bankS } from './layout.js';

const mWood = mat('#7a5738', { roughness: 0.9 });
const mWoodDark = mat('#54391f', { roughness: 0.95 });
const mWallWood = mat('#bd9260', { roughness: 0.88 });
const mWallCream = mat('#e2d3b3', { roughness: 0.9 });
const mRoofTile = mat('#6d4433', { roughness: 0.85 });
const mRoofDark = mat('#4a4438', { roughness: 0.9 });
const mRed = mat('#a32b23', { roughness: 0.7 });
const mGold = mat('#d8a83e', { roughness: 0.35, metalness: 0.7 });

const litLamp = litMaterial('#ffd9a0', '#ffab4d', 3.0, { roughness: 0.5 });
const litLantern = litMaterial('#e0453a', '#ff5a3c', 2.8, { roughness: 0.6 });

/** terapkan rotasi-Y lalu translasi pada geometri */
function place(geo, x, z, rotY = 0) {
  if (rotY) geo.rotateY(rotY);
  geo.translate(x, 0, z);
  return geo;
}

/**
 * Rumah panggung khas tepian Musi (rumah ulu / rumah limas).
 * Setiap bagian langsung masuk ke Kit dengan materialnya masing-masing.
 */
function rumahPanggung(kit, o) {
  const {
    w = 8, d = 7, h = 4, x = 0, z = 0, y = GROUND, rotY = 0,
    roof = 'gable', body = mWallWood, roofMat = mRoofTile, stilts = true, lantern = false,
  } = o;
  const floorY = y + 1.5;
  const add = (geo, m) => kit.add(place(geo, x, z, rotY), m);

  if (stilts) {
    const nx = Math.max(2, Math.round(w / 3.2));
    const nz = Math.max(2, Math.round(d / 3.2));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= nz; j++) {
        add(gBox(0.42, 1.7, 0.42, -w / 2 + (i * w) / nx, y - 0.2, -d / 2 + (j * d) / nz), mWoodDark);
      }
    }
  }
  add(gBox(w + 0.5, 0.36, d + 0.5, 0, floorY - 0.36, 0), mWood);
  add(gBox(w, h, d, 0, floorY, 0), body);
  add(gBox(w + 0.5, 0.3, d + 0.5, 0, floorY + h, 0), mWood);

  if (roof === 'chinese') {
    const big = Math.max(w, d), small = Math.min(w, d);
    const r = gCurvedRoof(big * 0.84, big * 0.36, 4, 6);
    r.scale(1, 1, small / big);
    r.rotateY(Math.PI / 4);
    r.translate(0, floorY + h + 0.3, 0);
    add(r, roofMat);
  } else if (roof === 'limas') {
    const big = Math.max(w, d), small = Math.min(w, d);
    const r = new THREE.ConeGeometry(big * 0.8, big * 0.45, 4, 1);
    r.scale(1, 1, small / big);
    r.rotateY(Math.PI / 4);
    r.translate(0, floorY + h + 0.3 + (big * 0.45) / 2, 0);
    add(r, roofMat);
  } else {
    add(gGable(w + 1.3, Math.max(2.4, w * 0.36), d + 1.3, 0, floorY + h + 0.3, 0), roofMat);
    add(gBox(w + 1.4, 0.18, 0.3, 0, floorY + h + 0.3, d / 2 + 0.7), mWood);
    add(gBox(w + 1.4, 0.18, 0.3, 0, floorY + h + 0.3, -d / 2 - 0.7), mWood);
  }

  // teras, pagar, tangga
  add(gBox(w * 0.42, 0.26, 2.4, -w * 0.28, floorY - 0.12, d / 2 + 1.2), mWood);
  for (let i = -2; i <= 2; i++) add(gBox(0.14, 0.95, 0.14, -w * 0.28 + i * (w * 0.09), floorY + 0.14, d / 2 + 2.3), mWood);
  add(gBox(w * 0.42, 0.12, 0.12, -w * 0.28, floorY + 1.05, d / 2 + 2.3), mWood);
  for (let s = 0; s < 4; s++) add(gBox(1.7, 0.2, 0.5, -w * 0.28, y + s * 0.44, d / 2 + 2.8 + (3 - s) * 0.5), mWood);

  // jendela & pintu
  const nw = Math.max(1, Math.round(w / 3));
  for (let i = 0; i < nw; i++) {
    add(gBox(1.05, 1.3, 0.18, -w / 2 + ((i + 0.5) * w) / nw, floorY + h * 0.34, d / 2 + 0.03), litLamp);
    add(gBox(0.18, 1.3, 1.05, w / 2 + 0.03, floorY + h * 0.34, -d / 4 + (i * d) / (nw * 2)), litLamp);
  }
  add(gBox(1.2, 2.0, 0.18, w * 0.2, floorY + 0.1, d / 2 + 0.03), mWoodDark);

  if (lantern) {
    for (const sx of [-1, 1]) {
      const s = new THREE.SphereGeometry(0.42, 10, 8);
      s.scale(1, 1.25, 1);
      s.translate(sx * w * 0.36, floorY + h - 0.4, d / 2 + 0.6);
      add(s, litLantern);
    }
  }
}

/* ================================================================== *
 *  KAMPUNG KAPITAN — permukiman Tionghoa tertua di tepi Musi
 * ================================================================== */
export function buildKampungKapitan(parent, x = -66, z = 92) {
  const g = group('kampung-kapitan', parent);
  const kit = new Kit();
  const bank = bankS(x);
  const rows = [
    { z: bank + 16, n: 6, body: mRed, roof: 'chinese', roofMat: mRoofDark },
    { z: bank + 30, n: 5, body: mWallWood, roof: 'chinese', roofMat: mRoofTile },
    { z: bank + 44, n: 4, body: mWallCream, roof: 'gable', roofMat: mRoofTile },
  ];
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.n; i++) {
      const hx = x - 34 + i * (68 / Math.max(1, row.n - 1)) + (ri % 2) * 4;
      rumahPanggung(kit, {
        w: 9 + rnd() * 3, d: 8 + rnd() * 2.5, h: 4.4,
        x: hx, z: row.z + (rnd() - 0.5) * 3, y: GROUND,
        rotY: (rnd() - 0.5) * 0.12,
        body: row.body, roof: row.roof, roofMat: row.roofMat, lantern: ri === 0,
      });
    }
  });
  // klenteng kecil di tengah kampung
  const tx = x + 2, tz = bank + 30;
  rumahPanggung(kit, { w: 11, d: 9, h: 5, x: tx, z: tz, body: mRed, roof: 'chinese', roofMat: mRoofDark, lantern: true });
  for (const sx of [-1, 1]) {
    kit.add(gCyl(0.5, 0.6, 6.0, 8, tx + sx * 7.5, GROUND, tz + 6.5), mRed);
    const cap = gCurvedRoof(2.2, 1.1, 4, 5);
    cap.rotateY(Math.PI / 4);
    cap.translate(0, GROUND + 6.0, 0);
    kit.add(place(cap, tx + sx * 7.5, tz + 6.5), mRoofDark);
  }
  // jalan papan antar rumah
  for (let i = -3; i <= 3; i++) {
    const plank = gBox(2.2, 0.16, 34, 0, GROUND + 0.1, 0);
    kit.add(place(plank, x + i * 11, bank + 30), mWood);
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'kampung-kapitan' });

  const lamp = nightLight('#ffc98a', 34, 60, 2);
  lamp.position.set(x, GROUND + 9, bank + 26);
  g.add(lamp);
  return { group: g, labelAt: [x, GROUND + 14, bank + 28] };
}

/* ================================================================== *
 *  KAMPUNG ARAB AL-MUNAWAR — rumah panggung kayu berusia ratusan tahun
 * ================================================================== */
export function buildAlMunawar(parent, x = 42, z = 80) {
  const g = group('al-munawar', parent);
  const kit = new Kit();
  const bank = bankS(x);
  for (let row = 0; row < 3; row++) {
    const zz = bank + 12 + row * 13;
    for (let i = 0; i < 5; i++) {
      const hx = x - 30 + i * 15 + (row % 2) * 5;
      rumahPanggung(kit, {
        w: 10 + rnd() * 2, d: 8.5, h: 4.8 + rnd(),
        x: hx, z: zz + (rnd() - 0.5) * 2, rotY: (rnd() - 0.5) * 0.1,
        body: row === 1 ? mWallCream : mWallWood,
        roof: row === 1 ? 'limas' : 'gable',
        roofMat: row === 0 ? mRoofDark : mRoofTile,
      });
    }
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'al-munawar' });
  const lamp = nightLight('#ffc98a', 26, 54, 2);
  lamp.position.set(x, GROUND + 8, bank + 20);
  g.add(lamp);
  return { group: g, labelAt: [x, GROUND + 13, bank + 18] };
}

/* ================================================================== *
 *  RUMAH RAKIT — rumah terapung di atas rakit bambu
 * ================================================================== */
export function buildRumahRakit(parent) {
  const g = group('rumah-rakit', parent);
  const floaters = [];
  const spots = [
    [-214, bankN(-214) + 14, 0.15], [-186, bankN(-186) + 16, -0.2],
    [-40, bankN(-40) + 12, 0.35], [86, bankN(86) + 15, -0.1],
    [150, bankN(150) + 13, 0.25], [196, bankN(196) + 16, -0.3],
    [-244, bankS(-244) - 14, 0.1], [-120, bankS(-120) - 16, -0.25],
    [120, bankS(120) - 13, 0.4], [208, bankS(208) - 15, -0.15],
    [270, bankS(270) - 17, 0.2],
  ];
  spots.forEach(([x, z, ph], i) => {
    const fg = group(`rakit-${i}`, g, [x, 0, z], (z < 0 ? Math.PI : 0) + (rnd() - 0.5) * 0.3);
    const kit = new Kit();
    const w = 8 + rnd() * 3, d = 7 + rnd() * 2;
    // rakit bambu
    for (let k = -4; k <= 4; k++) kit.add(gBox(w + 2.2, 0.34, 0.62, 0, -0.5, k * 0.72), mat('#a98a52', { roughness: 0.9 }));
    kit.add(gBox(w + 2.4, 0.2, d + 1.2, 0, -0.16, 0), mWood);
    rumahPanggung(kit, {
      w, d, h: 3.4, x: 0, z: 0, y: 0.0, rotY: 0, stilts: false,
      body: i % 3 === 0 ? mWallCream : mWallWood, roof: 'gable', roofMat: i % 2 ? mRoofDark : mRoofTile,
    });
    kit.build(fg, { castShadow: true, receiveShadow: true, name: 'rakit-body' });
    floaters.push({ obj: fg, phase: ph, amp: 0.16 + rnd() * 0.1 });
  });

  return {
    group: g,
    update(t) {
      for (const f of floaters) {
        f.obj.position.y = Math.sin(t * 0.7 + f.phase * 9) * f.amp;
        f.obj.rotation.z = Math.sin(t * 0.5 + f.phase * 7) * 0.012;
        f.obj.rotation.x = Math.cos(t * 0.43 + f.phase * 5) * 0.012;
      }
    },
  };
}
