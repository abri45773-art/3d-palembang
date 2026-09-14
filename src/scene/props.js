import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Kit, GROUND, mat, gBox, gCyl, group, rnd, rand, pick, chance, clamp } from '../lib/util.js';
import { litMaterial } from './lights.js';
import { makeWake } from '../lib/textures.js';
import { ROADS, bankN, bankS, BOUND_X } from './layout.js';

/* --------------------------- util warna --------------------------- */
function paint(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
function mergeColored(list) {
  const all = list.map((g) => (g.index ? g.toNonIndexed() : g));
  return mergeGeometries(all, false);
}

const mVertex = mat('#ffffff', { vertexColors: true, roughness: 0.75 });

/* ================================================================== *
 *  POHON
 * ================================================================== */
const mTrunk = mat('#6b5335', { roughness: 0.95 });
const mLeaf1 = mat('#4f7a3a', { roughness: 1 });
const mLeaf2 = mat('#5f8c42', { roughness: 1 });
const mPalm = mat('#3f6f37', { roughness: 1 });

export function buildTrees(parent) {
  const g = group('pepohonan', parent);
  const kit = new Kit();

  const roundTree = (x, z, s = 1) => {
    kit.add(gCyl(0.22 * s, 0.3 * s, 1.8 * s, 6, x, GROUND, z), mTrunk);
    const a = new THREE.SphereGeometry(1.5 * s, 9, 7);
    a.translate(x, GROUND + 2.6 * s, z);
    kit.add(a, rnd() > 0.5 ? mLeaf1 : mLeaf2);
    if (rnd() > 0.4) {
      const b = new THREE.SphereGeometry(1.05 * s, 8, 6);
      b.translate(x + (rnd() - 0.5) * 1.4 * s, GROUND + 3.4 * s, z + (rnd() - 0.5) * 1.4 * s);
      kit.add(b, mLeaf2);
    }
  };

  const palmTree = (x, z, s = 1) => {
    const lean = (rnd() - 0.5) * 0.9;
    for (let i = 0; i < 4; i++) {
      kit.add(gCyl(0.2 * s, 0.28 * s, 1.5 * s, 6, x + lean * i * 0.3, GROUND + i * 1.45 * s, z), mTrunk);
    }
    const topY = GROUND + 5.6 * s;
    const tx = x + lean * 1.2, tz = z;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rnd() * 0.3;
      const fr = new THREE.ConeGeometry(0.32 * s, 3.4 * s, 4, 1);
      fr.scale(1, 1, 0.42);
      fr.translate(0, 1.7 * s, 0);
      fr.rotateZ(-1.15 - rnd() * 0.25);
      fr.rotateY(a);
      fr.translate(tx, topY, tz);
      kit.add(fr, mPalm);
    }
    const nut = new THREE.SphereGeometry(0.42 * s, 7, 6);
    nut.translate(tx, topY - 0.3 * s, tz);
    kit.add(nut, mat('#7a6a3a', { roughness: 1 }));
  };

  // deretan palem di sepanjang tepian sungai
  for (let x = -BOUND_X + 12; x <= BOUND_X - 12; x += 17) {
    const zn = bankN(x) - 7 - rnd() * 5;
    const zs = bankS(x) + 7 + rnd() * 5;
    if (rnd() > 0.18) palmTree(x + rnd() * 5, zn, 0.9 + rnd() * 0.5);
    if (rnd() > 0.25) palmTree(x + rnd() * 5, zs, 0.9 + rnd() * 0.5);
  }
  // pohon peneduh jalan & taman
  for (const r of ROADS.h) {
    for (let x = r.from + 8; x < r.to - 8; x += 19) {
      if (rnd() > 0.55) continue;
      const z = r.at + (rnd() > 0.5 ? 1 : -1) * (r.w / 2 + 2.4);
      roundTree(x, z, 0.8 + rnd() * 0.4);
    }
  }
  for (const r of ROADS.v) {
    for (let z = r.from + 8; z < r.to - 8; z += 21) {
      if (rnd() > 0.6) continue;
      roundTree(r.at + (rnd() > 0.5 ? 1 : -1) * (r.w / 2 + 2.4), z, 0.8 + rnd() * 0.4);
    }
  }
  // hutan kota Kambang Iwak & Jakabaring
  for (let i = 0; i < 120; i++) {
    const inKI = i < 55;
    const cx = inKI ? 150 : 232, cz = inKI ? -196 : 200;
    const rr = inKI ? 40 : 78;
    const a = rnd() * Math.PI * 2;
    const rad = rr * (0.6 + rnd() * 0.5);
    const x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad * 0.75;
    if (Math.hypot(x - cx, z - cz) < (inKI ? 25 : 40)) continue;
    roundTree(x, z, 0.8 + rnd() * 0.7);
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'pohon' });
  return { group: g };
}

