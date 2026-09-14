import * as THREE from 'three';
import { buildTerrain, groundHeight } from '../src/world/terrain.js';
import { buildAmpera } from '../src/models/ampera.js';
import { buildMasjid } from '../src/models/masjid.js';
import { buildBenteng } from '../src/models/benteng.js';
import { buildMonpera } from '../src/models/monpera.js';
import { buildKemaro } from '../src/models/kemaro.js';
import { buildAlQuran, buildDowntown, buildPasar } from '../src/models/city.js';
import { buildRumahLimas, buildRumahRakit, buildKetek, buildTongkang, buildDock } from '../src/models/vernacular.js';
import { buildVegetation, buildKampung, buildRiverRoads, buildTraffic } from '../src/models/scenery.js';
import { makeRng } from '../src/lib/kit.js';
import { LANDMARKS } from '../src/data.js';

const rng = makeRng(7);
const items = {
  terrain: () => buildTerrain(),
  ampera: () => buildAmpera(),
  masjid: () => buildMasjid(),
  benteng: () => buildBenteng(),
  monpera: () => buildMonpera(),
  kemaro: () => buildKemaro(),
  alquran: () => buildAlQuran(),
  downtown: () => buildDowntown(makeRng(1)),
  pasar: () => buildPasar(makeRng(2)),
  limas: () => buildRumahLimas(1),
  rakit: () => buildRumahRakit(makeRng(3)),
  ketek: () => buildKetek(makeRng(4)),
  tongkang: () => buildTongkang(),
  dock: () => buildDock(-30, -1),
  veg: () => buildVegetation(makeRng(5), []),
  kampung: () => buildKampung(makeRng(6), []),
  roads: () => buildRiverRoads(),
  traffic: () => buildTraffic(makeRng(8)),
};

let fail = 0, totalTris = 0;
for (const [name, fn] of Object.entries(items)) {
  try {
    const g = fn();
    const bb = new THREE.Box3().setFromObject(g);
    let meshes = 0, tris = 0, badNaN = 0;
    g.traverse(o => {
      if (!o.isMesh) return;
      meshes++;
      const geo = o.geometry;
      const cnt = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
      tris += cnt * (o.isInstancedMesh ? o.count : 1);
      const p = geo.attributes.position.array;
      for (let i = 0; i < Math.min(p.length, 300); i++) if (!Number.isFinite(p[i])) { badNaN++; break; }
    });
    totalTris += tris;
    const size = bb.getSize(new THREE.Vector3());
    const ok = Number.isFinite(size.x) && size.y > 0;
    if (!ok || badNaN) { fail++; console.log(`FAIL ${name}: NaN=${badNaN} size=${size.toArray()}`); }
    else console.log(`ok   ${name.padEnd(9)} meshes=${String(meshes).padStart(5)} tris=${String(Math.round(tris)).padStart(7)}  size=${size.x.toFixed(1)}x${size.y.toFixed(1)}x${size.z.toFixed(1)}  y:[${bb.min.y.toFixed(1)},${bb.max.y.toFixed(1)}]`);
  } catch (e) { fail++; console.log(`FAIL ${name}: ${e.message}\n${e.stack.split('\n')[1]}`); }
}
console.log(`\ntotal triangles ≈ ${Math.round(totalTris).toLocaleString()}`);
console.log('\n--- landmark ground heights ---');
for (const l of LANDMARKS) console.log(l.id.padEnd(9), 'gh=', groundHeight(l.pos[0], l.pos[1]).toFixed(2));
process.exit(fail ? 1 : 0);
