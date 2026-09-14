import * as THREE from 'three';
import { Kit, GROUND, mat, gBox, gCyl, gOnionDome, gCurvedRoof, group, rand, xform } from '../lib/util.js';
import { litMaterial, nightLight } from './lights.js';

const GOLD = '#d8a83e';
const mGold = mat(GOLD, { roughness: 0.28, metalness: 0.85 });
const mWall = mat('#ece3cf', { roughness: 0.92 });
const mWall2 = mat('#dfd2b6', { roughness: 0.92 });
const mDomeGreen = mat('#20513c', { roughness: 0.55, metalness: 0.1 });
const mTile = mat('#4c5c50', { roughness: 0.8 });
const mTileRed = mat('#8d4433', { roughness: 0.8 });
const mBrick = mat('#a08a6d', { roughness: 0.98 });
const mBrickDark = mat('#8a755c', { roughness: 0.98 });
const mStone = mat('#b4ac99', { roughness: 0.95 });
const mDark = mat('#3a3d40', { roughness: 0.7 });
const mBronze = mat('#8a7446', { roughness: 0.45, metalness: 0.7 });
const mSteel = mat('#c3c8cc', { roughness: 0.22, metalness: 0.85 });
const mGlass = mat('#25343d', { roughness: 0.18, metalness: 0.55 });
const mWater = mat('#3f6a70', { roughness: 0.18, metalness: 0.2 });

const litWindow = litMaterial('#ffe6bb', '#ffb765', 2.4, { roughness: 0.5 });
const litWarm = litMaterial('#ffd9a0', '#ffab4d', 2.0, { roughness: 0.5 });

/* ------------------------- bagian kecil -------------------------- */
/**
 * Bukaan lengkung. axis 'z' = dinding menghadap ±Z (bukaan melebar di X),
 * axis 'x' = dinding menghadap ±X (bukaan melebar di Z).
 */
function arch(kit, w, h, d, x, y, z, material = mDark, axis = 'z') {
  if (axis === 'z') {
    kit.add(gBox(w, h - w / 2, d, x, y, z), material);
    const c = new THREE.CylinderGeometry(w / 2, w / 2, d, 10, 1, false);
    c.rotateX(Math.PI / 2);
    c.translate(x, y + h - w / 2, z);
    kit.add(c, material);
  } else {
    kit.add(gBox(d, h - w / 2, w, x, y, z), material);
    const c = new THREE.CylinderGeometry(w / 2, w / 2, d, 10, 1, false);
    c.rotateZ(Math.PI / 2);
    c.translate(x, y + h - w / 2, z);
    kit.add(c, material);
  }
}

function finial(kit, x, y, z, scale = 1) {
  kit.add(gCyl(0.14 * scale, 0.2 * scale, 1.4 * scale, 8, x, y, z), mGold);
  const s = new THREE.SphereGeometry(0.34 * scale, 12, 10);
  s.translate(x, y + 1.5 * scale, z);
  kit.add(s, mGold);
  const cres = new THREE.TorusGeometry(0.5 * scale, 0.09 * scale, 6, 18, Math.PI * 1.35);
  cres.rotateZ(-Math.PI * 0.18);
  cres.translate(x, y + 2.2 * scale, z);
  kit.add(cres, mGold);
}

/* ================================================================== *
 *  MASJID AGUNG SULTAN MAHMUD BADARUDDIN JAYO WIKRAMO
 * ================================================================== */