/* ================================================================== *
 *  LAMPU JALAN
 * ================================================================== */
export function buildStreetLamps(parent, railPts = []) {
  const g = group('lampu-jalan', parent);
  const kit = new Kit();
  const mPole = mat('#4a4f54', { roughness: 0.5, metalness: 0.5 });
  const mHead = litMaterial('#fff3d6', '#ffcf8a', 3.2, { roughness: 0.4 });

  const lamp = (x, z, y = GROUND, dirZ = 1) => {
    kit.add(gCyl(0.13, 0.19, 4.6, 6, x, y, z), mPole);
    const arm = gBox(1.5, 0.12, 0.12, 0, y + 4.6, 0);
    arm.translate(x, 0, z + dirZ * 0.75);
    kit.add(arm, mPole);
    kit.add(gBox(0.7, 0.22, 0.34, x, y + 4.42, z + dirZ * 1.45), mHead);
  };

  for (const r of ROADS.h) {
    for (let x = r.from + 10; x < r.to - 10; x += 26) {
      lamp(x, r.at - r.w / 2 - 1.8, GROUND, -1);
      if (r.w >= 5) lamp(x + 13, r.at + r.w / 2 + 1.8, GROUND, 1);
    }
  }
  for (const r of ROADS.v) {
    for (let z = r.from + 10; z < r.to - 10; z += 30) lamp(r.at + r.w / 2 + 1.8, z, GROUND, 1);
  }
  // lampu kade tepian sungai
  for (const [x, , z] of railPts) {
    if (Math.abs(((x / 6) | 0) % 7) !== 0) continue;
    lamp(x, z, 3.3, z < 0 ? 1 : -1);
  }
  kit.build(g, { castShadow: false, receiveShadow: false, name: 'lampu' });
  return { group: g };
}

/* ================================================================== *
 *  LALU LINTAS
 * ================================================================== */
const CAR_COLORS = ['#c8452f', '#2f5f8f', '#d8d4c8', '#2f2f33', '#c9a227', '#4a7a4a', '#8a4a86', '#e0e4e8', '#7a7f85'];

function carGeometry(color) {
  const parts = [
    paint(gBox(1.5, 0.7, 3.2, 0, 0.28, 0), color),
    paint(gBox(1.3, 0.62, 1.7, 0, 0.98, -0.15), '#22303a'),
    paint(gBox(1.55, 0.16, 0.5, 0, 0.86, 1.35), '#e8e6dc'),
  ];
  for (const [wx, wz] of [[-0.72, 1.0], [0.72, 1.0], [-0.72, -1.0], [0.72, -1.0]]) {
    const wheel = new THREE.CylinderGeometry(0.3, 0.3, 0.24, 8);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(wx, 0.3, wz);
    parts.push(paint(wheel, '#1a1a1c'));
  }
  return mergeColored(parts);
}

function truckGeometry(color) {
  const parts = [
    paint(gBox(1.8, 1.0, 2.0, 0, 0.4, 1.6), color),
    paint(gBox(1.75, 0.7, 1.2, 0, 1.4, 1.9), '#22303a'),
    paint(gBox(2.0, 2.0, 4.0, 0, 0.5, -1.6), '#c9c4b6'),
  ];
  for (const [wx, wz] of [[-0.9, 1.6], [0.9, 1.6], [-0.9, -1.4], [0.9, -1.4], [-0.9, -3.0], [0.9, -3.0]]) {
    const wheel = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(wx, 0.4, wz);
    parts.push(paint(wheel, '#1a1a1c'));
  }
  return mergeColored(parts);
}

