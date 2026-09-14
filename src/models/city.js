import * as THREE from 'three';
import { mat, lampMat, box, cyl, cone, gableRoof, limasRoof, tag, pick, PALETTE as P } from '../lib/kit.js';

/* ================================================================== */
/*  AL-QUR'AN AL-AKBAR — museum mushaf raksasa berukir kayu tembesu   */
/* ================================================================== */
export function buildAlQuran() {
  const g = new THREE.Group();

  const wall = mat('#e4d9bf', { roughness: 0.9 });
  const trim = mat(P.gold, { roughness: 0.38, metalness: 0.55 });
  const roofM = mat('#2f6f5e', { roughness: 0.7 });
  const roofDark = mat('#255a4c', { roughness: 0.72 });
  const woodPage = mat('#8a6a3f', { roughness: 0.75 });
  const woodEdge = mat('#6b4f2c', { roughness: 0.8 });
  const glass = lampMat('#ffdca8', '#5a6a6e');
  const stone = mat('#c4bba6', { roughness: 0.94 });

  // pelataran
  g.add(box(38, 0.6, 30, 0, 0, 0, stone));

  // bangunan museum 3 lantai terbuka
  g.add(box(24, 12.5, 17, 0, 0.6, 0, wall));
  for (const y of [4.6, 8.6]) {
    g.add(box(25, 0.6, 18, 0, y, 0, trim));
  }
  // barisan kolom
  for (let i = -4; i <= 4; i++) {
    for (const sz of [-1, 1]) {
      g.add(cyl(0.44, 0.48, 12.5, i * 2.7, 0.6, sz * 8.6, wall, 10));
    }
  }
  // lengkung khas
  for (let i = -4; i < 4; i++) {
    for (const sz of [-1, 1]) {
      const a = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.5, 12, 1, false, 0, Math.PI), trim);
      a.rotation.z = -Math.PI / 2;
      a.rotation.y = Math.PI / 2;
      a.position.set(i * 2.7 + 1.35, 11.4, sz * 8.6);
      g.add(a);
    }
  }

  // lembaran mushaf raksasa berdiri di dalam
  for (let i = 0; i < 7; i++) {
    const px = -7.2 + i * 2.4;
    const lean = (i - 3) * 0.035;
    const page = box(0.32, 9.0, 12.0, px, 1.0, 0, i % 2 ? woodPage : woodEdge);
    page.rotation.z = lean;
    g.add(page);
    // bingkai ukir emas
    const frame = box(0.42, 0.5, 12.4, px, 9.8, 0, trim);
    frame.rotation.z = lean;
    g.add(frame);
    const frame2 = box(0.42, 0.5, 12.4, px, 1.0, 0, trim);
    frame2.rotation.z = lean;
    g.add(frame2);
    // kaligrafi disederhanakan: pita emas horizontal
    for (let k = 0; k < 5; k++) {
      const cal = box(0.36, 0.22, 9.6, px, 2.6 + k * 1.5, 0, trim);
      cal.rotation.z = lean;
      g.add(cal);
    }
  }

  // atap limas hijau bersusun
  const r1 = limasRoof(28, 21, 4.2, 0.6, roofM);
  r1.position.y = 13.1;
  g.add(r1);
  g.add(box(29, 0.5, 22, 0, 12.9, 0, trim));
  const r2 = limasRoof(15, 11, 3.4, 0.45, roofDark);
  r2.position.y = 17.3;
  g.add(r2);
  g.add(cyl(0.24, 0.32, 2.4, 0, 20.7, 0, trim, 8));
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.15, 6, 14, Math.PI * 1.35), trim);
  crescent.position.set(0, 24.0, 0);
  crescent.rotation.z = Math.PI * 0.3;
  g.add(crescent);

  // sudut atap melengkung
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.2, 5, 9, Math.PI * 0.55), trim);
      h.position.set(sx * 14.5, 13.2, sz * 11);
      h.rotation.y = Math.atan2(sz, sx) + Math.PI / 2;
      h.rotation.z = -Math.PI / 2.6;
      g.add(h);
    }
  }

  // gapura masuk
  for (const sx of [-1, 1]) {
    g.add(cyl(0.7, 0.8, 6.5, sx * 5, 0.6, 14, wall, 10));
    g.add(cone(1.3, 1.6, sx * 5, 7.1, 14, trim, 8, 0));
  }
  g.add(box(11.6, 1.3, 1.6, 0, 6.5, 14, wall));
  g.add(box(6.5, 1.0, 0.3, 0, 5.2, 14.9, trim));

  // pohon & lampu
  for (const [x, z] of [[-15, 11], [15, 11], [-15, -11], [15, -11]]) {
    g.add(cyl(0.16, 0.22, 4.0, x, 0.6, z, mat('#6f6a5f'), 8));
    g.add(box(0.9, 0.5, 0.9, x, 4.6, z, lampMat('#ffe0aa', '#e2dbcb')));
  }
  for (const [x, z] of [[-17, 3], [17, 3], [0, -13]]) {
    g.add(cyl(0.4, 0.6, 3.0, x, 0.6, z, mat(P.woodDark), 8));
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2.9, 0), mat(P.foliage, { flat: true }));
    c.position.set(x, 6.0, z);
    c.castShadow = true;
    g.add(c);
  }

  return tag(g, 'alquran');
}