export function buildMasjidAgung(parent, x = -34, z = -106) {
  const g = group('masjid-agung', parent, [x, 0, z]);
  const kit = new Kit();

  // pelataran + pagar
  kit.add(gBox(30, 0.5, 34, 0, GROUND, 0), mStone);
  for (const [px, pz, pw, pd] of [[-15, 0, 0.5, 34], [15, 0, 0.5, 34], [0, -17, 30, 0.5], [0, 17, 30, 0.5]]) {
    kit.add(gBox(pw, 1.5, pd, px, GROUND + 0.5, pz), mWall2);
  }
  arch(kit, 3.2, 3.4, 1.2, 0, GROUND + 0.5, 17, mWall2);

  // ruang salat utama
  const HW = 9, HD = 11, H = 6.4;
  kit.add(gBox(HW * 2, H, HD * 2, 0, GROUND + 0.5, 0), mWall);
  kit.add(gBox(HW * 2 + 0.6, 0.5, HD * 2 + 0.6, 0, GROUND + 0.5 + H, 0), mWall2);

  // serambi depan dengan kolom
  kit.add(gBox(HW * 2 + 2, 0.6, 5, 0, GROUND + 0.5, HD + 2.5), mStone);
  for (let i = -3; i <= 3; i++) {
    kit.add(gCyl(0.42, 0.5, 5.2, 10, i * 2.6, GROUND + 1.1, HD + 4.4), mWall);
    kit.add(gBox(1.2, 0.35, 1.2, i * 2.6, GROUND + 6.3, HD + 4.4), mWall2);
  }
  kit.add(gBox(HW * 2 + 2.4, 0.7, 5.6, 0, GROUND + 6.65, HD + 2.5), mWall2);
  const roofFront = gCurvedRoof(11.6, 2.4, 4, 6);
  roofFront.scale(1, 1, 0.52);
  roofFront.translate(0, GROUND + 7.35, HD + 2.5);
  kit.add(roofFront, mTile);

  // jendela lengkung berkeliling
  for (let i = -3; i <= 3; i++) {
    arch(kit, 1.5, 3.4, 0.5, i * 2.5, GROUND + 1.7, HD + 0.02, litWindow);
    arch(kit, 1.5, 3.4, 0.5, i * 2.5, GROUND + 1.7, -HD - 0.02, litWindow);
  }
  for (let i = -4; i <= 4; i++) {
    arch(kit, 1.4, 3.2, 0.5, HW + 0.02, GROUND + 1.8, i * 2.4, litWindow, 'x');
    arch(kit, 1.4, 3.2, 0.5, -HW - 0.02, GROUND + 1.8, i * 2.4, litWindow, 'x');
  }
  // pintu utama
  arch(kit, 3.4, 5.0, 0.6, 0, GROUND + 0.5, HD + 0.05, mat('#6b4a2f', { roughness: 0.8 }));

  // drum kubah + kubah bawang utama
  kit.add(gCyl(7.6, 7.9, 2.2, 24, 0, GROUND + 0.5 + H + 0.5, 0), mWall2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const wg = gBox(1.15, 1.5, 0.4, 0, 0, 0);
    wg.rotateY(Math.PI / 2 - a);
    wg.translate(Math.cos(a) * 7.7, GROUND + H + 0.9, Math.sin(a) * 7.7);
    kit.add(wg, litWindow);
  }
  const dome = gOnionDome(7.3, 8.6, 30);
  dome.translate(0, GROUND + H + 2.7, 0);
  kit.add(dome, mDomeGreen);
  finial(kit, 0, GROUND + H + 11.1, 0, 1.5);

  // empat kubah kecil di sudut
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * (HW - 1.4), pz = sz * (HD - 1.4);
      kit.add(gCyl(2.5, 2.6, 1.0, 14, px, GROUND + 0.5 + H, pz), mWall2);
      const d2 = gOnionDome(2.4, 3.0, 18);
      d2.translate(px, GROUND + H + 1.5, pz);
      kit.add(d2, mDomeGreen);
      finial(kit, px, GROUND + H + 4.4, pz, 0.6);
    }
  }

  // menara baru (1970, ±45 m)
  const mx = HW + 3.6, mz = HD + 3.0;
  kit.add(gCyl(1.5, 1.9, 2.0, 8, mx, GROUND + 0.5, mz), mWall2);
  kit.add(gCyl(1.15, 1.4, 9.4, 8, mx, GROUND + 2.5, mz), mWall);
  kit.add(gCyl(1.7, 1.7, 0.5, 8, mx, GROUND + 8.2, mz), mWall2);      // balkon
  kit.add(gCyl(1.5, 1.5, 0.4, 8, mx, GROUND + 11.4, mz), mWall2);
  const dm = gOnionDome(1.5, 1.9, 14);
  dm.translate(mx, GROUND + 11.8, mz);
  kit.add(dm, mDomeGreen);
  finial(kit, mx, GROUND + 13.6, mz, 0.55);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    arch(kit, 0.6, 1.4, 0.3, mx + Math.cos(a) * 1.16, GROUND + 8.8, mz + Math.sin(a) * 1.16, litWindow);
  }

  // menara lama bergaya pagoda Cina
  const ox = -HW - 4.2, oz = HD + 2.6;
  kit.add(gBox(4.2, 4.0, 4.2, ox, GROUND + 0.5, oz), mWall2);
  for (const [yy, r, hh] of [[4.5, 3.6, 1.9], [6.6, 3.0, 1.7], [8.5, 2.4, 1.5]]) {
    kit.add(gBox(3.4, yy - (yy === 4.5 ? 4.5 : 0), 3.4, ox, GROUND + 0.5, oz), mWall);
    const rf = gCurvedRoof(r, hh, 4, 6);
    rf.rotateY(Math.PI / 4);
    rf.translate(ox, GROUND + yy, oz);
    kit.add(rf, mTile);
  }
  finial(kit, ox, GROUND + 10.0, oz, 0.5);

  kit.build(g, { castShadow: true, receiveShadow: true, name: 'masjid-agung-body' });

  const lamp = nightLight('#ffd7a0', 60, 70, 2);
  lamp.position.set(0, GROUND + 12, 0);
  g.add(lamp);

  return { group: g, labelAt: [x, GROUND + 24, z] };
}

