import * as THREE from 'three';
import { Kit, GROUND, mat, gBox, slabGeometry, rand, group } from '../lib/util.js';
import { makeAsphalt, makeGround, makeEarth, makeNamePlate } from '../lib/textures.js';
import { BOUND_X, BOUND_Z, bankN, bankS, ROADS, ROAD_Y } from './layout.js';

const SLAB_THICK = 8;

/** Poligon daratan satu sisi sungai, dengan kanal sebagai lubang. */
function landShape(bank, other, canals) {
  const s = new THREE.Shape();
  const step = 8;
  s.moveTo(-BOUND_X, other);
  s.lineTo(BOUND_X, other);
  for (let x = BOUND_X; x >= -BOUND_X; x -= step) s.lineTo(x, bank(x));
  s.closePath();
  for (const c of canals) {
    const p = new THREE.Path();
    p.moveTo(c.x0, c.z0);
    p.lineTo(c.x1, c.z0);
    p.lineTo(c.x1, c.z1);
    p.lineTo(c.x0, c.z1);
    p.closePath();
    s.holes.push(p);
  }
  return s;
}

export const CANALS = {
  north: [{ x0: -146, x1: -136, z0: bankN(-141), z1: -144 }],  // Sungai Sekanak
  south: [{ x0: 214, x1: 222, z0: bankS(218), z1: 144 }],       // anak sungai Ulu
};