/* ================================================================== */
/*  PUSAT KOTA — gedung-gedung modern Seberang Ilir                   */
/* ================================================================== */
export function buildDowntown(rng) {
  const g = new THREE.Group();

  const facades = [
    mat('#9aa6ad', { roughness: 0.65 }),
    mat('#b3b0a4', { roughness: 0.7 }),
    mat('#8d99a2', { roughness: 0.62 }),
    mat('#c2bcae', { roughness: 0.72 }),
    mat('#7f8b93', { roughness: 0.6 }),
  ];
  const glassDay = mat('#6d90a4', { roughness: 0.18, metalness: 0.55 });
  const winLit = lampMat('#ffdb9e', '#4e6472');
  const roofDeck = mat('#59605f', { roughness: 0.9 });
  const antenna = mat('#5a5f63', { roughness: 0.5, metalness: 0.5 });

  // grid blok kota
  const blocks = [];
  const GX = 4, GZ = 2, STEP = 14;
  for (let i = 0; i < GX; i++) {
    for (let k = 0; k < GZ; k++) {
      const x = (i - (GX - 1) / 2) * STEP + (rng() - 0.5) * 2.5;
      const z = (k - (GZ - 1) / 2) * STEP + (rng() - 0.5) * 2.5;
      blocks.push([x, z, i, k]);
    }
  }

  for (const [x, z, i, k] of blocks) {
    // menara lebih tinggi di tengah blok
    const centrality = 1 - (Math.abs(i - (GX - 1) / 2) / GX + Math.abs(k - (GZ - 1) / 2) / GZ);
    const h = 8 + Math.pow(rng(), 1.6) * 34 * (0.45 + centrality);
    const w = 6.5 + rng() * 4;
    const d = 6.5 + rng() * 4;
    const face = pick(rng, facades);

    const tower = new THREE.Group();
    tower.position.set(x, 0, z);

    // podium
    tower.add(box(w + 2.4, 3.2, d + 2.4, 0, 0, 0, pick(rng, facades)));

    const style = rng();
    if (style < 0.33) {
      // gedung kaca bertingkat setback
      let cy = 3.2, cw = w, cd = d, rem = h;
      while (rem > 4) {
        const seg = Math.min(rem, 6 + rng() * 10);
        tower.add(box(cw, seg, cd, 0, cy, 0, face));
        // pita kaca
        const bands = Math.floor(seg / 2.2);
        for (let b = 0; b < bands; b++) {
          const by = cy + 1.0 + b * 2.2;
          tower.add(box(cw + 0.12, 1.2, cd * 0.86, 0, by, 0, rng() > 0.5 ? glassDay : winLit));
          tower.add(box(cw * 0.86, 1.2, cd + 0.12, 0, by, 0, rng() > 0.5 ? glassDay : winLit));
        }
        cy += seg;
        rem -= seg;
        cw *= 0.82; cd *= 0.82;
      }
      tower.add(box(cw + 1.2, 0.5, cd + 1.2, 0, cy, 0, roofDeck));
      if (h > 26) tower.add(cyl(0.1, 0.14, 5 + rng() * 5, 0, cy + 0.5, 0, antenna, 5));
    } else if (style < 0.66) {
      // gedung silinder / melengkung
      const r = Math.min(w, d) / 2;
      tower.add(cyl(r, r * 1.06, h, 0, 3.2, 0, face, 14));
      const bands = Math.floor(h / 2.4);
      for (let b = 0; b < bands; b++) {
        tower.add(cyl(r + 0.08, r + 0.08, 1.3, 0, 4.2 + b * 2.4, 0, rng() > 0.45 ? glassDay : winLit, 14));
      }
      tower.add(cyl(r + 0.9, r + 0.5, 0.7, 0, 3.2 + h, 0, roofDeck, 14));
      if (h > 24) tower.add(cyl(0.1, 0.13, 6, 0, 3.9 + h, 0, antenna, 5));
    } else {
      // ruko / bangunan rendah beratap
      const floors = Math.max(2, Math.round(h / 6));
      const fh = 3.4;
      for (let f = 0; f < floors; f++) {
        tower.add(box(w, fh, d, 0, 3.2 + f * fh, 0, f === 0 ? pick(rng, facades) : face));
        for (const sz of [-1, 1]) {
          tower.add(box(w * 0.74, 1.5, 0.18, 0, 3.2 + f * fh + 1.0, sz * d / 2, rng() > 0.4 ? winLit : glassDay));
        }
        tower.add(box(w + 0.7, 0.3, d + 0.7, 0, 3.2 + (f + 1) * fh - 0.3, 0, roofDeck));
      }
      const top = 3.2 + floors * fh;
      if (rng() > 0.45) {
        const r = gableRoof(w + 1.2, 1.8, d + 1.2, mat('#7b4a3a', { roughness: 0.9 }));
        r.position.set(-(w + 1.2) / 2, top, 0);
        tower.add(r);
      } else {
        tower.add(box(w + 1, 0.6, d + 1, 0, top, 0, roofDeck));
        // tangki air & AC di atap
        tower.add(cyl(0.7, 0.7, 1.6, w / 4, top + 0.6, d / 4, mat('#5c8fa8'), 8));
        tower.add(box(1.6, 0.9, 1.2, -w / 4, top + 0.6, -d / 4, mat('#8d9296')));
      }
    }

    tower.rotation.y = (rng() - 0.5) * 0.3;
    g.add(tower);
  }

  /* ---------- Jalan & trotoar antar blok ---------- */
  const road = mat('#4a4f54', { roughness: 0.98 });
  const walk = mat('#a09a8c', { roughness: 0.95 });
  const lineM = mat('#d8d2bf', { roughness: 0.9 });
  const spanX = GX * STEP, spanZ = GZ * STEP;

  for (let i = 0; i <= GX; i++) {
    const x = (i - GX / 2) * STEP;
    g.add(box(6.5, 0.3, spanZ + STEP, x, 0.1, 0, road));
    g.add(box(8.5, 0.16, spanZ + STEP, x, 0.05, 0, walk));
    for (let z = -spanZ / 2; z < spanZ / 2; z += 4) {
      g.add(box(0.3, 0.1, 2, x, 0.4, z, lineM));
    }
  }
  for (let k = 0; k <= GZ; k++) {
    const z = (k - GZ / 2) * STEP;
    g.add(box(spanX + STEP, 0.3, 6.5, 0, 0.12, z, road));
    g.add(box(spanX + STEP, 0.16, 8.5, 0, 0.06, z, walk));
    for (let x = -spanX / 2; x < spanX / 2; x += 4) {
      g.add(box(2, 0.1, 0.3, x, 0.42, z, lineM));
    }
  }

  /* ---------- Lampu jalan & pohon kota ---------- */
  const poleM = mat('#585d61', { roughness: 0.6, metalness: 0.3 });
  const lampHead = lampMat('#ffd9a0', '#d6d0c2');
  for (let i = 0; i <= GX; i++) {
    for (let k = 0; k <= GZ; k++) {
      const x = (i - GX / 2) * STEP + 4.4;
      const z = (k - GZ / 2) * STEP + 4.4;
      g.add(cyl(0.13, 0.17, 5.2, x, 0.2, z, poleM, 6));
      g.add(box(1.3, 0.14, 0.14, x - 0.65, 5.4, z, poleM));
      g.add(box(1.0, 0.28, 0.42, x - 1.2, 5.2, z, lampHead));
      if ((i + k) % 2 === 0) {
        g.add(cyl(0.3, 0.4, 2.4, x - 5, 0.2, z, mat(P.woodDark), 7));
        const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 0), mat(P.foliage, { flat: true }));
        c.position.set(x - 5, 4.2, z);
        c.castShadow = true;
        g.add(c);
      }
    }
  }

  return tag(g, 'kota');
}