/* ================================================================== *
 *  BENTENG KUTO BESAK  (288,75 m × 183,75 m; dinding 9,99 m, tebal 1,99 m)
 * ================================================================== */
export function buildKutoBesak(parent, x = -100, z = -108) {
  const g = group('benteng-kuto-besak', parent);
  const kit = new Kit();
  const W = 72, D = 46, H = 2.6, T = 0.55;
  const cx = x, cz = z;

  // dinding keliling
  kit.add(gBox(W, H, T, cx, GROUND, cz - D / 2), mBrick);
  kit.add(gBox(W, H, T, cx, GROUND, cz + D / 2), mBrick);
  kit.add(gBox(T, H, D, cx - W / 2, GROUND, cz), mBrick);
  kit.add(gBox(T, H, D, cx + W / 2, GROUND, cz), mBrick);
  // mahkota dinding (crenellation)
  for (let i = -W / 2 + 1.2; i <= W / 2 - 1.2; i += 2.4) {
    kit.add(gBox(1.2, 0.5, T + 0.1, cx + i, GROUND + H, cz - D / 2), mBrickDark);
    kit.add(gBox(1.2, 0.5, T + 0.1, cx + i, GROUND + H, cz + D / 2), mBrickDark);
  }
  for (let i = -D / 2 + 1.2; i <= D / 2 - 1.2; i += 2.4) {
    kit.add(gBox(T + 0.1, 0.5, 1.2, cx - W / 2, GROUND + H, cz + i), mBrickDark);
    kit.add(gBox(T + 0.1, 0.5, 1.2, cx + W / 2, GROUND + H, cz + i), mBrickDark);
  }
  // bastion sudut
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const b = new THREE.CylinderGeometry(4.4, 5.0, H + 0.8, 8);
      b.rotateY(Math.PI / 8);
      b.translate(cx + sx * W / 2, GROUND + (H + 0.8) / 2, cz + sz * D / 2);
      kit.add(b, mBrick);
      kit.add(gCyl(4.6, 4.6, 0.4, 8, cx + sx * W / 2, GROUND + H + 0.8, cz + sz * D / 2), mBrickDark);
    }
  }

  // gerbang utama menghadap Sungai Musi (sisi selatan)
  const gz = cz + D / 2;
  kit.add(gBox(9, H + 2.6, 2.4, cx, GROUND, gz), mBrickDark);
  arch(kit, 4.0, 4.4, 2.6, cx, GROUND, gz + 0.1, mDark);
  kit.add(gBox(10.4, 0.7, 3.2, cx, GROUND + H + 2.4, gz), mBrick);
  kit.add(gBox(3.0, 1.6, 1.0, cx, GROUND + H + 3.1, gz), mWall2);   // jam/plakat
  // gerbang samping (Lawang Borotan) menghadap timur & barat
  arch(kit, 3.0, 3.4, 0.9, cx - W / 2, GROUND, cz, mDark, 'x');
  arch(kit, 3.0, 3.4, 0.9, cx + W / 2, GROUND, cz, mDark, 'x');

  // halaman dalam: rumput, kolam, bangunan keraton
  kit.add(gBox(W - 3, 0.16, D - 3, cx, GROUND + 0.05, cz), mat('#6f8a4c', { roughness: 1 }));
  kit.add(gCyl(6.5, 6.5, 0.7, 24, cx, GROUND + 0.1, cz - 2), mStone);
  kit.add(gCyl(5.8, 5.8, 0.6, 24, cx, GROUND + 0.2, cz - 2), mWater);
  // balai agung
  kit.add(gBox(20, 4.2, 11, cx, GROUND + 0.2, cz + 8), mWall);
  const rf = gCurvedRoof(14.5, 3.4, 4, 6);
  rf.scale(1, 1, 0.42);
  rf.rotateY(Math.PI / 4);
  rf.translate(cx, GROUND + 4.4, cz + 8);
  kit.add(rf, mTile);
  for (let i = -3; i <= 3; i++) kit.add(gCyl(0.35, 0.4, 3.0, 8, cx + i * 2.6, GROUND + 0.2, cz + 13.2), mWall2);
  // bangunan lain di dalam benteng
  for (const [bx, bz, bw, bd, bh] of [[-22, -12, 14, 9, 3.4], [-22, 6, 12, 8, 3.0], [22, -12, 14, 9, 3.4], [22, 6, 12, 8, 3.0]]) {
    kit.add(gBox(bw, bh, bd, cx + bx, GROUND + 0.2, cz + bz), mWall2);
    const r = gCurvedRoof(bw * 0.62, 2.2, 4, 5);
    r.scale(1, 1, bd / bw);
    r.rotateY(Math.PI / 4);
    r.translate(cx + bx, GROUND + 0.2 + bh, cz + bz);
    kit.add(r, mTileRed);
  }

  kit.build(g, { castShadow: true, receiveShadow: true, name: 'kuto-besak' });

  // pelataran BKB di depan gerbang + tugu belido ditambahkan terpisah
  const lamp = nightLight('#ffd0a0', 45, 60, 2);
  lamp.position.set(cx, GROUND + 7, gz + 8);
  g.add(lamp);

  return { group: g, labelAt: [cx, GROUND + 9, cz] };
}

