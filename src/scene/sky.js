import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Langit prosedural + rig pencahayaan matahari/bulan.
 *  Potongan GLSL `skyColor()` dipakai bersama oleh kubah langit dan
 *  shader air supaya pantulan air selalu cocok dengan langit.
 * ------------------------------------------------------------------ */
export const SKY_GLSL = /* glsl */ `
uniform vec3  uZenith;
uniform vec3  uHorizon;
uniform vec3  uSunColor;
uniform vec3  uSunDir;
uniform vec3  uMoonDir;
uniform float uNight;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float starLayer(vec3 d, float scale) {
  vec3 q = floor(d * scale);
  float h = hash13(q);
  return smoothstep(0.9965, 1.0, h);
}
vec3 skyColor(vec3 dir) {
  vec3 d = normalize(dir);
  float h = clamp(d.y, -0.12, 1.0);
  float k = pow(smoothstep(-0.03, 0.62, h), 0.85);
  vec3 col = mix(uHorizon, uZenith, k);

  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 3.2 + pow(sd, 26.0) * 0.45 + pow(sd, 3.0) * 0.11);

  float md = max(dot(d, normalize(uMoonDir)), 0.0);
  col += vec3(0.78, 0.85, 1.0) * pow(md, 1600.0) * 1.6 * uNight;

  if (uNight > 0.002) {
    float s = starLayer(d, 260.0) + starLayer(d * 1.73, 180.0) * 0.55;
    col += vec3(0.92, 0.95, 1.0) * s * uNight * smoothstep(0.0, 0.3, d.y) * 1.6;
  }
  return col;
}
float fogAmt(float dist, float density) {
  float f = dist * density;
  return 1.0 - exp(-f * f);
}
`;

const KEY = [
  { h: 0.0, zen: '#040810', hor: '#0a1522', sun: '#24354f', si: 0.10, hemi: 0.28, fog: '#070f18', exp: 1.02 },
  { h: 4.8, zen: '#0d1730', hor: '#3a3350', sun: '#5a5570', si: 0.16, hemi: 0.32, fog: '#20243a', exp: 1.0 },
  { h: 5.8, zen: '#1d2c4c', hor: '#c07a58', sun: '#ff9d5e', si: 0.42, hemi: 0.5, fog: '#6a5a63', exp: 1.02 },
  { h: 6.8, zen: '#3a6494', hor: '#f2a668', sun: '#ffb36a', si: 1.05, hemi: 0.72, fog: '#a68f7e', exp: 1.04 },
  { h: 9.0, zen: '#4283c6', hor: '#cfe0ea', sun: '#fff1d8', si: 1.85, hemi: 0.95, fog: '#cbd9e2', exp: 1.0 },
  { h: 13.0, zen: '#3a7cc4', hor: '#d3e6f0', sun: '#fffaf0', si: 2.45, hemi: 1.05, fog: '#dbe7ee', exp: 0.98 },
  { h: 16.0, zen: '#4a7eb4', hor: '#eed0a2', sun: '#ffe0ae', si: 1.9, hemi: 0.95, fog: '#dccfb9', exp: 1.0 },
  { h: 17.6, zen: '#3d5f8f', hor: '#f29550', sun: '#ff9d4a', si: 1.15, hemi: 0.7, fog: '#c08a63', exp: 1.05 },
  { h: 18.5, zen: '#25355a', hor: '#c85a3c', sun: '#e0663a', si: 0.5, hemi: 0.5, fog: '#7a4f4a', exp: 1.08 },
  { h: 19.4, zen: '#121d36', hor: '#5d3547', sun: '#8c4a52', si: 0.22, hemi: 0.36, fog: '#332f42', exp: 1.08 },
  { h: 20.6, zen: '#060c18', hor: '#131f2e', sun: '#2c4468', si: 0.13, hemi: 0.3, fog: '#0b141f', exp: 1.04 },
  { h: 24.0, zen: '#040810', hor: '#0a1522', sun: '#24354f', si: 0.10, hemi: 0.28, fog: '#070f18', exp: 1.02 },
];

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

