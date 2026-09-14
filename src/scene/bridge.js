import * as THREE from 'three';
import { Kit, GROUND, mat, gBox, gCyl, group, rand } from '../lib/util.js';
import { bankN, bankS } from './layout.js';

/* ------------------------------------------------------------------ *
 *  JEMBATAN AMPERA
 *  Fakta yang dipakai: panjang ±1.117 m, lebar 22 m, tinggi 11,5 m di
 *  atas air, dua menara 63 m dengan jarak 75 m, bandul 500 ton.
 *  Skala maket: 1 unit = 4 meter.
 * ------------------------------------------------------------------ */
const U = 1 / 4;
const DECK_Y = 11.5 * U;          // 2.875
const DECK_W = 22 * U;            // 5.5
const TOWER_H = 63 * U;           // 15.75
const TOWER_GAP = 75 * U;         // 18.75

export function buildAmpera(parent) {
  const g = group('jembatan-ampera', parent);
  const kit = new Kit();

  const mRed = mat('#b8322a', { roughness: 0.55, metalness: 0.25 });
  const mRedDark = mat('#8e2620', { roughness: 0.6, metalness: 0.25 });
  const mDeck = mat('#4b4f54', { roughness: 0.9 });
  const mConcrete = mat('#9c968a', { roughness: 0.95 });
  const mSteel = mat('#6e7276', { roughness: 0.5, metalness: 0.4 });
  const mGlass = mat('#20303a', { roughness: 0.25, metalness: 0.5 });

  const zN = -TOWER_GAP / 2;      // menara utara
  const zS = TOWER_GAP / 2;       // menara selatan
  const deckStart = -118;         // ujung utara (di daratan Ilir)
  const deckEnd = 118;            // ujung selatan (di daratan Ulu)

  /* --------- geladak --------- */
  kit.add(gBox(DECK_W, 0.55, deckEnd - deckStart, 0, DECK_Y - 0.55, 0), mDeck);
  // trotoar
  kit.add(gBox(0.9, 0.28, deckEnd - deckStart, -DECK_W / 2 + 0.45, DECK_Y, 0), mConcrete);
  kit.add(gBox(0.9, 0.28, deckEnd - deckStart, DECK_W / 2 - 0.45, DECK_Y, 0), mConcrete);
  // garis jalan
  const mLine = mat('#d9d2b8', { roughness: 0.9 });
  for (let z = deckStart + 4; z < deckEnd - 4; z += 10) kit.add(gBox(0.28, 0.03, 4.2, 0, DECK_Y + 0.01, z), mLine);

  /* --------- rangka geladak --------- */
  for (let z = deckStart + 3; z < deckEnd - 3; z += 5.5) {
    kit.add(gBox(DECK_W + 0.4, 0.3, 0.3, 0, DECK_Y - 0.85, z), mRed);
    kit.add(gBox(0.26, 0.5, 0.26, -DECK_W / 2 - 0.05, DECK_Y - 1.1, z), mRed);
    kit.add(gBox(0.26, 0.5, 0.26, DECK_W / 2 + 0.05, DECK_Y - 1.1, z), mRed);
  }
  // gelagar memanjang
  kit.add(gBox(0.3, 0.5, deckEnd - deckStart, -DECK_W / 2 - 0.05, DECK_Y - 1.1, 0), mRed);
  kit.add(gBox(0.3, 0.5, deckEnd - deckStart, DECK_W / 2 + 0.05, DECK_Y - 1.1, 0), mRed);

  /* --------- pagar & lampu --------- */
  const lampPts = [];
  let li = 0;
  for (let z = deckStart + 2; z < deckEnd - 2; z += 4, li++) {
    for (const sx of [-1, 1]) {
      kit.add(gBox(0.1, 0.85, 0.1, sx * (DECK_W / 2 - 0.15), DECK_Y + 0.28, z), mRedDark);
    }
    kit.add(gBox(0.08, 0.08, 4, -DECK_W / 2 + 0.15, DECK_Y + 1.05, z + 2), mRedDark);
    kit.add(gBox(0.08, 0.08, 4, DECK_W / 2 - 0.15, DECK_Y + 1.05, z + 2), mRedDark);
    if (li % 4 === 0) {
      lampPts.push([
        [DECK_W / 2 - 0.6, DECK_Y + 0.28, z],
        [-DECK_W / 2 + 0.6, DECK_Y + 0.28, z],
      ]);
    }
  }

  /* --------- pilar pendekatan --------- */
  const piers = [];
  for (let z = deckStart + 8; z <= deckEnd - 8; z += 15) {
    if (Math.abs(z) < TOWER_GAP / 2 + 4) continue;
    piers.push(z);
    const inWater = z > bankN(0) && z < bankS(0);
    const baseY = inWater ? -1.2 : GROUND;
    kit.add(gBox(2.2, DECK_Y - 1.0 - baseY, 2.2, 0, baseY, z), mConcrete);
    kit.add(gBox(3.2, 0.6, 3.2, 0, DECK_Y - 1.4, z), mConcrete);
    if (inWater) kit.add(gBox(3.6, 1.4, 3.6, 0, -1.2, z), mConcrete);
  }

  /* --------- menara --------- */
  const tower = (zc) => {
    const legX = 4.1;
    for (const sx of [-1, 1]) {
      // kaki menara: sedikit menyempit ke atas
      const segs = 6;
      for (let i = 0; i < segs; i++) {
        const y0 = -1.2 + (i * (TOWER_H + 1.2)) / segs;
        const hgt = (TOWER_H + 1.2) / segs + 0.05;
        const w = 1.7 - i * 0.09;
        kit.add(gBox(w, hgt, w, sx * legX, y0, zc), mRed);
      }
      // pondasi
      kit.add(gBox(3.2, 1.0, 4.4, sx * legX, -1.2, zc), mConcrete);
    }
    // balang melintang & silang
    for (const [y, h] of [[3.4, 0.6], [7.2, 0.6], [11.0, 0.7], [14.2, 0.8]]) {
      kit.add(gBox(legX * 2 + 1.4, h, 1.1, 0, y, zc), mRed);
    }
    for (const y0 of [-0.6, 3.9, 7.7, 11.5]) {
      const h = 3.4;
      const len = Math.hypot(h, legX * 2);
      const ang = Math.atan2(legX * 2, h);
      for (const sx of [-1, 1]) {
        const d = new THREE.BoxGeometry(0.34, len, 0.34);
        d.translate(0, len / 2, 0);          // pangkal di titik asal
        d.rotateZ(sx * ang);                 // ujung ke (−sx·2·legX, h)
        d.translate(sx * legX, y0, zc);
        kit.add(d, mRedDark);
      }
    }
    // kepala menara + rumah mesin pengangkat
    kit.add(gBox(legX * 2 + 2.6, 1.1, 3.4, 0, TOWER_H - 1.0, zc), mRed);
    kit.add(gBox(4.4, 2.0, 2.4, 0, TOWER_H + 0.1, zc), mRedDark);
    kit.add(gBox(4.8, 0.3, 2.8, 0, TOWER_H + 2.1, zc), mSteel);
    kit.add(gBox(1.0, 1.2, 1.0, 0, TOWER_H + 2.4, zc), mSteel);
    // bandul pemberat 500 ton
    for (const sx of [-1, 1]) {
      kit.add(gBox(1.5, 3.2, 1.8, sx * (legX + 1.0), TOWER_H - 5.6, zc), mSteel);
      kit.add(gBox(0.18, 4.4, 0.18, sx * (legX + 1.0), TOWER_H - 5.6, zc - 0.9), mSteel);
      kit.add(gBox(0.18, 4.4, 0.18, sx * (legX + 1.0), TOWER_H - 5.6, zc + 0.9), mSteel);
    }
    // kaca kabin pandang
    kit.add(gBox(3.6, 1.1, 1.9, 0, TOWER_H + 0.5, zc), mGlass);
  };
  tower(zN);
  tower(zS);

  /* --------- rentang utama: rangka lebih rapat --------- */
  for (let z = zN; z <= zS; z += 2.4) {
    kit.add(gBox(DECK_W + 0.6, 0.34, 0.34, 0, DECK_Y - 1.05, z), mRed);
    kit.add(gBox(0.34, 1.5, 0.34, -DECK_W / 2 - 0.15, DECK_Y - 1.5, z), mRed);
    kit.add(gBox(0.34, 1.5, 0.34, DECK_W / 2 + 0.15, DECK_Y - 1.5, z), mRed);
  }

  kit.build(g, { castShadow: true, receiveShadow: true, name: 'ampera' });

  /* --------- lampu jembatan (menyala malam hari) --------- */
  const bulbMat = mat('#ffd9a0', { emissive: '#ffb765', emissiveIntensity: 0, roughness: 0.4 });
  const stripMat = mat('#ffdca8', { emissive: '#ffab4d', emissiveIntensity: 0, roughness: 0.5 });
  const bulbKit = new Kit();
  for (const pair of lampPts) {
    for (const [x, y, z] of pair) {
      bulbKit.add(gCyl(0.07, 0.07, 2.6, 6, x, y, z), mSteel);
      bulbKit.add(gBox(0.34, 0.2, 0.9, x, y + 2.6, z), bulbMat);
    }
  }
  // garis lampu sepanjang rangka menara
  for (const zc of [zN, zS]) {
    for (const sx of [-1, 1]) {
      bulbKit.add(gBox(0.16, TOWER_H, 0.16, sx * 4.1 + sx * 0.85, -1.2, zc), stripMat);
    }
    bulbKit.add(gBox(10.4, 0.16, 0.16, 0, TOWER_H - 1.0, zc + 1.75), stripMat);
  }
  bulbKit.build(g, { castShadow: false, receiveShadow: false, name: 'ampera-lampu' });

  const lights = [];
  for (const zc of [zN, zS]) {
    const l = new THREE.PointLight('#ffbe7a', 0, 46, 2);
    l.position.set(0, TOWER_H - 2, zc);
    g.add(l);
    lights.push(l);
  }
  const deckL = new THREE.PointLight('#ffd0a0', 0, 40, 2);
  deckL.position.set(0, DECK_Y + 3, 0);
  g.add(deckL);
  lights.push(deckL);

  return {
    group: g,
    lampBulbs: bulbMat,
    strips: stripMat,
    lights,
    night(n) {
      bulbMat.emissiveIntensity = 2.6 * n;
      stripMat.emissiveIntensity = 2.2 * n;
      lights.forEach((l) => (l.intensity = 22 * n));
    },
    labelAt: [0, TOWER_H + 4, 0],
  };
}