/* ================================================================== *
 *  MONPERA — Monumen Perjuangan Rakyat
 * ================================================================== */
export function buildMonpera(parent, x = 22, z = -78) {
  const g = group('monpera', parent, [x, 0, z]);
  const kit = new Kit();
  kit.add(gCyl(7.5, 8.0, 0.5, 24, 0, GROUND, 0), mStone);
  kit.add(gBox(9, 0.6, 9, 0, GROUND + 0.5, 0), mStone);
  kit.add(gBox(7, 0.7, 7, 0, GROUND + 1.1, 0), mWall2);
  kit.add(gBox(5, 0.8, 5, 0, GROUND + 1.8, 0), mWall);
  // pilar utama
  const p = gBox(2.6, 5.2, 2.6, 0, GROUND + 2.6, 0);
  kit.add(p, mWall);
  kit.add(gBox(3.2, 0.4, 3.2, 0, GROUND + 7.8, 0), mStone);
  // relief
  kit.add(gBox(2.9, 3.2, 0.25, 0, GROUND + 3.4, 1.35), mBronze);
  kit.add(gBox(2.9, 3.2, 0.25, 0, GROUND + 3.4, -1.35), mBronze);
  // patung pejuang
  kit.add(gCyl(0.5, 0.7, 1.6, 10, 0, GROUND + 8.2, 0), mBronze);
  const head = new THREE.SphereGeometry(0.42, 10, 8);
  head.translate(0, GROUND + 10.1, 0);
  kit.add(head, mBronze);
  const arm = gBox(0.24, 1.6, 0.24, 0.4, GROUND + 9.4, 0);
  arm.rotateZ(-0.5);
  arm.translate(0, 0, 0);
  kit.add(arm, mBronze);
  // tiang bendera
  kit.add(gCyl(0.1, 0.14, 6.5, 6, 5.5, GROUND, 5.5), mSteel);
  kit.add(gBox(1.8, 1.1, 0.05, 6.4, GROUND + 5.4, 5.5), mat('#c0392b', { roughness: 0.8 }));
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'monpera' });
  const lamp = nightLight('#ffe0b0', 30, 44, 2);
  lamp.position.set(0, GROUND + 9, 0);
  g.add(lamp);
  return { group: g, labelAt: [x, GROUND + 14, z] };
}

