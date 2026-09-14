import * as THREE from 'three';
import { mat, lampMat, box, cyl, cone, limasRoof, gableRoof, tag, makeRng, pick, PALETTE as P } from '../lib/kit.js';
import { riverZ, riverHalf, riverAngle } from '../world/river.js';
import { groundHeight } from '../world/terrain.js';

const wood = () => mat(P.wood, { roughness: 0.9 });
const woodDark = () => mat(P.woodDark, { roughness: 0.92 });
const woodLight = () => mat(P.woodLight, { roughness: 0.9 });

/* ================================================================== */
/*  RUMAH LIMAS — rumah adat panggung berlantai bertingkat (kekijing)  */
/* ================================================================== */
export function buildRumahLimas(scale = 1) {
  const g = new THREE.Group();

  const post = woodDark();
  const plank = wood();
  const plankLight = woodLight();
  const roofM = mat(P.roofBrown, { roughness: 0.88 });
  const roofM2 = mat('#59402a', { roughness: 0.88 });
  const trim = mat(P.gold, { roughness: 0.5, metalness: 0.35 });
  const win = lampMat('#ffd9a0', '#4e3826');

  const W = 16, D = 22;
  const STILT = 3.2;

  // tiang panggung
  for (let i = -3; i <= 3; i++) {
    for (let k = -4; k <= 4; k++) {
      if ((i + k) % 2 !== 0) continue;
      g.add(cyl(0.32, 0.38, STILT, i * 2.5, 0, k * 2.5, post, 7));
    }
  }
  // balok lantai
  g.add(box(W + 1, 0.5, D + 1, 0, STILT, 0, post));

  // kekijing: lantai bertingkat, makin ke belakang makin tinggi
  const levels = [
    { z: 8.0, d: 6.0, h: 0.0, wallH: 3.4 },
    { z: 2.6, d: 5.2, h: 0.7, wallH: 3.4 },
    { z: -2.6, d: 5.4, h: 1.4, wallH: 3.6 },
    { z: -8.0, d: 6.0, h: 2.1, wallH: 3.8 },
  ];

  levels.forEach((lv, i) => {
    const fy = STILT + 0.5 + lv.h;
    g.add(box(W, 0.35, lv.d, 0, fy, lv.z, plankLight));
    if (i > 0) {
      // dinding papan
      g.add(box(W, lv.wallH, 0.28, 0, fy + 0.35, lv.z - lv.d / 2, plank));
      g.add(box(0.28, lv.wallH, lv.d, -W / 2, fy + 0.35, lv.z, plank));
      g.add(box(0.28, lv.wallH, lv.d, W / 2, fy + 0.35, lv.z, plank));
      // jendela berukir
      for (const sx of [-1, 1]) {
        g.add(box(0.32, 1.7, 2.0, sx * W / 2, fy + 1.3, lv.z, win));
        g.add(box(0.36, 0.22, 2.4, sx * W / 2, fy + 2.3, lv.z, trim));
      }
    } else {
      // teras depan berpagar ukir
      for (let k = -7; k <= 7; k++) {
        g.add(box(0.24, 1.1, 0.24, k * 1.05, fy + 0.35, lv.z + lv.d / 2 - 0.2, plank));
      }
      g.add(box(W, 0.24, 0.3, 0, fy + 1.45, lv.z + lv.d / 2 - 0.2, trim));
      // tiang teras
      for (const x of [-6, -2, 2, 6]) {
        g.add(cyl(0.28, 0.3, 3.6, x, fy + 0.35, lv.z + lv.d / 2 - 0.6, plank, 8));
      }
    }
  });

  // tangga depan
  const stepM = plank;
  for (let i = 0; i < 5; i++) {
    g.add(box(4.4, 0.24, 0.9, 0, i * 0.78, D / 2 + 1.6 - i * 0.85, stepM));
  }
  for (const sx of [-1, 1]) {
    const rail = box(0.24, 0.24, 5.6, sx * 2.3, 3.6, D / 2 - 0.6, plank);
    rail.rotation.x = -0.62;
    g.add(rail);
  }

  /* ---------- Atap limas bersusun ---------- */
  const roofBase = STILT + 0.5 + 2.1 + 3.8;
  const r1 = limasRoof(W + 4.5, D + 3, 3.4, 0.55, roofM);
  r1.position.set(0, roofBase - 0.6, -1.4);
  g.add(r1);
  g.add(box(W + 5.2, 0.35, D + 3.7, 0, roofBase - 0.85, -1.4, woodDark()));

  const r2 = limasRoof(W - 2.5, D - 7, 3.0, 0.42, roofM2);
  r2.position.set(0, roofBase + 2.8, -1.4);
  g.add(r2);

  // bubungan atap atas
  const ridgeY = roofBase + 2.8 + 3.0;
  const ridgeHalfD = ((D - 7) / 2) * 0.42;
  g.add(box(W - 8, 0.4, ridgeHalfD * 2 + 0.4, 0, ridgeY - 0.2, -1.4, woodDark()));
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.15, 5, 9, Math.PI * 0.6), trim);
      horn.position.set(sx * (W / 2 + 2.0), roofBase - 0.5, -1.4 + sz * (D / 2 + 1.3));
      horn.rotation.y = Math.atan2(sz, sx) + Math.PI / 2;
      horn.rotation.z = -Math.PI / 2.6;
      g.add(horn);
    }
  }
  // ukiran simbar menempel tegak di kedua ujung bubungan
  for (const sz of [-1, 1]) {
    const zz = -1.4 + sz * (ridgeHalfD + 0.15);
    g.add(box(3.6, 1.5, 0.25, 0, ridgeY - 0.2, zz, trim));
    // motif tanduk kecil di atas simbar
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.1, 5, 8, Math.PI * 0.6), trim);
      horn.position.set(sx * 1.5, ridgeY + 1.3, zz);
      horn.rotation.y = Math.PI / 2;
      horn.rotation.z = sx > 0 ? -Math.PI / 2.6 : Math.PI / 2.6;
      g.add(horn);
    }
  }

  g.scale.setScalar(scale);
  return g;
}

