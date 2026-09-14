import * as THREE from 'three';
import { mat, lampMat, box, cyl, cone, gableRoof, limasRoof, pick, PALETTE as P } from '../lib/kit.js';
import { groundHeight, scatterLand, SIZE } from '../world/terrain.js';
import { riverZ, riverHalf, riverAngle, distToBank } from '../world/river.js';

/* ================================================================== */
/*  VEGETASI — instanced mesh agar ribuan pohon tetap ringan          */
/* ================================================================== */
export function buildVegetation(rng, avoid) {
  const g = new THREE.Group();

  const spots = scatterLand(rng, 620, { minBank: 4, avoid, minY: 0.2, area: SIZE * 0.47 });

  /* --- pohon rimbun (batang + mahkota icosahedron) --- */
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 0);

  const trunkMat = mat(P.woodDark, { roughness: 0.95 });
  const crownMats = [
    mat(P.foliage, { flat: true, roughness: 0.92 }),
    mat(P.foliageDark, { flat: true, roughness: 0.92 }),
    mat(P.foliageLight, { flat: true, roughness: 0.92 }),
  ];

  const leafy = spots.filter((_, i) => i % 3 !== 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, leafy.length);
  const crowns = crownMats.map((m) => ({ mat: m, list: [] }));
  leafy.forEach((p, i) => crowns[i % 3].list.push(p));

  const dummy = new THREE.Object3D();
  leafy.forEach((p, i) => {
    const h = 2.4 + rng() * 3.4;
    dummy.position.set(p[0], p[1] - 0.2, p[2]);
    dummy.scale.set(0.8 + rng() * 0.5, h, 0.8 + rng() * 0.5);
    dummy.rotation.y = rng() * 6.28;
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
  });
  trunks.castShadow = true;
  trunks.receiveShadow = true;
  g.add(trunks);

  for (const c of crowns) {
    const im = new THREE.InstancedMesh(crownGeo, c.mat, c.list.length);
    c.list.forEach((p, i) => {
      const s = 1.7 + rng() * 1.9;
      dummy.position.set(p[0] + (rng() - 0.5) * 0.6, p[1] + 2.8 + rng() * 2.4, p[2] + (rng() - 0.5) * 0.6);
      dummy.scale.set(s, s * (0.75 + rng() * 0.5), s);
      dummy.rotation.set(rng(), rng() * 6.28, rng() * 0.4);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    g.add(im);
  }

  /* --- pohon kelapa (batang miring + pelepah) --- */
  const palmSpots = spots.filter((_, i) => i % 3 === 0);
  const palmTrunkGeo = new THREE.CylinderGeometry(0.17, 0.32, 1, 6);
  palmTrunkGeo.translate(0, 0.5, 0);
  const palmTrunks = new THREE.InstancedMesh(palmTrunkGeo, mat('#8d7350', { roughness: 0.92 }), palmSpots.length);
  const frondGeo = new THREE.BoxGeometry(1, 0.12, 0.5);
  frondGeo.translate(0.5, 0, 0);
  const frondMat = mat(P.foliageDark, { flat: true, roughness: 0.9 });
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, palmSpots.length * 7);

  let fi = 0;
  palmSpots.forEach((p, i) => {
    const h = 5.5 + rng() * 4.5;
    const tilt = (rng() - 0.5) * 0.28;
    const dir = rng() * 6.28;
    dummy.position.set(p[0], p[1] - 0.2, p[2]);
    dummy.scale.set(1, h, 1);
    dummy.rotation.set(Math.sin(dir) * tilt, 0, Math.cos(dir) * tilt);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);

    const tx = p[0] + Math.cos(dir) * tilt * h * 0.5;
    const tz = p[2] + Math.sin(dir) * tilt * h * 0.5;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * 6.28 + rng() * 0.3;
      const len = 2.6 + rng() * 1.4;
      dummy.position.set(tx, p[1] - 0.2 + h, tz);
      dummy.scale.set(len, 1, 0.8 + rng() * 0.5);
      dummy.rotation.set(0, -a, -0.32 - rng() * 0.2);
      dummy.updateMatrix();
      fronds.setMatrixAt(fi++, dummy.matrix);
    }
  });
  palmTrunks.castShadow = true;
  fronds.castShadow = true;
  g.add(palmTrunks, fronds);

  /* --- semak & rumput tinggi di tepian --- */
  const bankSpots = scatterLand(rng, 260, { minBank: 0.5, maxBank: 7, avoid, minY: -0.5, area: SIZE * 0.46 });
  const bushGeo = new THREE.IcosahedronGeometry(1, 0);
  const bushMat = mat('#5f8a45', { flat: true, roughness: 0.95 });
  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bankSpots.length);
  bankSpots.forEach((p, i) => {
    const s = 0.6 + rng() * 1.1;
    dummy.position.set(p[0], Math.max(p[1], 0.1) + s * 0.4, p[2]);
    dummy.scale.set(s * 1.5, s * 0.9, s * 1.5);
    dummy.rotation.set(rng() * 0.4, rng() * 6.28, rng() * 0.4);
    dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix);
  });
  bushes.castShadow = true;
  bushes.receiveShadow = true;
  g.add(bushes);

  return g;
}