/* ================================================================== *
 *  TUGU IKAN BELIDO — pelataran Benteng Kuto Besak
 * ================================================================== */
export function buildTuguBelido(parent, x = -100, z = -66) {
  const g = group('tugu-belido', parent, [x, 0, z]);
  const kit = new Kit();
  // kolam
  kit.add(gCyl(9.5, 10, 0.9, 32, 0, GROUND, 0), mStone);
  kit.add(gCyl(8.6, 8.6, 0.8, 32, 0, GROUND + 0.1, 0), mWater);
  // badan ikan: rangkaian bola yang mengecil mengikuti busur
  const N = 26;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.5, GROUND + 1.4, 0),
    new THREE.Vector3(-4.5, GROUND + 6.5, 0),
    new THREE.Vector3(0.5, GROUND + 9.2, 0),
    new THREE.Vector3(5.2, GROUND + 7.0, 0),
    new THREE.Vector3(7.8, GROUND + 3.2, 0),
  ]);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    const r = 1.55 * Math.sin(Math.pow(t, 0.62) * Math.PI * 0.92) + 0.28;
    const s = new THREE.SphereGeometry(r, 12, 10);
    s.scale(1, 0.72, 1);
    s.translate(p.x, p.y, p.z);
    kit.add(s, mSteel);
  }
  // kepala & mulut
  const hp = curve.getPoint(0);
  const head = new THREE.SphereGeometry(1.5, 14, 12);
  head.scale(1.25, 0.8, 1);
  head.translate(hp.x - 1.0, hp.y - 0.2, 0);
  kit.add(head, mSteel);
  kit.add(gBox(1.6, 0.22, 1.0, hp.x - 2.2, hp.y - 0.7, 0), mSteel);
  // ekor
  const tp = curve.getPoint(1);
  const tail = new THREE.ConeGeometry(2.4, 3.4, 4, 1);
  tail.scale(1, 1, 0.28);
  tail.rotateZ(-2.4);
  tail.translate(tp.x + 1.9, tp.y + 1.0, 0);
  kit.add(tail, mSteel);
  // sirip punggung
  const fin = new THREE.ConeGeometry(1.2, 2.2, 3, 1);
  fin.scale(1, 1, 0.25);
  fin.rotateZ(0.2);
  fin.translate(0.6, GROUND + 10.4, 0);
  kit.add(fin, mSteel);
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'tugu-belido' });

  const lamp = nightLight('#9fd8ff', 26, 40, 2);
  lamp.position.set(0, GROUND + 4, 0);
  g.add(lamp);
  return { group: g, labelAt: [x, GROUND + 13, z] };
}