export class SkyRig {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.hour = 13;

    this.uniforms = {
      uZenith: { value: new THREE.Color('#3a7cc4') },
      uHorizon: { value: new THREE.Color('#d3e6f0') },
      uSunColor: { value: new THREE.Color('#fffaf0') },
      uSunDir: { value: new THREE.Vector3(0.2, 0.9, 0.3) },
      uMoonDir: { value: new THREE.Vector3(-0.4, 0.6, -0.3) },
      uNight: { value: 0 },
    };

    // --- kubah langit
    const geo = new THREE.SphereGeometry(3200, 40, 24);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vLocal;
        void main() {
          vLocal = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        ${SKY_GLSL}
        varying vec3 vLocal;
        void main() {
          gl_FragColor = vec4(skyColor(vLocal), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.name = 'sky';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);

    // --- cahaya
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const cam = this.sun.shadow.camera;
    cam.left = -330; cam.right = 330; cam.top = 280; cam.bottom = -280;
    cam.near = 1; cam.far = 1400;
    this.sun.shadow.bias = -0.0009;
    this.sun.shadow.normalBias = 0.35;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xbfd8ee, 0x4a4632, 1.0);
    scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(this.ambient);

    this.fog = new THREE.FogExp2(new THREE.Color('#dbe7ee'), 0.00125);
    scene.fog = this.fog;
  }

  setTime(hour) {
    this.hour = ((hour % 24) + 24) % 24;
    const h = this.hour;

    let a = KEY[0], b = KEY[KEY.length - 1];
    for (let i = 0; i < KEY.length - 1; i++) {
      if (h >= KEY[i].h && h <= KEY[i + 1].h) { a = KEY[i]; b = KEY[i + 1]; break; }
    }
    const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
    const st = t * t * (3 - 2 * t);

    const u = this.uniforms;
    u.uZenith.value.copy(_c1.set(a.zen)).lerp(_c2.set(b.zen), st);
    u.uHorizon.value.copy(_c1.set(a.hor)).lerp(_c2.set(b.hor), st);
    u.uSunColor.value.copy(_c1.set(a.sun)).lerp(_c2.set(b.sun), st);

    const si = a.si + (b.si - a.si) * st;
    const hemiI = a.hemi + (b.hemi - a.hemi) * st;
    const exposure = a.exp + (b.exp - a.exp) * st;
    this.fog.color.copy(_c1.set(a.fog)).lerp(_c2.set(b.fog), st);

    // posisi matahari: terbit timur (+X), tenggelam barat (-X)
    const ang = ((h - 6) / 12) * Math.PI;
    const elev = Math.sin(ang);
    const dir = u.uSunDir.value.set(Math.cos(ang) * 0.92, elev, -0.34 + 0.16 * Math.sin(ang));
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    dir.normalize();

    const day = Math.max(elev, 0);
    const night = 1 - Math.min(1, Math.max(0, (elev + 0.09) / 0.34));
    u.uNight.value = night;

    // bulan berlawanan arah matahari
    u.uMoonDir.value.set(-dir.x * 0.8, Math.max(0.45, -dir.y * 0.7), -dir.z * 0.5).normalize();

    // lampu utama: matahari siang, bulan malam
    if (elev > 0.02) {
      this.sun.color.copy(u.uSunColor.value);
      this.sun.intensity = si;
    } else {
      this.sun.color.set('#93a9cc');
      this.sun.intensity = 0.28 + 0.1 * (1 - night);
      dir.copy(u.uMoonDir.value);
    }
    this.sun.position.copy(dir).multiplyScalar(620);
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();

    this.hemi.color.copy(u.uZenith.value).lerp(_c2.set('#ffffff'), 0.35);
    this.hemi.groundColor.set(elev > 0.02 ? '#5e5a44' : '#141b26');
    this.hemi.intensity = hemiI;
    this.ambient.intensity = 0.16 + 0.14 * (1 - night);
    this.renderer.toneMappingExposure = exposure;

    this.night = night;
    return night;
  }
}
