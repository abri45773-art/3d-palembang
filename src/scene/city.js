import * as THREE from 'three';
import { Kit, GROUND, mat, gBox, gCyl, gGable, boxUV, rnd, rand, pick, chance } from '../lib/util.js';
import { makeFacade, makeRoof } from '../lib/textures.js';
import { litMaterial } from './lights.js';
import { BOUND_X, BOUND_Z, bankN, bankS, inZone, nearestRoad } from './layout.js';

const ROOF_COLORS = ['#a4573c', '#8d4433', '#6d6a5e', '#7d8272', '#96603f'];
const AWNING = ['#b8452f', '#2f6f8f', '#3f7a4a', '#c9a227', '#7a4a86', '#d0d0c8'];

/** Buat material fasad + peta jendela menyala. */
function facadeMaterials() {
  const defs = [
    { base: '#e6dcc4', glass: '#2c3b46', seed: 11 },
    { base: '#d9cbb0', glass: '#33414a', seed: 22 },
    { base: '#cfe0dd', glass: '#2b3a42', seed: 33 },
    { base: '#e3cdb4', glass: '#3a3a3a', seed: 44 },
    { base: '#c8c2b4', glass: '#2e3d47', seed: 55 },
    { base: '#ddd6e0', glass: '#333844', seed: 66 },
  ];
  return defs.map((d) => {
    const { map, emissiveMap } = makeFacade({ base: d.base, glass: d.glass, seed: d.seed, cols: 4, rows: 4, litChance: 0.5 });
    return litMaterial('#ffffff', '#ffb765', 1.9, { map, emissiveMap, roughness: 0.88, metalness: 0 });
  });
}

export function buildCity(parent) {
  const g = new THREE.Group();
  g.name = 'kota';
  parent.add(g);

  const kit = new Kit();
  const facades = facadeMaterials();
  const roofs = ROOF_COLORS.map((c) => mat(c, { map: makeRoof(c), roughness: 0.9 }));
  const mParapet = mat('#cfc7b6', { roughness: 0.9 });
  const mSlab = mat('#b9b2a3', { roughness: 0.95 });
  const mTank = mat('#4a6b78', { roughness: 0.5, metalness: 0.3 });
  const mAC = mat('#c9cbcc', { roughness: 0.7 });

  const cityCenters = [
    { x: 20, z: -150, r: 210, w: 1 },     // pusat kota Ilir
    { x: 40, z: 170, r: 200, w: 0.72 },   // pusat Ulu
    { x: 240, z: 190, r: 120, w: 0.4 },   // Jakabaring
    { x: -220, z: -140, r: 140, w: 0.42 },
  ];
  const densityAt = (x, z) => {
    let d = 0.12;
    for (const c of cityCenters) {
      const k = Math.hypot((x - c.x) / c.r, (z - c.z) / (c.r * 0.8));
      d += c.w * Math.max(0, 1 - k) * 0.85;
    }
    return Math.min(0.94, d);
  };

  let count = 0;
  const step = 9.5;
  for (let x = -BOUND_X + 12; x <= BOUND_X - 12; x += step) {
    for (let z = -BOUND_Z + 12; z <= BOUND_Z - 12; z += step) {
      const onNorth = z < bankN(x) - 11;
      const onSouth = z > bankS(x) + 11;
      if (!onNorth && !onSouth) continue;
      if (inZone(x, z)) continue;
      const road = nearestRoad(x, z);
      if (road.dist < 7.2) continue;
      const dens = densityAt(x, z);
      const p = road.dist < 22 ? dens : dens * 0.55;
      if (rnd() > p) continue;

      const jx = x + (rnd() - 0.5) * 3.4;
      const jz = z + (rnd() - 0.5) * 3.4;
      const downtown = road.dist < 16 && dens > 0.5;
      const tall = downtown && rnd() < 0.18;

      const rotY = road.axis === 'h' ? 0 : Math.PI / 2;
      const w = tall ? 12 + rnd() * 6 : 4.8 + rnd() * 3.2;
      const d = tall ? 11 + rnd() * 5 : 5.0 + rnd() * 3.6;
      const h = tall ? 14 + rnd() * 22 : downtown ? 6 + rnd() * 5 : 3.4 + rnd() * 3.4;
      const fm = facades[Math.floor(rnd() * facades.length)];

      const body = gBox(w, h, d, 0, GROUND, 0);
      boxUV(body, w, h, d, 9, 4.2);
      if (rotY) body.rotateY(rotY);
      body.translate(jx, 0, jz);
      kit.add(body, fm);
      count++;

      // atap
      if (tall) {
        kit.add(rot(gBox(w + 0.6, 0.8, d + 0.6, 0, GROUND + h, 0), rotY, jx, jz), mParapet);
        kit.add(rot(gBox(w * 0.5, 1.6, d * 0.5, 0, GROUND + h + 0.8, 0), rotY, jx, jz), mSlab);
        if (rnd() < 0.7) kit.add(rot(gCyl(0.9, 0.9, 1.6, 10, w * 0.25, GROUND + h + 0.8, -d * 0.2), rotY, jx, jz), mTank);
        kit.add(rot(gBox(1.1, 0.7, 0.9, -w * 0.3, GROUND + h + 0.8, d * 0.25), rotY, jx, jz), mAC);
      } else if (h > 6) {
        kit.add(rot(gBox(w + 0.5, 0.7, d + 0.5, 0, GROUND + h, 0), rotY, jx, jz), mParapet);
        if (rnd() < 0.5) kit.add(rot(gBox(w * 0.4, 2.2, d * 0.6, 0, GROUND + h + 0.7, 0), rotY, jx, jz), fm);
        if (rnd() < 0.6) kit.add(rot(gCyl(0.8, 0.8, 1.4, 10, w * 0.2, GROUND + h + 0.7, -d * 0.25), rotY, jx, jz), mTank);
      } else {
        const rf = gGable(w + 1.0, Math.max(1.8, w * 0.42), d + 1.0, 0, GROUND + h, 0);
        if (rotY) rf.rotateY(rotY);
        rf.translate(jx, 0, jz);
        kit.add(rf, roofs[Math.floor(rnd() * roofs.length)]);
      }

      // kanopi toko di pinggir jalan utama
      if (road.dist < 15 && h < 14 && rnd() < 0.75) {
        const side = rotY === 0 ? (jz < 0 ? 1 : -1) : 1;
        const aw = gBox(w * 0.9, 0.14, 1.8, 0, GROUND + 2.4, side * (d / 2 + 0.9));
        aw.rotateX(side * 0.18);
        if (rotY) aw.rotateY(rotY);
        aw.translate(jx, 0, jz);
        kit.add(aw, mat(pick(AWNING), { roughness: 0.85 }));
      }
    }
  }

  kit.build(g, { castShadow: true, receiveShadow: true, name: 'bangunan' });
  return { group: g, count };
}

function rot(geo, rotY, x, z) {
  if (rotY) geo.rotateY(rotY);
  geo.translate(x, 0, z);
  return geo;
}
