import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Kit, GROUND, mat, gBox, gCyl, group, rnd } from '../lib/util.js';
import { litMaterial, nightLight } from './lights.js';
import { bankN, bankS } from './layout.js';

const mConc = mat('#c9c5ba', { roughness: 0.9 });
const mSteel = mat('#8d9298', { roughness: 0.45, metalness: 0.5 });
const mRed = mat('#b0392c', { roughness: 0.6 });
const mGlass = mat('#2a3d49', { roughness: 0.18, metalness: 0.5 });
const litStrip = litMaterial('#dff2ff', '#8fd4ff', 2.6, { roughness: 0.4 });

function paint(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** Rute LRT: Bandara SMB II — Jembatan Ampera — Jakabaring. */
export function lrtCurve() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(300, 9.5, -300),
    new THREE.Vector3(215, 9.0, -262),
    new THREE.Vector3(140, 8.4, -212),
    new THREE.Vector3(78, 8.0, -150),
    new THREE.Vector3(34, 8.0, -104),
    new THREE.Vector3(12, 9.6, -54),
    new THREE.Vector3(0, 11.4, 0),
    new THREE.Vector3(-8, 10.0, 52),
    new THREE.Vector3(-12, 8.2, 104),
    new THREE.Vector3(6, 8.0, 156),
    new THREE.Vector3(64, 8.2, 196),
    new THREE.Vector3(140, 8.6, 214),
    new THREE.Vector3(214, 9.2, 226),
    new THREE.Vector3(268, 9.6, 250),
  ], false, 'catmullrom', 0.35);
}

export function buildLRT(parent) {
  const g = group('lrt', parent);
  const curve = lrtCurve();
  const LEN = curve.getLength();
  const kit = new Kit();

  /* ---- gelagar layang ---- */
  const SEG = 220;
  const step = LEN / SEG;
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), tan = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < SEG; i++) {
    const t0 = i / SEG, t1 = (i + 1) / SEG;
    curve.getPointAt(t0, p0);
    curve.getPointAt(t1, p1);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    tan.subVectors(p1, p0).normalize();
    m4.lookAt(new THREE.Vector3(), tan, up);
    const seg = new THREE.BoxGeometry(3.0, 1.0, step * 1.02);
    seg.applyMatrix4(m4);
    seg.translate(mid.x, mid.y - 0.6, mid.z);
    kit.add(seg, mConc);
    // pagar pengaman
    const rail = new THREE.BoxGeometry(3.2, 0.5, step * 1.02);
    rail.applyMatrix4(m4);
    rail.translate(mid.x, mid.y - 0.05, mid.z);
    kit.add(rail, mSteel);
    if (i % 14 === 0) {
      const st = new THREE.BoxGeometry(3.3, 0.12, step * 6);
      st.applyMatrix4(m4);
      st.translate(mid.x, mid.y + 0.22, mid.z);
      kit.add(st, litStrip);
    }
  }

  /* ---- pilar ---- */
  for (let i = 4; i < SEG; i += 9) {
    const t = i / SEG;
    curve.getPointAt(t, p0);
    const inWater = p0.z > bankN(p0.x) && p0.z < bankS(p0.x);
    const baseY = inWater ? -1.0 : GROUND;
    const h = p0.y - 0.9 - baseY;
    if (h < 1) continue;
    kit.add(gCyl(0.7, 1.1, h, 10, p0.x, baseY, p0.z), mConc);
    kit.add(gBox(3.4, 0.7, 3.4, p0.x, baseY + h - 0.7, p0.z), mConc);
    if (inWater) kit.add(gBox(4.2, 1.6, 4.2, p0.x, -1.2, p0.z), mConc);
  }

  /* ---- stasiun ---- */
  const stations = [0.16, 0.34, 0.62, 0.86];
  for (const t of stations) {
    curve.getPointAt(t, p0);
    curve.getTangentAt(t, tan);
    m4.lookAt(new THREE.Vector3(), tan, up);
    const plat = new THREE.BoxGeometry(9.5, 0.7, 16);
    plat.applyMatrix4(m4);
    plat.translate(p0.x, p0.y + 0.1, p0.z);
    kit.add(plat, mConc);
    const canopy = new THREE.BoxGeometry(10.5, 0.5, 17);
    canopy.applyMatrix4(m4);
    canopy.translate(p0.x, p0.y + 4.4, p0.z);
    kit.add(canopy, mRed);
    for (const s of [-1, 1]) {
      const col = new THREE.BoxGeometry(0.5, 4.0, 0.5);
      col.applyMatrix4(m4);
      col.translate(p0.x + s * 4.2, p0.y + 2.2, p0.z);
      kit.add(col, mSteel);
    }
  }
  kit.build(g, { castShadow: true, receiveShadow: true, name: 'lrt-jalur' });

  /* ---- rangkaian kereta ---- */
  const carGeo = (() => {
    const parts = [
      paint(gBox(2.6, 2.4, 12, 0, 0.4, 0), '#e9e7e0'),
      paint(gBox(2.7, 0.7, 12.2, 0, 0.05, 0), '#b0392c'),
      paint(gBox(2.3, 1.1, 10.5, 0, 1.6, 0), '#2a3d49'),
      paint(gBox(2.65, 0.22, 12.3, 0, 2.85, 0), '#c9c5ba'),
    ];
    const nose = new THREE.CylinderGeometry(1.3, 1.1, 2.4, 8);
    nose.rotateX(Math.PI / 2);
    nose.scale(1, 0.85, 1);
    nose.translate(0, 1.5, 7.0);
    parts.push(paint(nose, '#e9e7e0'));
    return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false);
  })();
  const trainMat = mat('#ffffff', { vertexColors: true, roughness: 0.5 });

  const train = new THREE.Group();
  train.name = 'kereta-lrt';
  const cars = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(carGeo, trainMat);
    m.castShadow = true;
    train.add(m);
    cars.push(m);
  }
  g.add(train);

  const headlight = nightLight('#fff2d0', 40, 60, 2);
  train.add(headlight);

  const CAR_GAP = 12.6;
  const look = new THREE.Vector3();

  function update(t, dt, speed = 26) {
    const u = ((t * speed) / LEN) % 1;
    for (let i = 0; i < cars.length; i++) {
      const du = (i * CAR_GAP) / LEN;
      let uu = u - du;
      if (uu < 0) uu += 1;
      const p = curve.getPointAt(uu);
      cars[i].position.set(p.x, p.y + 0.55, p.z);
      curve.getPointAt((uu + 0.01) % 1, look);
      cars[i].lookAt(look.x, p.y + 0.55, look.z);
    }
    const hp = cars[0].position;
    headlight.position.set(0, 1.4, 7.6);
  }

  return { group: g, curve, update, train };
}
