import * as THREE from 'three';
import { mat, lampMat, box, cyl, cone, sphere, limasRoof, tag, PALETTE as P } from '../lib/kit.js';

/**
 * Masjid Agung Sultan Mahmud Badaruddin II.
 * Ciri khas: atap limas bersusun tiga dengan ujung "tanduk" melengkung
 * bergaya Tiongkok, menara silinder bertingkat, dan kubah kecil emas.
 */
export function buildMasjid() {
  const g = new THREE.Group();

  const wall = mat(P.plaster, { roughness: 0.9 });
  const wallTrim = mat('#d3c6ac', { roughness: 0.88 });
  const green = mat(P.mosqueGreen, { roughness: 0.62 });
  const greenDark = mat(P.mosqueGreenDark, { roughness: 0.66 });
  const gold = mat(P.gold, { roughness: 0.34, metalness: 0.6 });
  const stone = mat('#cdc4b2', { roughness: 0.92 });
  const glass = lampMat('#ffe0a8', '#5d7a86');
  const marble = mat('#e8e2d4', { roughness: 0.5 });

  /* ---------- Pelataran ---------- */
  g.add(box(52, 0.7, 44, 0, 0, 0, marble));
  g.add(box(56, 0.4, 48, 0, -0.3, 0, stone));

  /* ---------- Bangunan utama ---------- */
  const BW = 26, BD = 24, BH = 9;
  g.add(box(BW, BH, BD, 0, 0.7, 0, wall));
  // ikat pinggang hias
  g.add(box(BW + 0.6, 0.8, BD + 0.6, 0, 0.7 + BH - 1.6, 0, wallTrim));

  // deretan jendela lengkung
  for (let i = -3; i <= 3; i++) {
    for (const sz of [-1, 1]) {
      g.add(box(2.0, 3.6, 0.3, i * 3.4, 3.2, sz * (BD / 2), glass));
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.32, 12, 1, false, 0, Math.PI), wallTrim);
      arch.rotation.z = -Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.set(i * 3.4, 6.8, sz * (BD / 2));
      g.add(arch);
    }
  }
  for (let i = -3; i <= 3; i++) {
    for (const sx of [-1, 1]) {
      g.add(box(0.3, 3.6, 2.0, sx * (BW / 2), 3.2, i * 3.1, glass));
    }
  }

  /* ---------- Atap limas bersusun ---------- */
  const tiers = [
    { w: 31, d: 29, h: 4.6, y: 9.7, top: 0.62 },
    { w: 21, d: 19.5, h: 4.0, y: 14.3, top: 0.58 },
    { w: 12.5, d: 11.5, h: 3.4, y: 18.3, top: 0.5 },
  ];
  tiers.forEach((t, i) => {
    const roof = limasRoof(t.w, t.d, t.h, t.top, i % 2 === 0 ? green : greenDark);
    roof.position.y = t.y;
    g.add(roof);
    // lis tepi atap
    g.add(box(t.w + 1.1, 0.5, t.d + 1.1, 0, t.y - 0.25, 0, gold));

    // "tanduk" melengkung di empat sudut — khas Palembang
    const hw = t.w / 2 + 0.5, hd = t.d / 2 + 0.5;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const horn = new THREE.Mesh(
          new THREE.TorusGeometry(1.5, 0.22, 6, 10, Math.PI * 0.55),
          gold
        );
        horn.position.set(sx * hw, t.y + 0.1, sz * hd);
        horn.rotation.y = Math.atan2(sz, sx) + Math.PI / 2;
        horn.rotation.z = -Math.PI / 2.6;
        horn.castShadow = true;
        g.add(horn);
      }
    }
  });

  // mahkota atap: kubah kecil + mustaka
  g.add(sphere(2.0, 0, 22.4, 0, gold, 18));
  g.add(cyl(0.22, 0.34, 2.6, 0, 23.6, 0, gold, 8));
  g.add(sphere(0.55, 0, 26.6, 0, gold, 10));
  // bulan sabit
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.17, 6, 14, Math.PI * 1.35), gold);
  crescent.position.set(0, 27.9, 0);
  crescent.rotation.z = Math.PI * 0.32;
  g.add(crescent);

  /* ---------- Menara (gaya Tiongkok bertingkat) ---------- */
  const mx = -17, mz = -14;
  g.add(cyl(3.4, 4.2, 3.0, mx, 0.7, mz, stone, 12));
  g.add(cyl(2.7, 3.1, 15, mx, 3.7, mz, wall, 14));
  // cincin balkon
  for (const y of [9.0, 14.5]) {
    g.add(cyl(3.6, 3.6, 0.5, mx, y, mz, gold, 16));
    g.add(cyl(3.4, 3.4, 1.0, mx, y + 0.5, mz, wallTrim, 16));
  }
  g.add(cyl(2.2, 2.6, 5.0, mx, 18.7, mz, wall, 14));
  // atap bertingkat menara
  g.add(cone(4.2, 2.4, mx, 23.7, mz, greenDark, 12, 0));
  g.add(cyl(1.7, 1.9, 3.2, mx, 26.1, mz, wall, 12));
  g.add(cone(3.2, 2.2, mx, 29.3, mz, green, 12, 0));
  g.add(cyl(0.18, 0.24, 2.6, mx, 31.5, mz, gold, 8));
  g.add(sphere(0.45, mx, 34.3, mz, gold, 10));

  // jendela menara
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    g.add(box(1.0, 2.2, 0.3, mx + Math.cos(a) * 2.75, 11.0, mz + Math.sin(a) * 2.75, glass, -a));
  }

  /* ---------- Gerbang & serambi ---------- */
  const gz = 14.5;
  g.add(box(14, 5.5, 5, 0, 0.7, gz, wall));
  const porchRoof = limasRoof(16, 7, 2.6, 0.45, greenDark);
  porchRoof.position.set(0, 6.2, gz);
  g.add(porchRoof);
  g.add(box(16.6, 0.4, 7.6, 0, 6.0, gz, gold));
  // lengkung pintu masuk
  const doorArch = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.5, 14, 1, false, 0, Math.PI), gold);
  doorArch.rotation.z = -Math.PI / 2;
  doorArch.rotation.y = Math.PI / 2;
  doorArch.position.set(0, 4.5, gz + 2.5);
  g.add(doorArch);
  g.add(box(3.6, 3.8, 0.4, 0, 0.7, gz + 2.5, mat(P.woodDark, { roughness: 0.7 })));

  // tiang serambi
  for (const x of [-6.4, -3.2, 3.2, 6.4]) {
    g.add(cyl(0.5, 0.55, 5.0, x, 0.7, gz + 2.4, stone, 10));
    g.add(cyl(0.72, 0.6, 0.6, x, 5.4, gz + 2.4, gold, 10));
  }

  /* ---------- Pagar & lampu halaman ---------- */
  const rail = mat('#c9bda4', { roughness: 0.9 });
  for (let i = -8; i <= 8; i++) {
    g.add(box(0.5, 1.5, 0.5, i * 3.2, 0.7, -22, rail));
    g.add(box(0.5, 1.5, 0.5, i * 3.2, 0.7, 22, rail));
  }
  const lampPost = mat('#7a7466', { roughness: 0.7 });
  for (const [lx, lz] of [[-22, 18], [22, 18], [-22, -18], [22, -18]]) {
    g.add(cyl(0.22, 0.3, 5.0, lx, 0.7, lz, lampPost, 8));
    g.add(sphere(0.8, lx, 6.4, lz, lampMat('#ffdca8', '#efe7d4'), 12));
  }

  /* ---------- Pohon kurma kecil di pelataran ---------- */
  for (const [tx, tz] of [[-19, 8], [19, 8], [-19, -6], [19, -6]]) {
    g.add(cyl(0.35, 0.5, 6.0, tx, 0.7, tz, mat(P.woodDark), 8));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const frond = box(4.4, 0.22, 0.9, tx + Math.cos(a) * 2.0, 6.4, tz + Math.sin(a) * 2.0, mat(P.foliageDark), a);
      frond.rotation.z = 0.28;
      g.add(frond);
    }
  }

  return tag(g, 'masjid');
}