/* ================================================================== */
/*  KAMPUNG — rumah panggung & rumah biasa yang tersebar              */
/* ================================================================== */
export function buildKampung(rng, avoid) {
  const g = new THREE.Group();

  const wallMats = [
    mat('#d9cdb4', { roughness: 0.92 }),
    mat('#c9b99a', { roughness: 0.92 }),
    mat('#bda98a', { roughness: 0.92 }),
    mat('#d2c4a6', { roughness: 0.92 }),
    mat(P.wood, { roughness: 0.92 }),
    mat(P.woodLight, { roughness: 0.92 }),
  ];
  const roofMats = [
    mat('#8d5a44', { roughness: 0.9 }),
    mat('#6d5a42', { roughness: 0.9 }),
    mat('#7a4a3a', { roughness: 0.9 }),
    mat('#8a8f8c', { roughness: 0.82 }),
    mat('#5c6e5a', { roughness: 0.88 }),
  ];
  const stiltMat = mat(P.woodDark, { roughness: 0.94 });
  const winMat = lampMat('#ffd79a', '#4e3c2a');

  const spots = scatterLand(rng, 190, { minBank: 8, maxBank: 70, avoid, minY: 0.6, area: SIZE * 0.42 });

  for (const [x, y, z] of spots) {
    const h = new THREE.Group();
    h.position.set(x, y, z);
    h.rotation.y = rng() * Math.PI * 2;

    const w = 4.2 + rng() * 3.2;
    const d = 4.0 + rng() * 3.0;
    const onStilts = distToBank(x, z) < 26 || rng() > 0.62;
    const stiltH = onStilts ? 1.0 + rng() * 1.6 : 0;
    const wallM = pick(rng, wallMats);
    const roofM = pick(rng, roofMats);

    if (onStilts) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          h.add(cyl(0.17, 0.2, stiltH + 0.4, sx * (w / 2 - 0.5), -0.3, sz * (d / 2 - 0.5), stiltMat, 5));
        }
      }
      h.add(cyl(0.17, 0.2, stiltH + 0.4, 0, -0.3, 0, stiltMat, 5));
    }

    const bodyH = 2.6 + rng() * 1.2;
    h.add(box(w, bodyH, d, 0, stiltH, 0, wallM));

    // jendela
    for (const sz of [-1, 1]) {
      if (rng() > 0.3) h.add(box(w * 0.36, 1.0, 0.16, (rng() - 0.5) * w * 0.4, stiltH + 0.9, sz * d / 2, winMat));
    }
    // pintu
    h.add(box(0.9, 1.7, 0.16, w * 0.2, stiltH, d / 2, mat('#6b4c30', { roughness: 0.85 })));

    // atap
    if (rng() > 0.4) {
      const r = gableRoof(w + 1.1, 1.2 + rng() * 0.9, d + 1.1, roofM);
      r.position.set(-(w + 1.1) / 2, stiltH + bodyH, 0);
      h.add(r);
    } else {
      const r = limasRoof(w + 1.3, d + 1.3, 1.6 + rng() * 0.8, 0.35, roofM);
      r.position.y = stiltH + bodyH;
      h.add(r);
    }

    // tangga bagi rumah panggung
    if (onStilts && stiltH > 1.2) {
      for (let i = 0; i < 3; i++) {
        h.add(box(1.1, 0.16, 0.5, w * 0.2, i * (stiltH / 3), d / 2 + 0.9 - i * 0.45, stiltMat));
      }
    }

    g.add(h);
  }

  return g;
}

