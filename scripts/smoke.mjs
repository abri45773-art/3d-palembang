/* ------------------------------------------------------------------ *
 *  Uji asap (smoke test) tanpa browser.
 *  Menjalankan SELURUH perakit adegan 3D di Node dengan DOM kanvas
 *  tiruan, lalu memeriksa hasil graf adegan: jumlah mesh, posisi NaN,
 *  bounding sphere, serta siklus update/setNight.
 *
 *  Dijalankan dengan:  npm run test:smoke
 * ------------------------------------------------------------------ */
import * as THREE from 'three';

/* ------------------------- DOM kanvas tiruan ---------------------- */
function makeCtx() {
  const gradient = { addColorStop() {} };
  const target = {};
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
      return () => {};
    },
    set(t, prop, value) { t[prop] = value; return true; },
  });
}
globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`createElement(${tag}) tidak diduga`);
    return { width: 0, height: 0, style: {}, getContext: () => makeCtx() };
  },
};

/* ------------------------- jalankan dunia ------------------------- */
const { createWorld } = await import('../src/scene/world.js');
const { LANDMARKS, CATEGORIES } = await import('../src/data/landmarks.js');
const { applyNight } = await import('../src/scene/lights.js');

const scene = new THREE.Scene();
const fakeRenderer = { toneMappingExposure: 1 };

const steps = [];
const t0 = Date.now();
const world = createWorld(scene, fakeRenderer, (m) => steps.push(m));
const buildMs = Date.now() - t0;

/* ------------------------- pemeriksaan ---------------------------- */
let meshes = 0, triangles = 0, lights = 0, nan = 0, emptyGeo = 0;
const badNames = [];
scene.traverse((o) => {
  if (o.isMesh) {
    meshes++;
    const g = o.geometry;
    if (!g || !g.attributes.position || g.attributes.position.count === 0) {
      emptyGeo++;
      badNames.push(`${o.name}(kosong)`);
      return;
    }
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i++) {
      if (!Number.isFinite(pos[i])) { nan++; break; }
    }
    if (!Number.isFinite(o.position.x + o.position.y + o.position.z)) {
      nan++;
      badNames.push(`${o.name}(posisi NaN)`);
    }
    g.computeBoundingSphere();
    if (!g.boundingSphere || !Number.isFinite(g.boundingSphere.radius)) {
      nan++;
      badNames.push(`${o.name}(bounding NaN)`);
    } else {
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  }
  if (o.isLight) lights++;
});

/* shader harus punya deklarasi yang dipakai bersama */
const waterFrag = world.water.material.fragmentShader;
const skyFrag = world.sky.material.fragmentShader;
const shaderChecks = {
  'air memakai skyColor()': waterFrag.includes('skyColor('),
  'air memakai fogAmt()': waterFrag.includes('fogAmt('),
  'langit punya uNight': skyFrag.includes('uNight'),
  'uniform berbagi (uSunDir identik)': world.water.uniforms.uSunDir === world.sky.uniforms.uSunDir,
};

/* siklus waktu: fajar -> siang -> senja -> malam */
const nightByHour = {};
for (const h of [0, 6, 9, 13, 17.5, 19, 21]) {
  const n = world.sky.setTime(h);
  world.setNight(n);
  nightByHour[h] = Number(n.toFixed(2));
}
if (nightByHour[13] !== 0) throw new Error('siang hari seharusnya night=0');
if (nightByHour[21] < 0.9) throw new Error('malam hari seharusnya night≈1');

/* jalankan beberapa frame animasi */
scene.userData.cameraPos = new THREE.Vector3(150, 120, 260);
for (let i = 0; i < 90; i++) world.update(1 / 60, i / 60);

/* data landmark harus lengkap & konsisten */
const dataProblems = [];
for (const l of LANDMARKS) {
  if (!l.id || !l.name || !l.cat || !l.body) dataProblems.push(`${l.id}:kolom tidak lengkap`);
  if (!CATEGORIES.includes(l.cat)) dataProblems.push(`${l.id}: kategori "${l.cat}" tidak terdaftar`);
  if (!Array.isArray(l.at) || l.at.length !== 3) dataProblems.push(`${l.id}: jangkar label salah`);
  if (!l.view || l.view.pos.length !== 3 || l.view.target.length !== 3) dataProblems.push(`${l.id}: sudut kamera salah`);
  if (!l.facts || !l.facts.length) dataProblems.push(`${l.id}: tanpa fakta`);
  if (l.view.pos.some((v) => !Number.isFinite(v))) dataProblems.push(`${l.id}: kamera NaN`);
}
const ids = LANDMARKS.map((l) => l.id);
if (new Set(ids).size !== ids.length) dataProblems.push('ada id landmark ganda');

/* label harus punya pasangan data */
const labelIds = world.labels.map((l) => l.id);
const missing = labelIds.filter((id) => !ids.includes(id));
if (missing.length) dataProblems.push(`label tanpa data: ${missing.join(', ')}`);

/* regresi: dua tekstur berbeda pada warna sama tidak boleh berbagi material */
const { mat } = await import('../src/lib/util.js');
const texA = new THREE.CanvasTexture(globalThis.document.createElement('canvas'));
const texB = new THREE.CanvasTexture(globalThis.document.createElement('canvas'));
const mA = mat('#101418', { map: texA, roughness: 0.5 });
const mB = mat('#101418', { map: texB, roughness: 0.5 });
const matCacheOk = mA !== mB && mA.map === texA && mB.map === texB;
if (!matCacheOk) fail_extra.push('cache material menabrak dua tekstur berbeda');
const mC = mat('#101418', { map: texA, roughness: 0.5 });
if (mC !== mA) fail_extra.push('cache material tidak dipakai ulang untuk kunci yang sama');

/* ------------------------- laporan -------------------------------- */
const fail = [];
const fail_extra = [];
fail.push(...fail_extra);
if (nan) fail.push(`${nan} mesh dengan nilai NaN`);
if (emptyGeo) fail.push(`${emptyGeo} mesh geometri kosong`);
if (meshes < 60) fail.push(`mesh terlalu sedikit (${meshes})`);
if (triangles < 50000) fail.push(`segitiga terlalu sedikit (${triangles})`);
if (world.stats.buildings < 400) fail.push(`bangunan terlalu sedikit (${world.stats.buildings})`);
if (dataProblems.length) fail.push(...dataProblems);
for (const [k, v] of Object.entries(shaderChecks)) if (!v) fail.push(`shader: ${k} gagal`);

console.log('── Hasil uji asap miniatur Palembang ─────────────');
console.log(`langkah perakitan : ${steps.length} (${steps.join(' → ')})`);
console.log(`waktu perakitan   : ${buildMs} ms`);
console.log(`mesh              : ${meshes}`);
console.log(`segitiga          : ${Math.round(triangles).toLocaleString('id-ID')}`);
console.log(`lampu             : ${lights}`);
console.log(`bangunan prosedural: ${world.stats.buildings}`);
console.log(`label landmark    : ${world.labels.length}`);
console.log(`kurva LRT         : ${world.sky ? 'ok' : 'gagal'}`);
console.log(`cache material    : ${matCacheOk ? 'unik per tekstur' : 'BERTABRAKAN'}`);
console.log(`nilai malam/jam   : ${JSON.stringify(nightByHour)}`);
console.log('──────────────────────────────────────────────────');

if (fail.length) {
  console.error('GAGAL:');
  for (const f of fail) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('LULUS: seluruh modul adegan terakit tanpa galat.');
