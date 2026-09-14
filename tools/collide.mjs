import * as THREE from 'three';
import { LANDMARKS } from '../src/data.js';
import { groundHeight } from '../src/world/terrain.js';
import { buildMasjid } from '../src/models/masjid.js';
import { buildBenteng } from '../src/models/benteng.js';
import { buildMonpera } from '../src/models/monpera.js';
import { buildAlQuran, buildDowntown, buildPasar } from '../src/models/city.js';
import { buildRumahLimas } from '../src/models/vernacular.js';
import { buildKemaro } from '../src/models/kemaro.js';
import { makeRng } from '../src/lib/kit.js';
import { ISLAND, islandHeight } from '../src/world/river.js';

const defs = [
  ['masjid', buildMasjid(), 0.22],
  ['benteng', buildBenteng(), -0.08],
  ['monpera', buildMonpera(), 0.5],
  ['alquran', buildAlQuran(), -0.4],
  ['kota', buildDowntown(makeRng(4242)), 0.18],
];
const boxes = [];
for (const [id, g, rot] of defs) {
  const lm = LANDMARKS.find(l => l.id === id);
  g.position.set(lm.pos[0], 0, lm.pos[1]); g.rotation.y = rot;
  g.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(g);
  boxes.push([id, bb]);
}
// pasar
{ const g = buildPasar(makeRng(4242)); g.position.set(-100,0,-135); g.rotation.y=0.3; g.updateMatrixWorld(true);
  boxes.push(['pasar', new THREE.Box3().setFromObject(g)]); }
// limas cluster
{ const c = new THREE.Group();
  for (const [dx,dz,s,rot] of [[0,0,0.62,0.1],[-17,5,0.46,-0.5],[16,7,0.44,0.55],[-5,-15,0.40,3.0],[14,-13,0.38,2.6]]) {
    const h=buildRumahLimas(s); h.position.set(dx,0,dz); h.rotation.y=rot; c.add(h); }
  const lm=LANDMARKS.find(l=>l.id==='limas'); c.position.set(lm.pos[0],0,lm.pos[1]); c.rotation.y=0.15; c.updateMatrixWorld(true);
  boxes.push(['limas', new THREE.Box3().setFromObject(c)]); }
// kemaro
{ const g=buildKemaro(); g.position.set(ISLAND.x, 0, ISLAND.z); g.rotation.y=-0.35; g.updateMatrixWorld(true);
  boxes.push(['kemaro', new THREE.Box3().setFromObject(g)]); }

console.log('--- footprints (x range / z range) ---');
for (const [id,bb] of boxes)
  console.log(id.padEnd(9), `x[${bb.min.x.toFixed(0)},${bb.max.x.toFixed(0)}]`.padEnd(16), `z[${bb.min.z.toFixed(0)},${bb.max.z.toFixed(0)}]`.padEnd(16), `h=${bb.max.y.toFixed(1)}`);

console.log('\n--- overlaps (XZ) ---');
let bad=0;
for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++){
  const [ia,a]=boxes[i], [ib,b]=boxes[j];
  const ox = Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x);
  const oz = Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z);
  if (ox>0&&oz>0){ bad++; console.log(`OVERLAP ${ia} <-> ${ib}: ${ox.toFixed(1)} x ${oz.toFixed(1)}`); }
}
if(!bad) console.log('none ✓');