/* ------------------------------------------------------------------ *
 *  JEMBATAN MUSI IV — kabel pancang (dibuka 2019), sisi timur kota
 * ------------------------------------------------------------------ */
export function buildMusiIV(parent, x = 250) {
  const g = group('jembatan-musi-iv', parent, [x, 0, 0]);
  const kit = new Kit();
  const mWhite = mat('#e4e2dc', { roughness: 0.6 });
  const mDeck = mat('#54585d', { roughness: 0.9 });
  const mRed = mat('#a8382c', { roughness: 0.55, metalness: 0.2 });
  const mCable = mat('#d8d4cc', { roughness: 0.4, metalness: 0.5 });

  const Y = 3.6, half = 62;
  kit.add(gBox(5.0, 0.5, half * 2, 0, Y - 0.5, 0), mDeck);
  kit.add(gBox(5.6, 0.22, half * 2, 0, Y, 0), mDeck);
  // pilon H
  for (const sz of [-1, 1]) {
    kit.add(gBox(1.0, 13.5, 1.0, -1.5, -1.2, sz * 9), mRed);
    kit.add(gBox(1.0, 13.5, 1.0, 1.5, -1.2, sz * 9), mRed);
    kit.add(gBox(3.6, 0.9, 1.0, 0, 8.0, sz * 9), mRed);
    kit.add(gBox(2.4, 1.4, 2.4, 0, -1.2, sz * 9), mWhite);
    // kabel pancang: dari puncak pilon turun ke geladak
    const topY = 11.4;
    for (let i = 1; i <= 7; i++) {
      const dz = (i / 7) * 44;
      const h = topY - Y;
      const len = Math.hypot(h, dz);
      for (const side of [-1, 1]) {
        const cable = new THREE.CylinderGeometry(0.07, 0.07, len, 5);
        cable.translate(0, len / 2, 0);                 // pangkal di titik asal
        cable.rotateX(side * (Math.PI - Math.atan2(dz, h))); // ujung ke (0, −h, side·dz)
        cable.translate(0, topY, sz * 9);
        kit.add(cable, mCable);
      }
    }
  }
  // pilar
  for (let z = -half + 8; z <= half - 8; z += 16) {
    if (Math.abs(Math.abs(z) - 9) < 4) continue;
    kit.add(gBox(1.8, Y + 0.4, 1.8, 0, -1.2, z), mWhite);
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'musi-iv' });
  return { group: g, night() {} };
}

