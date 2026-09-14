import * as THREE from 'three';
import { mat, lampMat, box, cyl, cone, limasRoof, tag, PALETTE as P } from '../lib/kit.js';

/**
 * Benteng Kuto Besak — benteng persegi panjang dengan empat bastion sudut,
 * gerbang utama menghadap Sungai Musi, dan pelataran alun-alun di dalamnya.
 */
export function buildBenteng() {
  const g = new THREE.Group();

  const brick = mat(P.brick, { roughness: 0.95 });
  const brickDark = mat(P.brickDark, { roughness: 0.96 });
  const capstone = mat('#c2b49a', { roughness: 0.9 });
  const yard = mat('#b4aa92', { roughness: 0.96 });
  const roofTile = mat(P.roofRed, { roughness: 0.85 });
  const wood = mat(P.woodDark, { roughness: 0.8 });
  const iron = mat('#3a3d40', { roughness: 0.5, metalness: 0.55 });

  const W = 58;   // bentang timur–barat (skala miniatur)
  const D = 38;   // bentang utara–selatan
  const H = 7.2;  // tinggi dinding
  const T = 2.4;  // tebal dinding

  /* ---------- Pelataran dalam ---------- */
  g.add(box(W - T, 0.5, D - T, 0, 0, 0, yard));

  /* ---------- Empat sisi dinding ---------- */
  const walls = [
    [W, T, 0, -D / 2 + T / 2],
    [W, T, 0, D / 2 - T / 2],
    [T, D - T * 2, -W / 2 + T / 2, 0],
    [T, D - T * 2, W / 2 - T / 2, 0],
  ];
  for (const [w, d, x, z] of walls) {
    g.add(box(w, H, d, x, 0, z, brick));
    // batu penutup atas
    g.add(box(w + 0.5, 0.7, d + 0.5, x, H, z, capstone));
    // jalur ronda di dalam
  }

  /* ---------- Benteng bergigi (crenellation) ---------- */
  const merlon = (x, z, w, d) => g.add(box(w, 1.5, d, x, H + 0.7, z, brickDark));
  for (let x = -W / 2 + 2; x <= W / 2 - 2; x += 4.2) {
    merlon(x, -D / 2 + T / 2, 2.2, T + 0.4);
    merlon(x, D / 2 - T / 2, 2.2, T + 0.4);
  }
  for (let z = -D / 2 + 4; z <= D / 2 - 4; z += 4.0) {
    merlon(-W / 2 + T / 2, z, T + 0.4, 2.2);
    merlon(W / 2 - T / 2, z, T + 0.4, 2.2);
  }

  /* ---------- Empat bastion sudut ---------- */
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bx = sx * (W / 2 - 1);
      const bz = sz * (D / 2 - 1);
      const b = new THREE.Group();

      // badan bastion berbentuk segi lima (silinder 5 sisi)
      b.add(cyl(6.2, 7.0, H + 1.2, bx, 0, bz, brick, 5));
      b.add(cyl(7.0, 7.0, 0.7, bx, H + 1.2, bz, capstone, 5));
      // gigi bastion
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.6;
        b.add(box(2.4, 1.4, 1.6, bx + Math.cos(a) * 5.6, H + 1.9, bz + Math.sin(a) * 5.6, brickDark, -a));
      }
      // meriam menghadap keluar
      const ang = Math.atan2(sz, sx);
      const cx = bx + Math.cos(ang) * 3.2;
      const cz2 = bz + Math.sin(ang) * 3.2;
      const barrel = cyl(0.32, 0.45, 3.6, cx, H + 2.2, cz2, iron, 10);
      barrel.rotation.z = Math.PI / 2;
      barrel.rotation.y = -ang;
      barrel.position.set(cx, H + 2.6, cz2);
      b.add(barrel);
      // roda meriam
      for (const s of [-1, 1]) {
        const wheel = cyl(0.7, 0.7, 0.28, 0, 0, 0, wood, 10);
        wheel.rotation.x = Math.PI / 2;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
          cx - Math.cos(ang) * 1.2 - Math.sin(ang) * s * 0.8,
          H + 2.0,
          cz2 - Math.sin(ang) * 1.2 + Math.cos(ang) * s * 0.8
        );
        b.add(wheel);
      }
      g.add(b);
    }
  }

  /* ---------- Gerbang utama menghadap sungai (sisi +Z) ---------- */
  const gz = D / 2 - T / 2;
  g.add(box(13, H + 4.5, T + 2.2, 0, 0, gz, brickDark));
  // lubang gerbang melengkung
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, T + 2.6, 16, 1, false, 0, Math.PI), capstone);
  arch.rotation.z = -Math.PI / 2;
  arch.position.set(0, 5.0, gz);
  g.add(arch);
  g.add(box(5.2, 5.0, 0.35, 0, 0, gz + T / 2 + 1.0, wood));
  // atap limas kecil di atas gerbang
  const gRoof = limasRoof(15, T + 4.5, 3.2, 0.4, roofTile);
  gRoof.position.set(0, H + 4.5, gz);
  g.add(gRoof);
  g.add(box(15.6, 0.4, T + 5.1, 0, H + 4.3, gz, capstone));
  // tiang bendera
  g.add(cyl(0.14, 0.18, 6.0, -5, H + 7.7, gz, mat('#8e8878'), 6));
  const flag = box(3.0, 1.9, 0.1, -3.4, H + 11.4, gz, mat('#d7382c'));
  g.add(flag);
  g.add(box(3.0, 1.9, 0.11, -3.4, H + 9.5, gz, mat('#f2ede1')));

  /* ---------- Gerbang samping ---------- */
  for (const sx of [-1, 1]) {
    g.add(box(T + 1.6, H + 2.0, 8, sx * (W / 2 - T / 2), 0, 0, brickDark));
    const a2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, T + 2.0, 14, 1, false, 0, Math.PI), capstone);
    a2.rotation.z = -Math.PI / 2;
    a2.rotation.y = Math.PI / 2;
    a2.position.set(sx * (W / 2 - T / 2), 4.0, 0);
    g.add(a2);
  }

  /* ---------- Bangunan dalam: bekas keraton ---------- */
  g.add(box(20, 5.0, 11, -6, 0.5, -6, mat('#ddd2ba', { roughness: 0.9 })));
  const kRoof = limasRoof(22.5, 13.5, 4.0, 0.35, roofTile);
  kRoof.position.set(-6, 5.5, -6);
  g.add(kRoof);
  for (let i = -3; i <= 3; i++) {
    g.add(box(1.2, 2.4, 0.25, -6 + i * 2.6, 2.2, -0.5, lampMat('#ffd9a0', '#6a7a80')));
  }
  // tiang beranda
  for (let i = -4; i <= 4; i += 2) {
    g.add(cyl(0.3, 0.34, 4.4, -6 + i * 2.4, 0.5, 0.4, wood, 8));
  }

  /* ---------- Plaza tepi sungai (BKB modern) ---------- */
  const plaza = box(50, 0.45, 13, 0, -0.2, D / 2 + 8.5, mat('#bfb49b', { roughness: 0.95 }));
  g.add(plaza);
  // pagar besi tepi plaza
  for (let x = -23; x <= 23; x += 3) {
    g.add(box(0.18, 1.2, 0.18, x, 0.25, D / 2 + 14.6, iron));
  }
  g.add(box(46, 0.2, 0.25, 0, 1.4, D / 2 + 14.6, iron));
  // lampu taman
  for (const x of [-18, -6, 6, 18]) {
    g.add(cyl(0.18, 0.24, 4.2, x, 0.25, D / 2 + 13, mat('#5f6468'), 8));
    g.add(box(0.9, 0.5, 0.9, x, 4.45, D / 2 + 13, lampMat('#ffe3b0', '#e2dbcb')));
  }
  // tulisan monumen "BKB" disederhanakan jadi blok huruf
  for (let i = 0; i < 3; i++) {
    g.add(box(2.4, 2.8, 0.7, -20 + i * 3.4, 0.25, D / 2 + 5, mat('#f0ebdd', { roughness: 0.75 })));
  }

  /* ---------- Pohon di pelataran ---------- */
  for (const [tx, tz] of [[18, -8], [20, 6], [-22, 8], [24, -2]]) {
    g.add(cyl(0.5, 0.7, 3.4, tx, 0.5, tz, wood, 8));
    const crown = cone(3.0, 4.6, tx, 3.6, tz, mat(P.foliageDark), 7, 0.4);
    g.add(crown);
  }

  return tag(g, 'benteng');
}