/* ================================================================== */
/*  RUMAH RAKIT — hunian terapung di atas rangkaian bambu             */
/* ================================================================== */
export function buildRumahRakit(rng) {
  const g = new THREE.Group();
  const plank = pick(rng, [wood(), woodLight(), mat('#9a7550', { roughness: 0.9 })]);
  const post = woodDark();
  const roofM = pick(rng, [
    mat('#7d6a4e', { roughness: 0.9 }),
    mat('#6d5a42', { roughness: 0.9 }),
    mat('#8a5a45', { roughness: 0.9 }),
  ]);
  const win = lampMat('#ffcf8a', '#4a3826');

  const W = 7.5 + rng() * 2.5;
  const D = 5.5 + rng() * 1.8;

  // rakit bambu
  const nBamboo = 9;
  for (let i = 0; i < nBamboo; i++) {
    const b = cyl(0.36, 0.36, W + 2.2, 0, -0.36, -D / 2 - 0.6 + (i / (nBamboo - 1)) * (D + 1.2), mat('#9d8b5e', { roughness: 0.85 }), 7);
    b.rotation.z = Math.PI / 2;
    b.position.y = -0.15;
    g.add(b);
  }
  // lantai
  g.add(box(W, 0.28, D, 0, 0.2, 0, plank));

  // badan rumah
  const hw = W - 1.6, hd = D - 1.2;
  g.add(box(hw, 2.9, hd, 0, 0.48, -0.2, plank));
  // jendela
  for (const sx of [-1, 1]) {
    g.add(box(0.22, 1.1, 1.5, sx * hw / 2, 1.5, -0.2, win));
  }
  g.add(box(1.3, 1.9, 0.22, -hw / 4, 0.48, hd / 2 - 0.2, mat('#6b4c30')));
  g.add(box(1.4, 1.0, 0.22, hw / 4, 1.7, hd / 2 - 0.2, win));

  // atap pelana seng
  const roof = gableRoof(hw + 1.6, 1.7, hd + 1.4, roofM);
  roof.position.set(-(hw + 1.6) / 2, 3.38, -0.2);
  g.add(roof);

  // teras kecil + pot
  for (let i = 0; i < 4; i++) {
    g.add(box(0.18, 0.8, 0.18, -W / 2 + 0.4 + i * ((W - 0.8) / 3), 0.48, D / 2 - 0.3, post));
  }
  g.add(box(W - 0.6, 0.14, 0.2, 0, 1.28, D / 2 - 0.3, post));
  if (rng() > 0.4) {
    g.add(cyl(0.3, 0.36, 0.5, W / 2 - 1.0, 0.48, D / 2 - 0.9, mat('#a8643f')));
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), mat(P.foliageLight, { flat: true }));
    bush.position.set(W / 2 - 1.0, 1.4, D / 2 - 0.9);
    g.add(bush);
  }

  // tali tambat ke tepian
  g.add(cyl(0.06, 0.06, 3.5, -W / 2 - 1.2, 0.1, 0, mat('#8a7c5e'), 5));

  return g;
}

