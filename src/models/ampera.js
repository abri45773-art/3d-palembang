import * as THREE from 'three';
import { mat, lampMat, box, cyl, sphere, strut, tag, PALETTE as P } from '../lib/kit.js';
import { riverZ, riverHalf } from '../world/river.js';
import { groundHeight } from '../world/terrain.js';

/**
 * Jembatan Ampera — dua menara merah kembar dengan jam,
 * balok penggantung biru, kabel, dan jalan lengkung di atas Sungai Musi.
 * Sumbu jembatan: menyeberang sungai searah Z pada x ≈ 0.
 */
export function buildAmpera() {
  const g = new THREE.Group();

  const red = mat(P.amperaRed, { roughness: 0.62, metalness: 0.12 });
  const redDark = mat(P.amperaRedDark, { roughness: 0.66, metalness: 0.12 });
  const blue = mat(P.amperaBlue, { roughness: 0.5, metalness: 0.3 });
  const conc = mat(P.concrete, { roughness: 0.94 });
  const concDark = mat(P.concreteDark, { roughness: 0.95 });
  const asphalt = mat(P.asphalt, { roughness: 0.98 });
  const line = mat(P.roadLine, { roughness: 0.9 });
  const steel = mat('#6f7276', { roughness: 0.45, metalness: 0.55 });
  const white = mat('#f4f0e6', { roughness: 0.8 });

  const X = 0;                       // posisi melintang jembatan
  const half = riverHalf(X);         // ± 30
  const cz = riverZ(X);              // ≈ 0
  const DECK_Y = 15.5;               // tinggi lantai jembatan
  const W = 13;                      // lebar jembatan
  const towerZ = [cz - half * 0.52, cz + half * 0.52];  // posisi dua menara
  const abutZ = [cz - half - 34, cz + half + 34];       // pangkal jauh di darat

  /* ---------------- Pilar & pondasi menara ---------------- */
  for (const tz of towerZ) {
    // caisson beton di air
    const base = box(20, 5.2, 17, X, -2.4, tz, concDark);
    g.add(base);
    const cap = box(17.6, 2.2, 15, X, 2.6, tz, conc);
    g.add(cap);
    // fender kayu di sekeliling
    for (let i = -3; i <= 3; i++) {
      if (Math.abs(i) < 2) continue;
      g.add(cyl(0.35, 0.35, 6, X - 10.6, -1.5, tz + i * 2.3, mat(P.woodDark), 6));
      g.add(cyl(0.35, 0.35, 6, X + 10.6, -1.5, tz + i * 2.3, mat(P.woodDark), 6));
    }
  }

  /* ---------------- Menara kembar ---------------- */
  const TOWER_H = 40;
  const LEG_W = 3.4;
  const legOffset = W / 2 + 0.6;

  towerZ.forEach((tz, ti) => {
    const t = new THREE.Group();

    // dua kaki tiap menara (kiri-kanan jalan)
    for (const sx of [-1, 1]) {
      const lx = X + sx * legOffset;
      t.add(box(LEG_W, TOWER_H, 5.4, lx, 4.8, tz, red));
      // garis vertikal gelap sebagai detail panel
      t.add(box(0.5, TOWER_H - 2, 5.6, lx - LEG_W / 2 + 0.5, 5.6, tz, redDark));
      t.add(box(0.5, TOWER_H - 2, 5.6, lx + LEG_W / 2 - 0.5, 5.6, tz, redDark));
      // sabuk horizontal
      for (const yy of [16, 27, 36]) {
        t.add(box(LEG_W + 0.5, 0.9, 5.9, lx, yy, tz, redDark));
      }
    }

    // palang penghubung antar kaki
    for (const yy of [22.5, 33.5]) {
      t.add(box(legOffset * 2 + LEG_W, 1.5, 4.4, X, yy, tz, blue));
    }
    // palang bawah tepat di atas dek
    t.add(box(legOffset * 2 + LEG_W, 1.2, 4.6, X, DECK_Y + 3.4, tz, red));

    // kepala menara — ruang mesin berjendela
    const headY = 4.8 + TOWER_H;
    t.add(box(legOffset * 2 + LEG_W + 1.6, 5.4, 7.4, X, headY, tz, red));
    // jendela kaca ruang mesin
    t.add(box(legOffset * 2 + LEG_W + 1.7, 3.0, 0.3, X, headY + 1.1, tz - 3.75, mat('#4c5b63', { roughness: 0.35, metalness: 0.4 })));
    t.add(box(legOffset * 2 + LEG_W + 1.7, 3.0, 0.3, X, headY + 1.1, tz + 3.65, mat('#4c5b63', { roughness: 0.35, metalness: 0.4 })));
    // atap topi
    t.add(box(legOffset * 2 + LEG_W + 3.4, 1.0, 9.0, X, headY + 5.4, tz, redDark));
    // antena
    t.add(cyl(0.12, 0.16, 4.5, X - 4, headY + 6.4, tz, steel, 6));
    t.add(cyl(0.12, 0.16, 3.2, X + 4, headY + 6.4, tz, steel, 6));

    // jam bundar (hanya menara utara, seperti aslinya)
    if (ti === 0) {
      for (const sz of [-1, 1]) {
        const face = new THREE.Mesh(new THREE.CircleGeometry(2.4, 28), white);
        face.position.set(X - legOffset, headY - 1.2, tz + sz * 2.9);
        face.rotation.y = sz > 0 ? 0 : Math.PI;
        g.add(face);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.22, 8, 28), redDark);
        ring.position.copy(face.position);
        ring.rotation.y = face.rotation.y;
        g.add(ring);
        // jarum jam
        const hh = box(0.22, 1.4, 0.12, 0, 0, 0, mat('#20262a'));
        hh.position.set(X - legOffset, headY - 0.6, tz + sz * 3.05);
        g.add(hh);
        const mh = box(0.16, 0.1, 0.12, 0, 0, 0, mat('#20262a'));
        mh.scale.set(0.16, 1.9, 0.12);
        mh.position.set(X - legOffset + (sz > 0 ? 1.0 : -1.0), headY - 1.2, tz + sz * 3.05);
        mh.rotation.z = Math.PI / 2;
        g.add(mh);
      }
      // papan nama AMPERA
      const sign = box(6.4, 1.5, 0.4, X + legOffset - 3.2, DECK_Y + 4.2, tz + 2.6, mat(P.gold, { roughness: 0.5, metalness: 0.35 }));
      g.add(sign);
    }

    g.add(t);
  });

  /* ---------------- Lantai jembatan (melengkung) ---------------- */
  const deckLen = Math.abs(abutZ[1] - abutZ[0]);
  const segs = 46;
  const camber = 2.6;  // tinggi lengkung di tengah

  // tinggi tanah di kedua pangkal — dek harus mendarat mulus di sini
  const endY0 = Math.max(groundHeight(X, abutZ[0]), 0.4) + 0.3;
  const endY1 = Math.max(groundHeight(X, abutZ[1]), 0.4) + 0.3;

  const deckY = (z) => {
    const t = THREE.MathUtils.clamp((z - abutZ[0]) / deckLen, 0, 1);
    const arch = Math.sin(Math.PI * t);
    // naik dari tanah ke ketinggian jembatan, lalu turun lagi
    const ramp = THREE.MathUtils.smoothstep(t, 0.0, 0.30) * THREE.MathUtils.smoothstep(1 - t, 0.0, 0.30);
    const ground = THREE.MathUtils.lerp(endY0, endY1, t);
    return ground + (DECK_Y - ground) * ramp + camber * arch * ramp;
  };

  for (let i = 0; i < segs; i++) {
    const z0 = abutZ[0] + (deckLen * i) / segs;
    const z1 = abutZ[0] + (deckLen * (i + 1)) / segs;
    const y0 = deckY(z0), y1 = deckY(z1);
    const zc = (z0 + z1) / 2;
    const yc = (y0 + y1) / 2;
    const len = Math.hypot(z1 - z0, y1 - y0);
    const ang = Math.atan2(y1 - y0, z1 - z0);

    // pelat aspal
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.55, len * 1.02), asphalt);
    slab.position.set(X, yc, zc);
    slab.rotation.x = -ang;
    slab.castShadow = true;
    slab.receiveShadow = true;
    g.add(slab);

    // gelagar merah di bawah dek
    const girder = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 1.5, len * 1.02), red);
    girder.position.set(X, yc - 1.0, zc);
    girder.rotation.x = -ang;
    girder.castShadow = true;
    g.add(girder);

    // marka jalan putus-putus
    if (i % 2 === 0) {
      const mk = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, len * 0.5), line);
      mk.position.set(X, yc + 0.34, zc);
      mk.rotation.x = -ang;
      g.add(mk);
    }

    // pagar/railing
    for (const sx of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, len * 1.02), redDark);
      rail.position.set(X + sx * (W / 2 - 0.2), yc + 0.9, zc);
      rail.rotation.x = -ang;
      g.add(rail);
    }
  }

  /* ---------------- Pilar penyangga di darat ---------------- */
  for (let i = 1; i <= 5; i++) {
    for (const side of [-1, 1]) {
      const t = i / 6;
      const z = side < 0
        ? THREE.MathUtils.lerp(abutZ[0], cz - half, t)
        : THREE.MathUtils.lerp(abutZ[1], cz + half, t);
      const top = deckY(z) - 1.9;
      const gy = groundHeight(X, z);
      const baseY = Math.min(gy, 0) - 2;
      const h = top - baseY;
      if (h < 2.2) continue;   // lewati bila dek sudah dekat tanah
      g.add(box(9.5, h, 4.2, X, baseY, z, conc));
      g.add(box(11.5, 1.0, 5.4, X, top, z, concDark));
    }
  }

  /* ---------------- Kabel penggantung ---------------- */
  const cableMat = mat('#3b3f43', { roughness: 0.5, metalness: 0.5 });
  const headY = 4.8 + TOWER_H;
  for (const sx of [-1, 1]) {
    const lx = X + sx * legOffset;
    // kabel utama melengkung antar menara
    const pts = [];
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const z = THREE.MathUtils.lerp(towerZ[0], towerZ[1], t);
      const sag = Math.sin(Math.PI * t) * 11;
      pts.push(new THREE.Vector3(lx, headY + 1.2 - sag, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.17, 5, false), cableMat);
    tube.castShadow = true;
    g.add(tube);

    // penggantung vertikal ke dek
    for (let i = 2; i < n - 1; i += 2) {
      const p = pts[i];
      const dy = deckY(p.z) + 1.2;
      if (p.y - dy < 1) continue;
      g.add(strut(new THREE.Vector3(p.x, p.y, p.z), new THREE.Vector3(p.x, dy, p.z), 0.07, cableMat));
    }

    // kabel jangkar dari menara ke pangkal darat
    for (const [tz, az] of [[towerZ[0], abutZ[0] + 2], [towerZ[1], abutZ[1] - 2]]) {
      g.add(strut(
        new THREE.Vector3(lx, headY + 1.2, tz),
        new THREE.Vector3(lx, deckY(az) + 1.4, az),
        0.14, cableMat
      ));
    }
  }

  /* ---------------- Tiang lampu jalan ---------------- */
  const lamp = lampMat('#ffd9a0', '#d8d2c4');
  const poleMat = mat('#6a6f73', { roughness: 0.6, metalness: 0.3 });
  for (let z = abutZ[0] + 5; z < abutZ[1] - 3; z += 9) {
    for (const sx of [-1, 1]) {
      const px = X + sx * (W / 2 - 0.5);
      const py = deckY(z) + 0.6;
      g.add(cyl(0.14, 0.18, 4.2, px, py, z, poleMat, 6));
      const arm = box(1.5, 0.16, 0.16, px - sx * 0.75, py + 4.2, z, poleMat);
      g.add(arm);
      const head = box(1.1, 0.3, 0.5, px - sx * 1.4, py + 4.05, z, lamp);
      g.add(head);
    }
  }

  /* ---------------- Lampu hias jembatan (menyala saat malam) ---------------- */
  const neon = lampMat('#ff5a3c', '#b8382c');
  const neonWarm = lampMat('#ffc46b', '#c9a05a');

  // untaian lampu menyusuri tepi dek
  for (let z = abutZ[0] + 4; z < abutZ[1] - 3; z += 3.2) {
    for (const sx of [-1, 1]) {
      g.add(box(0.3, 0.3, 0.3, X + sx * (W / 2 + 0.25), deckY(z) + 1.45, z, neon));
    }
  }
  // garis lampu vertikal pada menara
  towerZ.forEach((tz) => {
    for (const sx of [-1, 1]) {
      const lx = X + sx * legOffset;
      for (let yy = DECK_Y + 6; yy < 4.8 + TOWER_H; yy += 4.5) {
        g.add(box(0.34, 0.34, 0.34, lx + sx * (LEG_W / 2 + 0.2), yy, tz + 2.9, neonWarm));
        g.add(box(0.34, 0.34, 0.34, lx + sx * (LEG_W / 2 + 0.2), yy, tz - 2.9, neonWarm));
      }
    }
    // lampu puncak (aviation light)
    g.add(sphere(0.4, X, 4.8 + TOWER_H + 6.2, tz, lampMat('#ff2f2f', '#a02020'), 8));
  });

  return tag(g, 'ampera');
}