/* ------------------------------------------------------------------ *
 *  JEMBATAN MUSI II — rangka baja, sisi barat kota
 * ------------------------------------------------------------------ */
export function buildMusiII(parent, x = -290) {
  const g = group('jembatan-musi-ii', parent, [x, 0, 0]);
  const kit = new Kit();
  const mSteel = mat('#7d8186', { roughness: 0.5, metalness: 0.45 });
  const mDeck = mat('#54585d', { roughness: 0.9 });
  const half = 60;
  const Y = 3.2;
  kit.add(gBox(4.6, 0.5, half * 2, 0, Y - 0.5, 0), mDeck);
  for (let z = -half; z <= half; z += 7.5) {
    kit.add(gBox(4.8, 0.4, 0.4, 0, Y - 0.9, z), mSteel);
    for (const sx of [-1, 1]) {
      kit.add(gBox(0.3, 3.2, 0.3, sx * 2.2, Y - 0.5, z), mSteel);
      const d = new THREE.BoxGeometry(0.24, Math.hypot(3.2, 7.5), 0.24);
      d.translate(0, Math.hypot(3.2, 7.5) / 2, 0);
      d.rotateX(-Math.atan2(7.5, 3.2));
      d.translate(sx * 2.2, Y - 0.5, z);
      kit.add(d, mSteel);
    }
    kit.add(gBox(4.8, 0.34, 0.34, 0, Y + 2.7, z), mSteel);
  }
  for (let z = -half + 10; z <= half - 10; z += 20) {
    kit.add(gBox(2.0, Y + 0.6, 2.0, 0, -1.2, z), mat('#9c968a', { roughness: 0.95 }));
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'musi-ii' });
  return { group: g, night() {} };
}