/* ================================================================== *
 *  PASAR 16 ILIR & MENARA AIR
 * ================================================================== */
export function buildPasar16(parent, x = 62, z = -100) {
  const g = group('pasar-16-ilir', parent, [x, 0, z]);
  const kit = new Kit();
  const mBody = mat('#d8c8a6', { roughness: 0.9 });
  const mAccent = mat('#b8633a', { roughness: 0.85 });
  // bangunan bertingkat terasering
  kit.add(gBox(30, 6, 20, 0, GROUND, 0), mBody);
  kit.add(gBox(24, 5, 15, -2, GROUND + 6, -1), mBody);
  kit.add(gBox(16, 4.4, 11, -4, GROUND + 11, -2), mBody);
  kit.add(gBox(31, 0.7, 21, 0, GROUND + 6, 0), mAccent);
  kit.add(gBox(25, 0.7, 16, -2, GROUND + 11, -1), mAccent);
  kit.add(gBox(17, 0.7, 12, -4, GROUND + 15.4, -2), mAccent);
  // deretan kios + kanopi
  for (let i = -5; i <= 5; i++) {
    kit.add(gBox(2.2, 2.2, 2.2, i * 2.6, GROUND, 11), mBody);
    kit.add(gBox(2.6, 0.14, 2.8, i * 2.6, GROUND + 2.2, 11.4), mAccent);
    kit.add(gBox(1.4, 1.4, 0.2, i * 2.6, GROUND + 0.6, 12.15), litWindow);
  }
  // jendela
  for (let fl = 0; fl < 3; fl++) {
    for (let i = -6; i <= 6; i++) {
      kit.add(gBox(1.5, 1.5, 0.2, i * 2.2, GROUND + 1.4 + fl * 5.2, 10.15), litWindow);
    }
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'pasar-16' });
  return { group: g, labelAt: [x, GROUND + 20, z] };
}

export function buildMenaraAir(parent, x = 98, z = -96) {
  const g = group('menara-air', parent, [x, 0, z]);
  const kit = new Kit();
  kit.add(gCyl(2.4, 2.9, 8.0, 14, 0, GROUND, 0), mBrick);
  kit.add(gCyl(3.4, 3.0, 2.6, 14, 0, GROUND + 8.0, 0), mWall2);
  kit.add(gCyl(3.5, 3.5, 0.4, 14, 0, GROUND + 10.6, 0), mStone);
  const cap = new THREE.ConeGeometry(3.9, 2.2, 14);
  cap.translate(0, GROUND + 12.1, 0);
  kit.add(cap, mTile);
  kit.add(gCyl(0.12, 0.12, 1.6, 6, 0, GROUND + 14.3, 0), mSteel);
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'menara-air' });
  return { group: g, labelAt: [x, GROUND + 17, z] };
}

/* ================================================================== *
 *  PALEMBANG ICON — pusat perbelanjaan & menara modern
 * ================================================================== */
