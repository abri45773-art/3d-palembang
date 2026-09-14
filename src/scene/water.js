import * as THREE from 'three';
import { SKY_GLSL } from './sky.js';
import { WATER_Y } from '../lib/util.js';

const N_LIGHTS = 6;

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying vec3 vNrm;
  varying float vWave;

  float wave(vec2 p, float t) {
    // arus Musi mengalir ke arah -X
    float a = sin(p.x * 0.22 - t * 0.9 + sin(p.y * 0.09) * 1.4) * 0.20;
    float b = sin(p.y * 0.31 + t * 0.65) * 0.14;
    float c = sin((p.x * 0.55 + p.y * 0.42) + t * 1.7) * 0.075;
    float d = sin((p.x * 1.15 - p.y * 0.9) - t * 2.4) * 0.035;
    return a + b + c + d;
  }
  vec3 waveNormal(vec2 p, float t) {
    float e = 0.6;
    float hx = wave(p + vec2(e, 0.0), t) - wave(p - vec2(e, 0.0), t);
    float hz = wave(p + vec2(0.0, e), t) - wave(p - vec2(0.0, e), t);
    return normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
  }
  void main() {
    vec3 pos = position;
    float h = wave(pos.xz, uTime);
    pos.y += h;
    vWave = h;
    vNrm = waveNormal(pos.xz, uTime);
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  uniform vec3  uShallow;
  uniform vec3  uDeep;
  uniform vec3  uFogColor;
  uniform float uFogDensity;
  uniform vec4  uLights[${N_LIGHTS}];
  uniform vec3  uLightCol[${N_LIGHTS}];
  varying vec3 vWorld;
  varying vec3 vNrm;
  varying float vWave;

  ${SKY_GLSL}

  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 N = normalize(vNrm);
    float ndv = clamp(dot(V, N), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 3.0);

    vec3 R = reflect(-V, N);
    R.y = max(R.y, 0.03);
    vec3 sky = skyColor(R);

    // tengah sungai lebih dalam & keruh
    float depth = 1.0 - smoothstep(6.0, 74.0, abs(vWorld.z));
    vec3 water = mix(uShallow, uDeep, depth * 0.85 + 0.15);
    water *= 0.92 + 0.16 * ndv;

    vec3 col = mix(water, sky, clamp(0.26 + 0.58 * fres, 0.0, 0.88));

    // kilau matahari
    vec3 L = normalize(uSunDir);
    float sp = pow(max(dot(R, L), 0.0), 320.0);
    float gl = pow(max(dot(R, L), 0.0), 44.0);
    col += uSunColor * (sp * 2.6 * (1.0 - uNight * 0.9) + gl * 0.18 * (1.0 - uNight));

    // buih di puncak gelombang
    col += vec3(1.0, 0.98, 0.92) * smoothstep(0.28, 0.44, vWave) * 0.13;

    // pantulan lampu kota saat malam
    if (uNight > 0.01) {
      for (int i = 0; i < ${N_LIGHTS}; i++) {
        vec2 d = vWorld.xz - uLights[i].xy;
        d.y *= 0.34;                                   // memanjang searah arus
        float f = exp(-dot(d, d) / max(uLights[i].z, 0.001));
        col += uLightCol[i] * f * uLights[i].w * uNight;
      }
      col += vec3(1.0, 0.72, 0.36) * exp(-pow(vWorld.x / 46.0, 2.0)) * smoothstep(120.0, 20.0, abs(vWorld.z)) * 0.10 * uNight;
    }

    float f = fogAmt(length(cameraPosition - vWorld), uFogDensity);
    col = mix(col, uFogColor, f);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createWater(sky) {
  const uniforms = {
    uTime: { value: 0 },
    uNight: sky.uniforms.uNight,
    uSunDir: sky.uniforms.uSunDir,
    uSunColor: sky.uniforms.uSunColor,
    uZenith: sky.uniforms.uZenith,
    uHorizon: sky.uniforms.uHorizon,
    uMoonDir: sky.uniforms.uMoonDir,
    uShallow: { value: new THREE.Color('#79805c') },
    uDeep: { value: new THREE.Color('#3b4230') },
    uFogColor: { value: new THREE.Color('#dbe7ee') },
    uFogDensity: { value: 0.00125 },
    uLights: { value: Array.from({ length: N_LIGHTS }, () => new THREE.Vector4(0, 0, 1, 0)) },
    uLightCol: { value: Array.from({ length: N_LIGHTS }, () => new THREE.Color('#ffbb66')) },
  };

  const nightShallow = new THREE.Color('#16222c');
  const nightDeep = new THREE.Color('#070d13');
  const dayShallow = new THREE.Color('#79805c');
  const dayDeep = new THREE.Color('#3b4230');

  const geo = new THREE.PlaneGeometry(1100, 300, 180, 60);
  geo.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = WATER_Y;
  mesh.name = 'sungai-musi';
  mesh.renderOrder = -1;

  /** Titik cahaya pantulan (dipakai saat malam). */
  function setLight(i, x, z, radius, intensity, color) {
    uniforms.uLights.value[i].set(x, z, radius * radius, intensity);
    uniforms.uLightCol.value[i].set(color);
  }

  function update(dt, fog) {
    uniforms.uTime.value += dt;
    if (fog) {
      uniforms.uFogColor.value.copy(fog.color);
      uniforms.uFogDensity.value = fog.density;
    }
    const n = uniforms.uNight.value;
    uniforms.uShallow.value.copy(dayShallow).lerp(nightShallow, n);
    uniforms.uDeep.value.copy(dayDeep).lerp(nightDeep, n);
  }

  return { mesh, uniforms, update, setLight, material };
}
