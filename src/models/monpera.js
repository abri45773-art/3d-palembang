import * as THREE from 'three';
import { mat, lampMat, box, cyl, tag, PALETTE as P } from '../lib/kit.js';

/**
 * Monpera (Monumen Perjuangan Rakyat).
 * Bentuk khas: bangunan bertingkat dikelilingi lima kelopak bunga melati
 * raksasa berwarna putih yang merekah ke luar.
 */
export function buildMonpera() {
  const g = new THREE.Group();

  const petal = mat('#e9e6dd', { roughness: 0.78 });
  const petalShade = mat('#d2cec3', { roughness: 0.8 });
  const body = mat('#cfcabd', { roughness: 0.85 });
  const bodyDark = mat('#b4ae9f', { roughness: 0.88 });
  const plaza = mat('#b9b1a0', { roughness: 0.95 });
  const glass = lampMat('#ffd9a0', '#54666e');
  const relief = mat('#8d8574', { roughness: 0.9 });
  const gold = mat(P.gold, { roughness: 0.4, metalness: 0.5 });

  /* ---------- Plaza & tangga ---------- */
  g.add(box(40, 0.6, 40, 0, 0, 0, plaza));
  for (let i = 0; i < 4; i++) {
    g.add(cyl(15 - i * 0.9, 15.4 - i * 0.9, 0.55, 0, 0.6 + i * 0.55, 0, i % 2 ? bodyDark : body, 24));
  }
  const baseY = 0.6 + 4 * 0.55;

  /* ---------- Inti bangunan bertingkat ---------- */
  const tiers = [
    { r: 9.0, h: 5.0 },
    { r: 7.6, h: 4.4 },
    { r: 6.2, h: 3.8 },
  ];
  let y = baseY;
  tiers.forEach((t, i) => {
    g.add(cyl(t.r, t.r + 0.5, t.h, 0, y, 0, i % 2 ? bodyDark : body, 20));
    // pita jendela tiap tingkat
    const ringCount = 14;
    for (let k = 0; k < ringCount; k++) {
      const a = (k / ringCount) * Math.PI * 2;
      g.add(box(1.5, t.h * 0.45, 0.3, Math.cos(a) * (t.r + 0.1), y + t.h * 0.28, Math.sin(a) * (t.r + 0.1), glass, -a));
    }
    g.add(cyl(t.r + 0.9, t.r + 0.9, 0.5, 0, y + t.h, 0, relief, 20));
    y += t.h + 0.5;
  });

  /* ---------- Lima kelopak melati ---------- */
  const PETALS = 5;
  for (let i = 0; i < PETALS; i++) {
    const a = (i / PETALS) * Math.PI * 2 + Math.PI / 5;

    // kelopak dibentuk dari lathe: profil melengkung meruncing
    const pts = [];
    const N = 16;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      // lebar kelopak: sempit di bawah, lebar di tengah, runcing di ujung
      const w = Math.sin(Math.pow(t, 0.72) * Math.PI) * 5.2 + 0.35;
      pts.push(new THREE.Vector2(w, t * 21));
    }
    const shape = new THREE.LatheGeometry(pts, 14, -0.62, 1.24);
    const mesh = new THREE.Mesh(shape, i % 2 ? petal : petalShade);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // condongkan ke luar seperti kelopak yang merekah
    const grp = new THREE.Group();
    grp.add(mesh);
    mesh.rotation.x = 0.30;
    mesh.position.set(0, 0, 1.2);
    grp.rotation.y = a;
    grp.position.set(Math.cos(a) * 6.0, baseY + 1.5, Math.sin(a) * 6.0);
    grp.rotation.y = -a + Math.PI / 2;
    grp.lookAt(Math.cos(a) * 60, baseY + 12, Math.sin(a) * 60);
    grp.rotateX(Math.PI / 2 - 0.42);
    g.add(grp);

    // rusuk penebal di tengah kelopak
    const rib = box(0.9, 20, 0.9, 0, 0, 0, petalShade);
    rib.position.set(Math.cos(a) * 7.6, baseY + 2, Math.sin(a) * 7.6);
    rib.rotation.z = -Math.cos(a) * 0.34;
    rib.rotation.x = Math.sin(a) * 0.34;
    g.add(rib);
  }

  /* ---------- Puncak: obor / mahkota ---------- */
  g.add(cyl(3.6, 4.6, 2.0, 0, y, 0, body, 18));
  g.add(cyl(1.5, 2.4, 4.0, 0, y + 2.0, 0, bodyDark, 14));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.7, 4.2, 10), lampMat('#ffb347', '#e8c76a'));
  flame.position.set(0, y + 8.1, 0);
  flame.castShadow = true;
  g.add(flame);
  g.add(cyl(0.5, 0.7, 1.0, 0, y + 6.0, 0, gold, 10));

  /* ---------- Relief & prasasti di kaki ---------- */
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(box(5.0, 2.6, 0.5, Math.cos(a) * 11.6, 0.6, Math.sin(a) * 11.6, relief, -a));
  }

  /* ---------- Tiang bendera & lampu sorot ---------- */
  g.add(cyl(0.16, 0.2, 12, -16, 0.6, 12, mat('#9a958a'), 8));
  g.add(box(3.2, 2.1, 0.1, -14.4, 10.4, 12, mat('#d7382c')));
  g.add(box(3.2, 2.1, 0.11, -14.4, 8.3, 12, mat('#f2ede1')));

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6;
    const lx = Math.cos(a) * 16, lz = Math.sin(a) * 16;
    g.add(box(1.6, 0.8, 1.2, lx, 0.6, lz, mat('#6f6a5f')));
    g.add(box(1.2, 0.5, 0.5, lx, 1.1, lz, lampMat('#cfe4ff', '#dcd6c8')));
  }

  /* ---------- Pohon pelindung ---------- */
  for (const [tx, tz] of [[17, -14], [-18, -12], [16, 16]]) {
    g.add(cyl(0.5, 0.7, 3.2, tx, 0.6, tz, mat(P.woodDark), 8));
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4, 0), mat(P.foliage, { flat: true }));
    c.position.set(tx, 6.4, tz);
    c.castShadow = true;
    g.add(c);
  }

  return tag(g, 'monpera');
}