export function buildPalembangIcon(parent, x = 186, z = -124) {
  const g = group('palembang-icon', parent, [x, 0, z]);
  const kit = new Kit();
  const mPodium = mat('#cfc9bd', { roughness: 0.75 });
  const mTower = mat('#8f9aa3', { roughness: 0.3, metalness: 0.5 });
  kit.add(gBox(34, 8, 26, 0, GROUND, 0), mPodium);
  kit.add(gBox(35, 0.8, 27, 0, GROUND + 8, 0), mat('#7d858c', { roughness: 0.6 }));
  kit.add(gBox(26, 6, 20, 0, GROUND + 8.8, 0), mPodium);
  // kaca keliling mal
  for (let i = -7; i <= 7; i++) {
    kit.add(gBox(2.6, 5.6, 0.2, i * 2.35, GROUND + 1.2, 13.05), mGlass);
    kit.add(gBox(2.6, 5.6, 0.2, i * 2.35, GROUND + 1.2, -13.05), mGlass);
  }
  for (let i = -5; i <= 5; i++) {
    kit.add(gBox(0.2, 5.6, 2.6, 17.05, GROUND + 1.2, i * 2.4), mGlass);
    kit.add(gBox(0.2, 5.6, 2.6, -17.05, GROUND + 1.2, i * 2.4), mGlass);
  }
  // menara hotel
  kit.add(gBox(13, 30, 12, -8, GROUND + 14.8, -3), mTower);
  kit.add(gBox(13.6, 0.8, 12.6, -8, GROUND + 44.8, -3), mat('#6f777e', { roughness: 0.5 }));
  for (let fl = 0; fl < 11; fl++) {
    kit.add(gBox(13.2, 0.5, 12.2, -8, GROUND + 16.6 + fl * 2.7, -3), mat('#5d666d', { roughness: 0.5 }));
    for (let i = -2; i <= 2; i++) {
      kit.add(gBox(2.0, 1.5, 0.18, -8 + i * 2.5, GROUND + 17.4 + fl * 2.7, 3.05), litWindow);
      kit.add(gBox(2.0, 1.5, 0.18, -8 + i * 2.5, GROUND + 17.4 + fl * 2.7, -9.05), litWindow);
    }
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'palembang-icon' });
  const lamp = nightLight('#bcd8ff', 30, 60, 2);
  lamp.position.set(-8, GROUND + 40, -3);
  g.add(lamp);
  return { group: g, labelAt: [x - 8, GROUND + 50, z - 3] };
}

/* ================================================================== *
 *  TAMAN KAMBANG IWAK
 * ================================================================== */
export function buildKambangIwak(parent, x = 150, z = -196) {
  const g = group('kambang-iwak', parent, [x, 0, z]);
  const kit = new Kit();
  // air mancur tengah danau
  kit.add(gCyl(4.2, 4.6, 0.9, 20, 0, GROUND + 0.2, 0), mStone);
  kit.add(gCyl(1.0, 1.4, 2.4, 14, 0, GROUND + 1.1, 0), mStone);
  kit.add(gCyl(2.2, 1.2, 0.5, 16, 0, GROUND + 3.5, 0), mStone);
  kit.add(gCyl(0.5, 0.5, 1.2, 8, 0, GROUND + 4.0, 0), mSteel);
  // jalan lingkar
  const ring = new THREE.RingGeometry(20, 23, 40);
  ring.rotateX(-Math.PI / 2);
  ring.translate(0, GROUND + 0.2, 0);
  kit.add(ring, mat('#a8a294', { roughness: 0.95, side: THREE.DoubleSide }));
  // rumah kolonial di sekeliling taman
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.85 + (i / 6) * Math.PI * 1.7;
    const rx = Math.cos(a) * 44, rz = Math.sin(a) * 34;
    kit.add(gBox(11, 4.4, 8, rx, GROUND + 0.2, rz), mWall);
    const rf = gCurvedRoof(8.6, 2.4, 4, 5);
    rf.scale(1, 1, 0.68);
    rf.rotateY(Math.PI / 4 + a * 0.2);
    rf.translate(rx, GROUND + 4.6, rz);
    kit.add(rf, mTileRed);
    for (let k = -2; k <= 2; k++) kit.add(gBox(1.3, 1.6, 0.2, rx + k * 2.1, GROUND + 1.4, rz + 4.05), litWindow);
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'kambang-iwak' });
  return { group: g, labelAt: [x, GROUND + 10, z] };
}

