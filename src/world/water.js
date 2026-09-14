import * as THREE from 'three';
import { SIZE } from './terrain.js';

/**
 * Permukaan Sungai Musi — shader air bergelombang dengan warna keruh khas Musi,
 * riak Gerstner sederhana, kilau matahari, dan pantulan langit (fresnel).
 */
export function buildWater() {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, 140, 140);
  geo.rotateX(-Math.PI / 2);

  const uniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color('#6d5a3a') },
    uShallow: { value: new THREE.Color('#a98e5c') },
    uSky: { value: new THREE.Color('#cfe4ec') },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3) },
    uSunColor: { value: new THREE.Color('#fff5e2') },
    uSunStrength: { value: 0.5 },
    uFogColor: { value: new THREE.Color('#cfe4ec') },
    uFogDensity: { value: 0.0022 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vRipple;

      // gelombang arah dengan turunan analitik
      vec3 wave(vec2 p, vec2 dir, float amp, float len, float speed, out vec2 slope) {
        float k = 6.28318 / len;
        float f = k * (dot(dir, p)) + uTime * speed;
        float s = sin(f);
        slope = dir * (k * amp * cos(f));
        return vec3(0.0, amp * s, 0.0);
      }

      void main() {
        vec3 p = position;
        vec2 xz = p.xz;
        vec2 s1, s2, s3, s4;
        vec3 w = vec3(0.0);
        w += wave(xz, normalize(vec2(1.0, 0.25)), 0.30, 26.0, 0.75, s1);
        w += wave(xz, normalize(vec2(0.75, -0.6)), 0.18, 14.0, 1.05, s2);
        w += wave(xz, normalize(vec2(-0.3, 1.0)), 0.11, 8.5, 1.5, s3);
        w += wave(xz, normalize(vec2(1.0, 0.9)), 0.055, 4.2, 2.2, s4);
        p += w;

        vec2 slope = s1 + s2 + s3 + s4;
        vNormal = normalize(vec3(-slope.x, 1.0, -slope.y));
        vRipple = w.y;

        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep, uShallow, uSky, uSunColor, uFogColor;
      uniform vec3 uSunDir;
      uniform float uSunStrength, uFogDensity, uTime;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vRipple;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorld);

        // fresnel: makin landai makin memantulkan langit
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.2);

        // dasar warna keruh Musi, lebih terang di puncak riak
        vec3 base = mix(uDeep, uShallow, clamp(vRipple * 1.4 + 0.5, 0.0, 1.0));

        // kilau matahari
        vec3 L = normalize(uSunDir);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 190.0) * uSunStrength;
        float glint = pow(max(dot(N, H), 0.0), 22.0) * 0.12 * uSunStrength;

        vec3 col = mix(base, uSky, fres * 0.62);
        col += uSunColor * (spec * 2.4 + glint);

        // sedikit buih pada puncak gelombang
        float foam = smoothstep(0.30, 0.42, vRipple) * 0.10;
        col += vec3(foam);

        // kabut jarak agar menyatu dengan langit
        float dist = length(cameraPosition - vWorld);
        float fog = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));

        gl_FragColor = vec4(col, 0.93);
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = 0;
  mesh.renderOrder = 2;
  mesh.name = 'water';
  mesh.userData.uniforms = uniforms;
  return mesh;
}