/* ================================================================== */
/*  PERAHU KETEK — perahu kayu panjang khas Sungai Musi               */
/* ================================================================== */
export function buildKetek(rng) {
  const g = new THREE.Group();
  const hull = pick(rng, [
    mat('#6b4a2e', { roughness: 0.85 }),
    mat('#7d5638', { roughness: 0.85 }),
    mat('#4f6f7a', { roughness: 0.85 }),
    mat('#8a4436', { roughness: 0.85 }),
  ]);
  const deck = mat(P.woodLight, { roughness: 0.9 });
  const canopy = pick(rng, [
    mat('#3f7a5c', { roughness: 0.9 }),
    mat('#b8593f', { roughness: 0.9 }),
    mat('#4a6d92', { roughness: 0.9 }),
    mat('#c9a84a', { roughness: 0.9 }),
  ]);

  const L = 7 + rng() * 4;

  // lambung: kotak meruncing di kedua ujung
  const hw = 0.85;
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2, 0);
  shape.lineTo(-L / 2 + 1.4, hw);
  shape.lineTo(L / 2 - 1.8, hw);
  shape.lineTo(L / 2, 0.15);
  shape.lineTo(L / 2 - 1.8, -hw);
  shape.lineTo(-L / 2 + 1.4, -hw);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.1, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(geo, hull);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);

  // lantai dek
  g.add(box(L - 2.4, 0.12, hw * 1.7, 0, 0.62, 0, deck));

  // atap kanopi
  if (rng() > 0.25) {
    const cl = L * 0.45;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        g.add(cyl(0.07, 0.07, 1.15, sx * cl / 2, 0.7, sz * hw * 0.72, mat('#5a4530'), 5));
      }
    }
    const roof = gableRoof(cl + 0.9, 0.42, hw * 2.1, canopy);
    roof.position.set(-(cl + 0.9) / 2, 1.85, 0);
    g.add(roof);
  }

  // mesin tempel & buritan
  g.add(box(0.7, 0.55, 0.7, -L / 2 + 1.2, 0.66, 0, mat('#3e4246')));
  const shaft = cyl(0.06, 0.06, 1.5, -L / 2 + 0.55, 0.3, 0, mat('#2e3134'), 5);
  shaft.rotation.x = 0.6;
  g.add(shaft);

  // penumpang sederhana
  const nP = Math.floor(rng() * 4);
  for (let i = 0; i < nP; i++) {
    const px = -L / 4 + (i / Math.max(1, nP - 1)) * (L / 2);
    const c = pick(rng, ['#c8553d', '#3d6fc8', '#e0c05a', '#4a8f6a', '#e8e2d4']);
    g.add(cyl(0.19, 0.21, 0.55, px, 0.74, (rng() - 0.5) * 0.6, mat(c), 7));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat('#7a5a42'));
    head.position.set(px, 1.45, 0);
    g.add(head);
  }

  return g;
}

/* ================================================================== */
/*  KAPAL TONGKANG — kapal barang batu bara di Musi                   */
/* ================================================================== */
export function buildTongkang() {
  const g = new THREE.Group();
  const hull = mat('#3d4a52', { roughness: 0.8, metalness: 0.2 });
  const rust = mat('#6d4a38', { roughness: 0.9 });
  const cargo = mat('#2a2724', { roughness: 1 });

  g.add(box(26, 2.2, 8.5, 0, -0.7, 0, hull));
  g.add(box(24, 0.5, 7.5, 0, 1.5, 0, rust));
  // muatan batu bara
  for (let i = 0; i < 4; i++) {
    const h = 1.6 + Math.sin(i) * 0.4;
    g.add(box(4.6, h, 6.2, -8 + i * 5.4, 2.0, 0, cargo));
  }
  // kapal tunda kecil
  g.add(box(6, 2.4, 4.4, 17, -0.6, 0, hull));
  g.add(box(3.2, 2.6, 3.2, 17.6, 1.8, 0, mat('#d8d2c4', { roughness: 0.85 })));
  g.add(box(3.4, 1.0, 3.4, 17.6, 4.4, 0, mat('#b8b2a4')));
  g.add(box(2.8, 1.0, 0.2, 17.6, 2.6, 1.7, lampMat('#cfe4ff', '#5a6a72')));
  g.add(cyl(0.12, 0.14, 3, 17.6, 5.4, 0, mat('#7a7468'), 6));

  return g;
}

/* ================================================================== */
/*  DERMAGA KAYU tepi sungai                                          */
/* ================================================================== */
export function buildDock(x, side = 1) {
  const g = new THREE.Group();
  const cz = riverZ(x);
  const half = riverHalf(x);
  const bank = cz + side * half;
  const plank = mat(P.wood, { roughness: 0.9 });
  const post = mat(P.woodDark, { roughness: 0.92 });

  const len = 12;
  const startZ = bank - side * 2;
  const endZ = bank - side * (2 + len);

  g.add(box(6, 0.4, len, x, 1.4, (startZ + endZ) / 2, plank));
  for (let i = 0; i <= 4; i++) {
    const z = startZ - side * (i / 4) * len;
    for (const sx of [-1, 1]) {
      g.add(cyl(0.25, 0.3, 6.5, x + sx * 2.4, -4.6, z, post, 6));
      g.add(cyl(0.14, 0.14, 1.1, x + sx * 2.6, 1.8, z, post, 5));
    }
  }
  g.add(box(5.6, 0.15, 0.2, x, 2.9, endZ, post));
  return g;
}

export { riverZ, riverHalf, riverAngle, groundHeight, makeRng, tag };