/* ================================================================== *
 *  MASJID KI MAROGAN & MASJID CHENG HO
 * ================================================================== */
export function buildMasjidKiMarogan(parent, x = -172, z = 84) {
  const g = group('masjid-ki-marogan', parent, [x, 0, z]);
  const kit = new Kit();
  kit.add(gBox(20, 0.6, 18, 0, GROUND, 0), mStone);
  kit.add(gBox(14, 5.4, 12, 0, GROUND + 0.6, 0), mat('#e8e0cd', { roughness: 0.9 }));
  for (let i = -2; i <= 2; i++) {
    arch(kit, 1.4, 2.8, 0.4, i * 2.6, GROUND + 1.4, 6.05, litWindow);
    arch(kit, 1.4, 2.8, 0.4, i * 2.6, GROUND + 1.4, -6.05, litWindow);
  }
  kit.add(gCyl(5.4, 5.6, 1.6, 18, 0, GROUND + 6.0, 0), mat('#ddd4c0', { roughness: 0.9 }));
  const d = gOnionDome(5.2, 5.6, 22);
  d.translate(0, GROUND + 7.6, 0);
  kit.add(d, mat('#2b6a4a', { roughness: 0.5 }));
  finial(kit, 0, GROUND + 13.0, 0, 1.0);
  for (const sx of [-1, 1]) {
    kit.add(gCyl(1.0, 1.2, 7.0, 10, sx * 8.4, GROUND + 0.6, 5.0), mat('#e8e0cd', { roughness: 0.9 }));
    const dm = gOnionDome(1.2, 1.5, 12);
    dm.translate(sx * 8.4, GROUND + 7.6, 5.0);
    kit.add(dm, mat('#2b6a4a', { roughness: 0.5 }));
    finial(kit, sx * 8.4, GROUND + 9.0, 5.0, 0.4);
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'masjid-ki-marogan' });
  return { group: g, labelAt: [x, GROUND + 16, z] };
}

export function buildMasjidChengHo(parent, x = 300, z = 130) {
  const g = group('masjid-cheng-ho', parent, [x, 0, z]);
  const kit = new Kit();
  const mRed = mat('#a32b23', { roughness: 0.75 });
  kit.add(gBox(16, 0.6, 14, 0, GROUND, 0), mStone);
  kit.add(gBox(11, 5.0, 9, 0, GROUND + 0.6, 0), mRed);
  let y = GROUND + 5.6;
  for (const [r, h, w, d] of [[8.4, 2.6, 12, 10], [6.6, 2.4, 9, 7.5], [4.6, 2.2, 6.5, 5.5]]) {
    kit.add(gBox(w, 1.5, d, 0, y, 0), mRed);
    const rf = gCurvedRoof(r, h, 4, 6);
    rf.scale(1, 1, d / w);
    rf.rotateY(Math.PI / 4);
    rf.translate(0, y + 1.5, 0);
    kit.add(rf, mTile);
    y += 1.5 + h * 0.62;
  }
  finial(kit, 0, y + 0.4, 0, 0.7);
  for (const sx of [-1, 1]) {
    kit.add(gCyl(0.9, 1.1, 8.0, 8, sx * 7.0, GROUND + 0.6, 4.5), mRed);
    const rf = gCurvedRoof(2.6, 1.4, 4, 5);
    rf.rotateY(Math.PI / 4);
    rf.translate(sx * 7.0, GROUND + 8.6, 4.5);
    kit.add(rf, mTile);
  }
  for (let i = -1; i <= 1; i++) arch(kit, 1.6, 3.0, 0.4, i * 3.0, GROUND + 1.2, 4.55, litWindow);
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'masjid-cheng-ho' });
  return { group: g, labelAt: [x, GROUND + 15, z] };
}