/* ================================================================== */
/*  JALAN TEPIAN (riverside road) + lampu                             */
/* ================================================================== */
export function buildRiverRoads() {
  const g = new THREE.Group();
  const asphalt = mat('#4c5155', { roughness: 0.98 });
  const kerb = mat('#a8a08e', { roughness: 0.95 });
  const lineM = mat('#ddd6c2', { roughness: 0.9 });
  const poleM = mat('#5c6165', { roughness: 0.6, metalness: 0.3 });
  const head = lampMat('#ffd9a0', '#d6d0c2');

  const ROAD_W = 7.5;
  const OFFSET = 11;  // jarak dari tepi sungai

  for (const side of [-1, 1]) {
    const segs = [];
    for (let x = -140; x <= 140; x += 5) {
      const z = riverZ(x) + side * (riverHalf(x) + OFFSET);
      segs.push(new THREE.Vector3(x, groundHeight(x, z) + 0.28, z));
    }
    for (let i = 0; i < segs.length - 1; i++) {
      const a = segs[i], b = segs[i + 1];
      const len = a.distanceTo(b);
      const mid = a.clone().lerp(b, 0.5);
      const ang = Math.atan2(b.z - a.z, b.x - a.x);

      const slab = new THREE.Mesh(new THREE.BoxGeometry(len * 1.04, 0.3, ROAD_W), asphalt);
      slab.position.copy(mid);
      slab.rotation.y = -ang;
      slab.receiveShadow = true;
      g.add(slab);

      const k = new THREE.Mesh(new THREE.BoxGeometry(len * 1.04, 0.22, ROAD_W + 1.8), kerb);
      k.position.set(mid.x, mid.y - 0.1, mid.z);
      k.rotation.y = -ang;
      k.receiveShadow = true;
      g.add(k);

      if (i % 2 === 0) {
        const mk = new THREE.Mesh(new THREE.BoxGeometry(len * 0.5, 0.1, 0.3), lineM);
        mk.position.set(mid.x, mid.y + 0.17, mid.z);
        mk.rotation.y = -ang;
        g.add(mk);
      }

      if (i % 6 === 0) {
        const lx = mid.x, lz = mid.z + side * (ROAD_W / 2 + 1.0);
        g.add(cyl(0.13, 0.17, 5.0, lx, mid.y, lz, poleM, 6));
        g.add(box(1.2, 0.13, 0.13, lx, mid.y + 5.0, lz - side * 0.6, poleM));
        g.add(box(0.95, 0.26, 0.4, lx, mid.y + 4.85, lz - side * 1.2, head));
      }
    }
  }

  return g;
}

/* ================================================================== */
/*  KENDARAAN — mobil sederhana yang bergerak di jalan tepian         */
/* ================================================================== */
export function buildTraffic(rng) {
  const cars = [];
  const g = new THREE.Group();
  const colors = ['#d24b3a', '#e8e2d4', '#3c6ea8', '#2f3438', '#c9a23f', '#5f8a5a', '#a8a29a'];
  const glassM = mat('#5d7480', { roughness: 0.25, metalness: 0.4 });
  const tyre = mat('#22262a', { roughness: 0.95 });
  const lightF = lampMat('#fff3cf', '#e8e2d0');
  const lightR = lampMat('#ff5a3c', '#a83a2a');

  const N = 26;
  for (let i = 0; i < N; i++) {
    const c = new THREE.Group();
    const col = mat(pick(rng, colors), { roughness: 0.55, metalness: 0.25 });
    const isTruck = rng() > 0.76;
    const L = isTruck ? 5.2 : 3.4;
    const W = 1.7;

    c.add(box(L, 0.85, W, 0, 0.42, 0, col));
    if (isTruck) {
      c.add(box(L * 0.52, 1.5, W * 0.98, -L * 0.2, 1.27, 0, mat('#cfc8b6', { roughness: 0.8 })));
      c.add(box(1.3, 1.0, W * 0.96, L * 0.32, 1.27, 0, col));
      c.add(box(0.2, 0.6, W * 0.8, L * 0.32 + 0.6, 1.45, 0, glassM));
    } else {
      c.add(box(L * 0.52, 0.78, W * 0.92, -L * 0.04, 1.27, 0, col));
      c.add(box(L * 0.5, 0.5, W * 0.94, -L * 0.04, 1.4, 0, glassM));
    }
    c.add(box(0.18, 0.3, 0.5, L / 2, 0.55, W / 3, lightF));
    c.add(box(0.18, 0.3, 0.5, L / 2, 0.55, -W / 3, lightF));
    c.add(box(0.16, 0.25, 0.4, -L / 2, 0.55, W / 3, lightR));
    c.add(box(0.16, 0.25, 0.4, -L / 2, 0.55, -W / 3, lightR));

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wh = cyl(0.36, 0.36, 0.26, sx * L * 0.32, 0.36, sz * (W / 2), tyre, 9);
        wh.rotation.x = Math.PI / 2;
        wh.position.y = 0.36;
        c.add(wh);
      }
    }

    const side = i % 2 === 0 ? 1 : -1;
    const dir = rng() > 0.5 ? 1 : -1;
    c.userData = {
      side,
      dir,
      x: -140 + rng() * 280,
      speed: (7 + rng() * 8) * dir,
      lane: (rng() - 0.5) * 2.6,
    };
    cars.push(c);
    g.add(c);
  }

  g.userData.cars = cars;
  g.userData.update = (dt) => {
    for (const c of cars) {
      const u = c.userData;
      u.x += u.speed * dt;
      if (u.x > 145) u.x = -145;
      if (u.x < -145) u.x = 145;
      const z = riverZ(u.x) + u.side * (riverHalf(u.x) + 11) + u.lane;
      const y = groundHeight(u.x, z) + 0.4;
      c.position.set(u.x, y, z);
      const ang = riverAngle(u.x);
      c.rotation.y = -(u.speed > 0 ? ang : ang + Math.PI);
    }
  };

  return g;
}