export function buildTraffic(parent) {
  const g = group('lalu-lintas', parent);
  const cars = [];
  const geoCar = CAR_COLORS.map((c) => carGeometry(c));
  const geoTruck = [truckGeometry('#b8b2a4'), truckGeometry('#8f4a3a')];

  const lanes = [];
  for (const r of ROADS.h) {
    lanes.push({ axis: 'h', at: r.at - r.w * 0.22, from: r.from, to: r.to, dir: 1, w: r.w });
    if (r.w >= 5) lanes.push({ axis: 'h', at: r.at + r.w * 0.22, from: r.from, to: r.to, dir: -1, w: r.w });
  }
  for (const r of ROADS.v) {
    lanes.push({ axis: 'v', at: r.at - r.w * 0.22, from: r.from, to: r.to, dir: -1, w: r.w });
    if (r.w >= 5) lanes.push({ axis: 'v', at: r.at + r.w * 0.22, from: r.from, to: r.to, dir: 1, w: r.w });
  }

  for (let i = 0; i < 78; i++) {
    const lane = lanes[Math.floor(rnd() * lanes.length)];
    const isTruck = rnd() < 0.14;
    const mesh = new THREE.Mesh(isTruck ? geoTruck[Math.floor(rnd() * geoTruck.length)] : geoCar[Math.floor(rnd() * geoCar.length)], mVertex);
    mesh.castShadow = true;
    const t = rnd();
    const car = {
      mesh, lane, isTruck,
      p: lane.from + t * (lane.to - lane.from),
      speed: (isTruck ? 5 : 8 + rnd() * 8) * lane.dir,
    };
    mesh.position.set(
      lane.axis === 'h' ? car.p : lane.at,
      GROUND + 0.14,
      lane.axis === 'h' ? lane.at : car.p
    );
    mesh.rotation.y = lane.axis === 'h' ? (lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : lane.dir > 0 ? 0 : Math.PI;
    g.add(mesh);
    cars.push(car);
  }

  return {
    group: g,
    update(dt) {
      for (const c of cars) {
        c.p += c.speed * dt;
        const { from, to } = c.lane;
        if (c.p > to + 6) c.p = from - 6;
        if (c.p < from - 6) c.p = to + 6;
        if (c.lane.axis === 'h') c.mesh.position.x = c.p;
        else c.mesh.position.z = c.p;
      }
    },
    setVisible(v) { g.visible = v; },
  };
}

/* ================================================================== *
 *  KETEK, GETEK & KAPAL DI SUNGAI MUSI
 * ================================================================== */
function ketekGeometry(bodyColor, roofColor) {
  const parts = [
    paint(gBox(1.7, 0.7, 5.4, 0, 0.25, 0), bodyColor),
    paint(gBox(1.4, 0.5, 2.6, 0, 0.95, -0.3), roofColor),
    paint(gBox(1.9, 0.12, 2.9, 0, 1.5, -0.3), '#8a6a3a'),
  ];
  for (const sx of [-1, 1]) parts.push(paint(gBox(0.1, 1.4, 0.1, sx * 0.8, 0.55, -0.3), '#6b5335'));
  const bow = new THREE.ConeGeometry(0.85, 1.6, 4);
  bow.rotateX(Math.PI / 2);
  bow.scale(1, 0.55, 1);
  bow.translate(0, 0.4, 3.4);
  parts.push(paint(bow, bodyColor));
  return mergeColored(parts);
}

function bargeGeometry() {
  const parts = [
    paint(gBox(5.0, 1.4, 16, 0, 0.5, 0), '#5a4a3a'),
    paint(gBox(4.4, 1.6, 8, 0, 1.9, -2), '#3b3b3b'),
    paint(gBox(2.6, 1.8, 3.0, 0, 1.9, 5.5), '#c8c2b4'),
    paint(gBox(0.5, 1.6, 0.5, 0, 3.7, 5.5), '#8a8a86'),
  ];
  return mergeColored(parts);
}

export function buildBoats(parent) {
  const g = group('perahu', parent);
  const boats = [];
  const wakeTex = makeWake();
  const wakeMat = new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, opacity: 0.4, depthWrite: false });
  const geos = [
    ketekGeometry('#b8452f', '#3f6f8f'), ketekGeometry('#2f5f8f', '#c9a227'),
    ketekGeometry('#d8d4c8', '#8a4a86'), ketekGeometry('#3f7a4a', '#b8452f'),
  ];
  const bargeGeo = bargeGeometry();

  for (let i = 0; i < 16; i++) {
    const dir = rnd() > 0.5 ? 1 : -1;
    const z = -40 + rnd() * 84;
    const isBarge = i > 12;
    const mesh = new THREE.Mesh(isBarge ? bargeGeo : geos[i % geos.length], mVertex);
    mesh.castShadow = true;
    mesh.scale.setScalar(isBarge ? 1 : 0.8 + rnd() * 0.5);
    g.add(mesh);
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(isBarge ? 9 : 5, isBarge ? 20 : 11), wakeMat);
    wake.rotation.x = -Math.PI / 2;
    wake.position.y = 0.22;
    g.add(wake);
    boats.push({
      mesh, wake, dir, z,
      x: -460 + rnd() * 920,
      speed: (isBarge ? 2.4 : 3.4 + rnd() * 3.4) * dir,
      phase: rnd() * 10,
      isBarge,
    });
  }

  return {
    group: g,
    update(t, dt) {
      for (const b of boats) {
        b.x += b.speed * dt;
        if (b.x > 480) b.x = -480;
        if (b.x < -480) b.x = 480;
        const bob = Math.sin(t * 1.1 + b.phase) * 0.09;
        b.mesh.position.set(b.x, 0.16 + bob, b.z + Math.sin(t * 0.3 + b.phase) * 1.4);
        b.mesh.rotation.y = b.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        b.mesh.rotation.z = Math.sin(t * 0.9 + b.phase) * 0.03;
        b.wake.position.set(b.x - b.dir * (b.isBarge ? 12 : 6.5), 0.2, b.z);
        b.wake.rotation.z = b.dir > 0 ? 0 : Math.PI;
      }
    },
    setVisible(v) { g.visible = v; },
  };
}
