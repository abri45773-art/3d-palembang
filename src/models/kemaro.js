import * as THREE from 'three';
import { mat, lampMat, box, cyl, cone, sphere, tag, PALETTE as P } from '../lib/kit.js';
import { ISLAND } from '../world/river.js';

/**
 * Pulau Kemaro — pagoda sembilan lantai, Klenteng Hok Tjing Rio,
 * gapura merah, dan Pohon Cinta di delta tengah Sungai Musi.
 * Group ditempatkan pada pusat pulau oleh pemanggil.
 */
export function buildKemaro() {
  const g = new THREE.Group();

  const red = mat(P.pagodaRed, { roughness: 0.7 });
  const redDark = mat('#9e332c', { roughness: 0.74 });
  const goldM = mat(P.pagodaGold, { roughness: 0.38, metalness: 0.5 });
  const roof = mat('#b8392f', { roughness: 0.68 });
  const roofEdge = mat('#e0b84e', { roughness: 0.45, metalness: 0.4 });
  const wall = mat('#f0e6d2', { roughness: 0.9 });
  const stone = mat('#b7ae9b', { roughness: 0.94 });
  const wood = mat(P.woodDark, { roughness: 0.85 });
  const lanternMat = lampMat('#ff6a4d', '#e0483c');

  /* ---------- Pelataran batu ---------- */
  g.add(cyl(19, 20, 0.6, 0, 0, 0, stone, 28));

  /* ---------- PAGODA 9 LANTAI ---------- */
  const pag = new THREE.Group();
  pag.position.set(0, 0.6, -3);

  // podium
  pag.add(cyl(7.2, 8.0, 1.8, 0, 0, 0, stone, 8));
  pag.add(cyl(6.6, 7.2, 0.8, 0, 1.8, 0, redDark, 8));
  // tangga masuk
  for (let i = 0; i < 3; i++) {
    pag.add(box(4.2 - i * 0.4, 0.55, 1.2, 0, i * 0.55, 8.0 - i * 0.5, stone));
  }

  let y = 2.6;
  const FLOORS = 9;
  for (let i = 0; i < FLOORS; i++) {
    const t = i / (FLOORS - 1);
    const r = 5.6 - t * 3.0;      // makin ke atas makin ramping
    const h = 3.3 - t * 1.0;

    // badan lantai (oktagonal)
    pag.add(cyl(r, r + 0.25, h, 0, y, 0, i % 2 === 0 ? red : redDark, 8));

    // pilar sudut emas
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      pag.add(cyl(0.17, 0.17, h, Math.cos(a) * (r + 0.1), y, Math.sin(a) * (r + 0.1), goldM, 6));
    }

    // jendela lengkung tiap sisi
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const wx = Math.cos(a) * (r + 0.18), wz = Math.sin(a) * (r + 0.18);
      pag.add(box(r * 0.5, h * 0.5, 0.24, wx, y + h * 0.22, wz, lampMat('#ffca6e', '#7a4a30'), -a));
    }

    // atap menjorok dengan ujung melengkung
    const eaveR = r + 2.5 - t * 0.7;
    const eave = cone(eaveR, 1.5, 0, y + h, 0, roof, 8, Math.PI / 8);
    pag.add(eave);
    pag.add(cyl(eaveR, eaveR + 0.3, 0.28, 0, y + h - 0.1, 0, roofEdge, 8));

    // ujung atap melengkung ke atas (upturned eaves)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const ex = Math.cos(a) * eaveR, ez = Math.sin(a) * eaveR;
      const tipGeo = new THREE.TorusGeometry(0.75, 0.13, 5, 8, Math.PI * 0.6);
      const tip = new THREE.Mesh(tipGeo, roofEdge);
      tip.position.set(ex, y + h - 0.05, ez);
      tip.rotation.y = -a + Math.PI / 2;
      tip.rotation.z = -Math.PI / 2.2;
      tip.castShadow = true;
      pag.add(tip);

      // lampion tergantung di ujung atap
      if (i % 2 === 0 && k % 2 === 0) {
        const lan = sphere(0.42, ex * 0.94, y + h - 0.9, ez * 0.94, lanternMat, 10);
        lan.scale.y = 0.78;
        pag.add(lan);
      }
    }

    y += h + 1.2;
  }

  // mahkota pagoda
  pag.add(cone(1.9, 2.2, 0, y - 0.4, 0, roof, 8, Math.PI / 8));
  pag.add(cyl(0.22, 0.32, 3.0, 0, y + 1.8, 0, goldM, 8));
  for (let i = 0; i < 3; i++) {
    pag.add(cyl(0.7 - i * 0.18, 0.7 - i * 0.18, 0.2, 0, y + 2.1 + i * 0.7, 0, goldM, 10));
  }
  pag.add(sphere(0.55, 0, y + 5.2, 0, goldM, 12));
  g.add(pag);

  /* ---------- Klenteng Hok Tjing Rio ---------- */
  const kl = new THREE.Group();
  kl.position.set(-12.5, 0.6, 9);
  kl.rotation.y = 0.5;

  kl.add(box(13, 0.6, 9, 0, 0, 0, stone));
  kl.add(box(11, 4.4, 7, 0, 0.6, 0, wall));
  // pilar merah
  for (const x of [-4.6, -1.6, 1.6, 4.6]) {
    kl.add(cyl(0.38, 0.42, 4.6, x, 0.6, 3.6, red, 10));
  }
  // atap pelana melengkung khas klenteng
  const kRoof = cone(9.0, 2.6, 0, 5.0, 0, roof, 4, Math.PI / 4);
  kRoof.scale.z = 0.62;
  kl.add(kRoof);
  kl.add(box(13.5, 0.35, 8.6, 0, 4.9, 0, roofEdge));
  // naga/ornamen bubungan
  kl.add(box(7.0, 0.5, 0.5, 0, 7.4, 0, goldM));
  kl.add(sphere(0.7, 0, 8.0, 0, goldM, 10));
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.16, 5, 9, Math.PI * 0.65), goldM);
    t.position.set(sx * 3.6, 7.3, 0);
    t.rotation.z = sx > 0 ? -Math.PI / 2.4 : Math.PI / 2.4;
    t.rotation.y = Math.PI / 2;
    kl.add(t);
  }
  // pintu & lampion
  kl.add(box(2.6, 3.4, 0.3, 0, 0.6, 3.5, mat('#8e2f26', { roughness: 0.7 })));
  for (const x of [-3.0, 3.0]) {
    const lan = sphere(0.62, x, 4.4, 3.5, lanternMat, 12);
    lan.scale.y = 0.8;
    kl.add(lan);
  }
  g.add(kl);

  /* ---------- Gapura merah di dermaga ---------- */
  const gap = new THREE.Group();
  gap.position.set(6, 0.6, 15);
  gap.rotation.y = -0.25;
  for (const sx of [-1, 1]) {
    gap.add(cyl(0.55, 0.7, 7.0, sx * 4.2, 0, 0, red, 10));
    gap.add(cyl(0.9, 0.9, 0.5, sx * 4.2, 0, 0, stone, 10));
  }
  gap.add(box(11.5, 1.1, 1.4, 0, 7.0, 0, red));
  const gRoof = cone(7.2, 1.7, 0, 8.1, 0, roof, 4, Math.PI / 4);
  gRoof.scale.z = 0.3;
  gap.add(gRoof);
  gap.add(box(12.2, 0.3, 2.0, 0, 8.0, 0, roofEdge));
  gap.add(box(5.0, 1.2, 0.25, 0, 5.5, 0.8, goldM));
  g.add(gap);

  /* ---------- Pohon Cinta ---------- */
  const tree = new THREE.Group();
  tree.position.set(12, 0.6, -4);
  tree.add(cyl(0.85, 1.5, 5.0, 0, 0, 0, wood, 9));
  // cabang
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const br = cyl(0.22, 0.42, 3.4, Math.cos(a) * 1.0, 4.2, Math.sin(a) * 1.0, wood, 6);
    br.rotation.z = -Math.cos(a) * 0.6;
    br.rotation.x = Math.sin(a) * 0.6;
    tree.add(br);
  }
  const crownMat = mat(P.foliage, { flat: true, roughness: 0.9 });
  for (const [cx, cy, cz, r] of [[0, 8.0, 0, 4.6], [3.2, 7.0, 1.4, 3.2], [-2.8, 7.2, -1.8, 3.0], [0.6, 9.6, 2.2, 2.6]]) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), crownMat);
    blob.position.set(cx, cy, cz);
    blob.castShadow = true;
    tree.add(blob);
  }
  // pita merah harapan
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    tree.add(box(0.25, 1.3, 0.08, Math.cos(a) * 2.2, 4.4, Math.sin(a) * 2.2, mat('#d7382c'), a));
  }
  g.add(tree);

  /* ---------- Dermaga kayu ---------- */
  const dock = new THREE.Group();
  dock.position.set(4, 0, 19);
  dock.add(box(9, 0.45, 13, 0, 0.5, 4, mat(P.wood, { roughness: 0.9 })));
  for (let i = 0; i < 5; i++) {
    for (const sx of [-1, 1]) {
      dock.add(cyl(0.26, 0.3, 4.5, sx * 3.6, -3.6, i * 2.6, wood, 6));
    }
  }
  for (let i = 0; i < 6; i++) {
    for (const sx of [-1, 1]) {
      dock.add(cyl(0.13, 0.13, 1.2, sx * 4.0, 0.95, i * 2.1, red, 6));
    }
  }
  g.add(dock);

  /* ---------- Vegetasi pulau ---------- */
  const palm = (x, z, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, 0.5, z);
    t.add(cyl(0.28 * s, 0.42 * s, 6.5 * s, 0, 0, 0, mat(P.woodDark), 7));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const f = box(4.6 * s, 0.2, 0.95 * s, Math.cos(a) * 2.1 * s, 6.4 * s, Math.sin(a) * 2.1 * s, mat(P.foliageDark), a);
      f.rotation.z = 0.3;
      t.add(f);
    }
    return t;
  };
  for (const [x, z, s] of [[-16, -6, 1], [15, 11, 0.85], [-8, -13, 0.95], [17, -12, 0.8], [-17, 4, 0.9]]) {
    g.add(palm(x, z, s));
  }
  for (const [x, z] of [[9, -14], [-13, 14], [18, 3]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), mat(P.foliageLight, { flat: true }));
    b.position.set(x, 2.4, z);
    b.castShadow = true;
    g.add(b);
  }

  return tag(g, 'kemaro');
}

export const KEMARO_POS = ISLAND;