/* ================================================================== */
/*  PASAR 16 ILIR — deretan kios beratap seng warna-warni             */
/* ================================================================== */
export function buildPasar(rng) {
  const g = new THREE.Group();
  const canopyColors = ['#c8553d', '#3f7a5c', '#d9a441', '#4a6d92', '#b05a8a', '#6f8f3f'];
  const wall = mat('#ddd4c0', { roughness: 0.92 });
  const wall2 = mat('#cdc4ae', { roughness: 0.92 });
  const post = mat(P.woodDark, { roughness: 0.9 });
  const floor = mat('#a39a86', { roughness: 0.95 });
  const crate = mat('#9a7a52', { roughness: 0.9 });

  // pelataran pasar
  g.add(box(44, 0.4, 24, 0, 0, 0, floor));

  // dua los memanjang berisi kios
  for (const rowZ of [-7, 7]) {
    for (let i = 0; i < 7; i++) {
      const x = -18 + i * 6;
      const w = 5.0, d = 6.0;

      // bangunan kios
      g.add(box(w, 3.6, d, x, 0.4, rowZ, i % 2 ? wall : wall2));
      // rolling door / etalase
      g.add(box(w * 0.8, 2.3, 0.2, x, 0.4, rowZ + (rowZ > 0 ? d / 2 : -d / 2), mat('#7d848a', { roughness: 0.7 })));

      // tenda kanopi warna-warni menjorok
      const col = mat(canopyColors[(i + (rowZ > 0 ? 3 : 0)) % canopyColors.length], { roughness: 0.9 });
      const dir = rowZ > 0 ? 1 : -1;
      const awn = box(w + 0.6, 0.22, 3.2, x, 3.4, rowZ + dir * (d / 2 + 1.4), col);
      awn.rotation.x = dir * 0.22;
      g.add(awn);
      for (const sx of [-1, 1]) {
        g.add(cyl(0.1, 0.1, 3.1, x + sx * w / 2, 0.4, rowZ + dir * (d / 2 + 2.8), post, 5));
      }

      // atap seng
      const r = gableRoof(w + 0.8, 1.1, d + 0.8, mat('#8a8f8c', { roughness: 0.85 }));
      r.position.set(x - (w + 0.8) / 2, 4.0, rowZ);
      g.add(r);

      // keranjang & dagangan di depan kios
      for (let k = 0; k < 3; k++) {
        const cx = x - 1.6 + k * 1.5;
        const cz = rowZ + dir * (d / 2 + 2.0);
        g.add(cyl(0.42, 0.36, 0.5, cx, 0.4, cz, crate, 8));
        const pile = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.38, 0),
          mat(canopyColors[(i + k) % canopyColors.length], { flat: true, roughness: 0.85 })
        );
        pile.position.set(cx, 1.15, cz);
        g.add(pile);
      }

      // lampu gantung kios (menyala saat malam)
      g.add(box(0.5, 0.24, 0.5, x, 3.2, rowZ + dir * (d / 2 + 1.0), lampMat('#ffd79a', '#ddd6c6')));
    }
  }

  // gang tengah + orang-orang sederhana
  g.add(box(44, 0.16, 5.5, 0, 0.4, 0, mat('#8d8574', { roughness: 0.96 })));
  const shirt = ['#c8553d', '#3d6fc8', '#e0c05a', '#4a8f6a', '#e8e2d4', '#8a5ab0'];
  for (let i = 0; i < 16; i++) {
    const px = -20 + rng() * 40;
    const pz = (rng() - 0.5) * 4.5;
    g.add(cyl(0.2, 0.22, 0.95, px, 0.56, pz, mat(shirt[Math.floor(rng() * shirt.length)]), 7));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), mat('#7a5a42'));
    head.position.set(px, 1.68, pz);
    g.add(head);
  }

  // papan nama pasar
  for (const sx of [-1, 1]) {
    g.add(cyl(0.22, 0.26, 5.5, sx * 20, 0.4, 13, post, 8));
  }
  g.add(box(41, 2.0, 0.35, 0, 5.4, 13, mat('#2f6f5e', { roughness: 0.75 })));
  g.add(box(38, 1.2, 0.2, 0, 5.8, 13.3, mat(P.gold, { roughness: 0.45, metalness: 0.4 })));

  return g;
}
