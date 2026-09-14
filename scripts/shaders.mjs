/* ------------------------------------------------------------------ *
 *  Uji shader GLSL tanpa GPU.
 *  1. Shader kustom diambil dari modul adegan yang sebenarnya.
 *  2. #include <...> three.js diuraikan menjadi chunk aslinya.
 *  3. Header standar three.js (uniform/varying bawaan) ditempel.
 *  4. Sumber diparse dengan parser GLSL ES -> galat sintaks ketahuan.
 *
 *  Dijalankan dengan:  npm run test:shaders
 * ------------------------------------------------------------------ */
import * as THREE from 'three';
import { parser } from '@shaderfrog/glsl-parser';

globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }) }),
};

const { createWater } = await import('../src/scene/water.js');
const { SkyRig } = await import('../src/scene/sky.js');

const sky = new SkyRig(new THREE.Scene(), { toneMappingExposure: 1 });
const water = createWater(sky);

const THREE_HEADER_VERT = /* glsl */ `
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
`;
const THREE_HEADER_FRAG = /* glsl */ `
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
`;

/** Uraikan #include <chunk> menjadi isi ShaderChunk three.js. */
function expandIncludes(src) {
  return src.replace(/#include\s+<([a-z0-9_]+)>/g, (all, name) => {
    const chunk = THREE.ShaderChunk[name];
    if (chunk === undefined) throw new Error(`chunk three.js tidak ditemukan: ${name}`);
    return chunk;
  });
}

const targets = [
  ['langit · vertex', sky.material.vertexShader, THREE_HEADER_VERT],
  ['langit · fragment', sky.material.fragmentShader, THREE_HEADER_FRAG],
  ['air · vertex', water.material.vertexShader, THREE_HEADER_VERT],
  ['air · fragment', water.material.fragmentShader, THREE_HEADER_FRAG],
];

/* tiga.js menyuntikkan #define ini sebelum shader; parser perlu melihatnya */
const DEFINES = '#define TONE_MAPPING\n#define SRGB_TRANSFER\n';

let failed = 0;
for (const [name, src, header] of targets) {
  const full = expandIncludes(DEFINES + header + src);
  try {
    const ast = parser.parse(full, { quiet: true });
    const fns = (ast.functions || []).map((f) => f.identifier?.identifier || f.prototype?.identifier?.identifier).filter(Boolean);
    console.log(`  ✓ ${name.padEnd(20)} ${String(full.split('\n').length).padStart(4)} baris · fungsi: ${fns.join(', ') || 'main'}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}: ${err.message.split('\n')[0]}`);
  }
}

/* periksa uniform yang benar-benar dikirim ke air */
const needed = ['uTime', 'uNight', 'uSunDir', 'uSunColor', 'uZenith', 'uHorizon', 'uMoonDir', 'uShallow', 'uDeep', 'uFogColor', 'uFogDensity', 'uLights', 'uLightCol'];
const missing = needed.filter((u) => !(u in water.uniforms));
if (missing.length) {
  failed++;
  console.error(`  ✗ uniform air belum dikirim: ${missing.join(', ')}`);
} else {
  console.log(`  ✓ ${needed.length} uniform air terkirim semua`);
}
if (water.uniforms.uLights.value.length !== 6) {
  failed++;
  console.error(`  ✗ jumlah uLights tidak cocok dengan loop GLSL`);
}

/* setiap lampu pantulan harus terisi */
for (let i = 0; i < 6; i++) {
  const v = water.uniforms.uLights.value[i];
  if (!Number.isFinite(v.x + v.y + v.z + v.w)) {
    failed++;
    console.error(`  ✗ uLights[${i}] bernilai NaN`);
  }
}

console.log(failed ? `\nGAGAL: ${failed} masalah shader.` : '\nLULUS: semua shader kustom terparse tanpa galat sintaks.');
process.exit(failed ? 1 : 0);