export function buildTerrain(parent) {
  const g = group('terrain', parent);

  const asphalt = makeAsphalt();
  asphalt.repeat.set(14, 14);      // UV kotak 0..1 per muka
  const ground = makeGround();
  ground.repeat.set(0.03, 0.03);   // UV ExtrudeGeometry memakai satuan dunia
  const earth = makeEarth();
  earth.repeat.set(0.05, 0.05);

  const mEarth = mat('#5a4b36', { map: earth, roughness: 1 });
  const mGrass = mat('#77855a', { map: ground, roughness: 1 });

  /* ---------------- daratan ---------------- */
  const northGeo = slabGeometry(landShape(bankN, -BOUND_Z, CANALS.north), GROUND, SLAB_THICK);
  const southGeo = slabGeometry(landShape(bankS, BOUND_Z, CANALS.south), GROUND, SLAB_THICK);

  // ExtrudeGeometry membuat 2 grup material: 0 = tutup atas/bawah, 1 = dinding sisi
  for (const geo of [northGeo, southGeo]) {
    const mesh = new THREE.Mesh(geo, [mGrass, mEarth]);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  /* ---------------- dasar sungai & kanal ---------------- */
  const bedShape = new THREE.Shape();
  bedShape.moveTo(-BOUND_X, bankN(-BOUND_X));
  for (let x = -BOUND_X; x <= BOUND_X; x += 8) bedShape.lineTo(x, bankN(x));
  for (let x = BOUND_X; x >= -BOUND_X; x -= 8) bedShape.lineTo(x, bankS(x));
  bedShape.closePath();
  const bed = new THREE.Mesh(slabGeometry(bedShape, -0.9, SLAB_THICK), mat('#4b4632', { roughness: 1 }));
  bed.receiveShadow = true;
  g.add(bed);

  const canalMat = mat('#414833', { roughness: 1 });
  for (const list of [CANALS.north, CANALS.south]) {
    for (const c of list) {
      const w = c.x1 - c.x0;
      const d = Math.abs(c.z1 - c.z0);
      const cz = Math.min(c.z0, c.z1) + d / 2;
      const cx = (c.x0 + c.x1) / 2;
      const m = new THREE.Mesh(gBox(w, 1, d, cx, -1.0, cz), canalMat);
      m.receiveShadow = true;
      g.add(m);
    }
  }

  /* ---------------- tanggul / kade tepian ---------------- */
  const kit = new Kit();
  const mQuay = mat('#9a9488', { roughness: 0.95 });
  const mQuayTop = mat('#b6b0a2', { roughness: 0.9 });
  const railPts = [];

  const jembatan = (x) => Math.abs(x) < 13 || Math.abs(x - 250) < 9 || Math.abs(x + 290) < 9;
  const quayRun = (bank, sign) => {
    for (let x = -BOUND_X + 3; x <= BOUND_X - 3; x += 6) {
      if (jembatan(x)) continue;      // kade berhenti di kaki jembatan
      const z0 = bank(x);
      const slope = (bank(x + 3) - bank(x - 3)) / 6;
      const rot = -Math.atan(slope);
      const cz = z0 + sign * 1.1;
      kit.add(xform2(gBox(6.4, 3.4, 2.2, 0, -1.2, 0), x, 0, cz, rot), mQuay);
      kit.add(xform2(gBox(6.4, 0.22, 2.6, 0, 2.2, 0), x, 0, cz, rot), mQuayTop);
      // pagar
      for (let k = -2.6; k <= 2.6; k += 2.6) {
        const lx = x + Math.cos(rot) * k;
        const lz = cz - Math.sin(rot) * k;
        kit.add(gBox(0.18, 1.0, 0.18, lx, 2.4, lz), mQuay);
        railPts.push([lx, 3.35, lz]);
      }
      kit.add(xform2(gBox(6.4, 0.14, 0.14, 0, 3.35, 0), x, 0, cz, rot), mQuay);
      // tangga turun ke air di beberapa titik
      if (Math.abs(((x / 6) | 0) % 17) === 3) {
        for (let s = 0; s < 4; s++) {
          kit.add(xform2(gBox(3.4, 0.3, 0.8, 0, -0.6 + s * 0.55, -sign * (1.6 + s * 0.85)), x, 0, z0, rot), mQuayTop);
        }
      }
    }
  };
  quayRun(bankN, -1);
  quayRun(bankS, 1);
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'quay' });

  /* ---------------- jaringan jalan ---------------- */
  const roadKit = new Kit();
  const mAsphalt = mat('#3a3e44', { map: asphalt, roughness: 0.95 });
  const mWalk = mat('#a8a294', { roughness: 0.95 });
  const mLine = mat('#d9d2b8', { roughness: 0.9 });

  let ri = 0;
  const roadMeshes = [];
  const pushRoad = (axis, r, y) => {
    const len = r.to - r.from;
    const mid = (r.from + r.to) / 2;
    if (axis === 'h') {
      roadKit.add(gBox(len, 0.12, r.w, mid, y, r.at), mAsphalt);
      roadKit.add(gBox(len, 0.18, 1.5, mid, y, r.at - r.w / 2 - 0.75), mWalk);
      roadKit.add(gBox(len, 0.18, 1.5, mid, y, r.at + r.w / 2 + 0.75), mWalk);
      if (r.w >= 5) {
        for (let x = r.from + 4; x < r.to - 4; x += 11) roadKit.add(gBox(4, 0.02, 0.32, x, y + 0.13, r.at), mLine);
      }
    } else {
      roadKit.add(gBox(r.w, 0.12, len, r.at, y, mid), mAsphalt);
      roadKit.add(gBox(1.5, 0.18, len, r.at - r.w / 2 - 0.75, y, mid), mWalk);
      roadKit.add(gBox(1.5, 0.18, len, r.at + r.w / 2 + 0.75, y, mid), mWalk);
      if (r.w >= 5) {
        for (let z = r.from + 4; z < r.to - 4; z += 11) roadKit.add(gBox(0.32, 0.02, 4, r.at, y + 0.13, z), mLine);
      }
    }
  };
  for (const r of ROADS.h) pushRoad('h', r, ROAD_Y + (ri++ % 2) * 0.004);
  for (const r of ROADS.v) pushRoad('v', r, ROAD_Y + 0.006 + (ri++ % 2) * 0.004);
  roadKit.build(g, { castShadow: false, receiveShadow: true, name: 'roads' }).forEach((m) => roadMeshes.push(m));

  /* ---------------- pelataran, taman, lapangan ---------------- */
  const patch = new Kit();
  const mPlaza = mat('#b7ae9c', { roughness: 0.95 });
  const mPark = mat('#6f8a4c', { roughness: 1 });
  const mDirt = mat('#8d7c5c', { roughness: 1 });
  const mField = mat('#4e7a3c', { roughness: 1 });

  // Pelataran Benteng Kuto Besak
  patch.add(gBox(96, 0.05, 30, -100, GROUND + 0.004, bankN(-100) - 20), mPlaza);
  // Alun-alun depan Monpera / ujung jembatan
  patch.add(gBox(46, 0.05, 26, 20, GROUND + 0.004, bankN(20) - 22), mPlaza);
  // Taman Kambang Iwak
  patch.add(gBox(104, 0.05, 80, 150, GROUND + 0.004, -196), mPark);
  patch.add(gBox(52, 0.09, 34, 150, GROUND + 0.01, -196), mat('#3f5f63', { roughness: 0.35, metalness: 0.1 }));
  // Kawasan Jakabaring
  patch.add(gBox(190, 0.05, 150, 232, GROUND + 0.004, 200), mPark);
  patch.add(gBox(120, 0.05, 70, 232, GROUND + 0.004, 200), mPlaza);
  patch.add(gBox(52, 0.09, 34, 300, GROUND + 0.01, 252), mField);   // lapangan latihan
  patch.add(gBox(52, 0.09, 34, 170, GROUND + 0.01, 258), mField);
  patch.add(gBox(30, 0.09, 22, 300, GROUND + 0.01, 190), mat('#2f6a86', { roughness: 0.6 })); // aquatic
  // Tanah kampung tepi sungai
  patch.add(gBox(96, 0.05, 34, -66, GROUND + 0.004, bankS(-66) + 18), mDirt);
  patch.add(gBox(88, 0.05, 30, 42, GROUND + 0.004, bankS(42) + 16), mDirt);
  patch.add(gBox(70, 0.05, 28, -196, GROUND + 0.004, bankN(-196) - 20), mDirt);
  patch.build(g, { castShadow: false, receiveShadow: true, name: 'patches' });

  /* ---------------- papan nama maket ---------------- */
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 34),
    mat('#15181c', { map: makeNamePlate(), roughness: 0.6, metalness: 0.2 })
  );
  plate.position.set(0, -3.4, BOUND_Z + 0.25);
  plate.name = 'papan-nama';
  g.add(plate);

  /* ---------------- meja/latar jauh ---------------- */
  const far = new THREE.Mesh(
    new THREE.PlaneGeometry(5200, 5200),
    mat('#2b3138', { roughness: 1 })
  );
  far.rotation.x = -Math.PI / 2;
  far.position.y = -10.5;
  far.name = 'latar';
  far.receiveShadow = false;
  g.add(far);

  return { group: g, railPts, quayLamps: railPts };
}

/** terjemahkan geometri lalu putar searah sumbu Y (untuk objek mengikuti tepian) */
function xform2(geo, x, y, z, rotY) {
  const m = new THREE.Matrix4().makeRotationY(rotY);
  geo.applyMatrix4(m);
  geo.translate(x, y, z);
  return geo;
}
