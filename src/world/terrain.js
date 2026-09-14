import * as THREE from 'three';
import { mat, PALETTE, makeRng } from '../lib/kit.js';
import { riverZ, riverHalf, distToBank, islandHeight, ISLAND } from './river.js';

export const SIZE = 320;      // sisi diorama
const SEG = 200;              // resolusi grid
const BANK_DROP = 6.5;        // kedalaman dasar sungai
export const WATER_Y = 0;

/** Tinggi tanah pada (x,z). Negatif = dasar sungai. */
export function groundHeight(x, z) {
  const isl = islandHeight(x, z);
  if (isl > 0) return isl;

  const d = distToBank(x, z);
  if (d < 0) {
    // dasar sungai: melandai ke tengah
    const t = Math.min(1, -d / riverHalf(x));
    return -BANK_DROP * Math.sin(t * Math.PI * 0.5) - 0.4;
  }
  // darat: naik cepat dari tepi lalu bergelombang halus
  const rise = 2.6 * (1 - Math.exp(-d / 5));
  const roll =
    1.5 * Math.sin(x / 46 + 1.2) * Math.cos(z / 52) +
    0.7 * Math.sin(x / 19 - 0.6) * Math.sin(z / 23 + 2.1);
  const edgeFade = Math.min(1, d / 12);
  return rise + roll * edgeFade;
}

/** Warna vertex berdasarkan ketinggian & jarak ke sungai. */
function terrainColor(x, z, y, out) {
  const sand = new THREE.Color('#b9a37c');
  const mud = new THREE.Color('#6f5c3f');
  const grass = new THREE.Color(PALETTE.grass);
  const grassDark = new THREE.Color('#65794a');
  const isl = islandHeight(x, z);

  if (y < -0.1) {
    out.copy(mud).lerp(new THREE.Color('#4b3d29'), Math.min(1, -y / BANK_DROP));
    return out;
  }
  const d = distToBank(x, z);
  if (d < 3.5 || (isl > 0 && isl < 1.4)) {
    out.copy(sand).lerp(grass, THREE.MathUtils.clamp(d / 3.5, 0, 1));
    return out;
  }
  const n = 0.5 + 0.5 * Math.sin(x / 7.3) * Math.cos(z / 6.1);
  out.copy(grass).lerp(grassDark, n * 0.55);
  return out;
}

export function buildTerrain() {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);
    terrainColor(x, z, y, c);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  const group = new THREE.Group();
  group.add(mesh);
  group.add(buildBase());
  return group;
}

/** Alas diorama: "potongan tanah" tebal agar terasa seperti maket. */
function buildBase() {
  const g = new THREE.Group();
  const h = 14;
  const s = SIZE;

  const side = new THREE.Mesh(
    new THREE.BoxGeometry(s, h, s),
    [
      mat('#6b5f4c', { roughness: 1 }),
      mat('#6b5f4c', { roughness: 1 }),
      mat('#5a5041', { roughness: 1 }),
      mat('#463d31', { roughness: 1 }),
      mat('#6b5f4c', { roughness: 1 }),
      mat('#6b5f4c', { roughness: 1 }),
    ]
  );
  side.position.y = -h / 2 - 6.2;
  side.receiveShadow = true;
  g.add(side);

  // bingkai atas tipis, kesan pelat maket
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(s + 2.4, 1.6, s + 2.4),
    mat('#2b2721', { roughness: 0.7 })
  );
  rim.position.y = -6.6;
  g.add(rim);

  return g;
}

/** Titik acak di darat yang memenuhi syarat (untuk vegetasi/rumah). */
export function scatterLand(rng, count, opts = {}) {
  const {
    minBank = 6, maxBank = Infinity, area = SIZE * 0.46,
    avoid = [], minY = 0.3, includeIsland = false,
  } = opts;
  const out = [];
  let guard = 0;
  while (out.length < count && guard < count * 60) {
    guard++;
    const x = (rng() * 2 - 1) * area;
    const z = (rng() * 2 - 1) * area;
    const onIsland = islandHeight(x, z) > 0;
    if (onIsland && !includeIsland) continue;
    const d = onIsland ? 99 : distToBank(x, z);
    if (!onIsland && (d < minBank || d > maxBank)) continue;
    const y = groundHeight(x, z);
    if (y < minY) continue;
    let ok = true;
    for (const a of avoid) {
      if (Math.hypot(x - a[0], z - a[1]) < a[2]) { ok = false; break; }
    }
    if (!ok) continue;
    out.push([x, y, z]);
  }
  return out;
}

export { riverZ, riverHalf, distToBank, islandHeight, ISLAND, makeRng };
