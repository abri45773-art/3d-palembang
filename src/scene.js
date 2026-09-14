import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { LANDMARKS, TIME_PRESETS } from './data.js';
import { setLampIntensity, mat, box, cyl, makeRng, PALETTE as P } from './lib/kit.js';
import { buildTerrain, groundHeight, SIZE } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { riverZ, riverHalf, riverAngle, ISLAND, islandHeight } from './world/river.js';

import { buildAmpera } from './models/ampera.js';
import { buildMasjid } from './models/masjid.js';
import { buildBenteng } from './models/benteng.js';
import { buildMonpera } from './models/monpera.js';
import { buildKemaro } from './models/kemaro.js';
import { buildAlQuran, buildDowntown, buildPasar } from './models/city.js';
import { buildRumahLimas, buildRumahRakit, buildKetek, buildTongkang, buildDock } from './models/vernacular.js';
import { buildVegetation, buildKampung, buildRiverRoads, buildTraffic } from './models/scenery.js';

export class PalembangScene {
  constructor(canvas, onProgress = () => {}) {
    this.canvas = canvas;
    this.onProgress = onProgress;
    this.clock = new THREE.Clock();
    this.animated = [];
    this.boats = [];
    this.focusTargets = new Map();
    this.currentTime = 'pagi';
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  async init() {
    const step = async (label, fn) => {
      this.onProgress(label);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      return fn();
    };

    this._initRenderer();
    this._initCameraControls();

    await step('Membentuk daratan Ilir & Ulu…', () => this._buildGround());
    await step('Mengalirkan Sungai Musi…', () => this._buildWater());
    await step('Mendirikan Jembatan Ampera…', () => this._buildAmpera());
    await step('Membangun Masjid Agung & Monpera…', () => this._buildCivic());
    await step('Menyusun Benteng Kuto Besak…', () => this._buildFort());
    await step('Menata Pulau Kemaro…', () => this._buildIsland());
    await step('Mendirikan Rumah Limas & rumah rakit…', () => this._buildVernacular());
    await step('Membangun pusat kota & pasar…', () => this._buildCity());
    await step('Menanam pepohonan…', () => this._buildNature());
    await step('Menghidupkan perahu & lalu lintas…', () => this._buildLife());
    await step('Menyalakan cahaya…', () => this.setTime('pagi', true));

    this._bindResize();
    return this;
  }

  /* ---------------------------------------------------------------- */
  _initRenderer() {
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(innerWidth, innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#cfe4ec', 0.0022);

    // langit gradien
    const skyGeo = new THREE.SphereGeometry(600, 32, 20);
    this.skyUniforms = {
      top: { value: new THREE.Color('#bfe3f2') },
      mid: { value: new THREE.Color('#e8f4f8') },
      bot: { value: new THREE.Color('#f6f1e4') },
    };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top, mid, bot; varying vec3 vP;
        void main(){
          float h = normalize(vP).y;
          vec3 c = h > 0.06
            ? mix(mid, top, smoothstep(0.06, 0.62, h))
            : mix(bot, mid, smoothstep(-0.25, 0.06, h));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);

    // cahaya
    this.sun = new THREE.DirectionalLight('#fff5e2', 2.5);
    this.sun.position.set(90, 120, 70);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = 170;
    Object.assign(this.sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 520 });
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.5;
    this.scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight('#cfe9f5', '#8d7d63', 1.15);
    this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight('#ffffff', 0.5);
    this.scene.add(this.ambient);

    // lampu aksen di bawah jembatan saat malam
    this.amperaGlow = new THREE.PointLight('#ff8a5c', 0, 90, 2);
    this.amperaGlow.position.set(0, 12, 0);
    this.scene.add(this.amperaGlow);
  }

  _initCameraControls() {
    this.camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.5, 1400);
    this.camera.position.set(128, 104, 158);

    const c = new OrbitControls(this.camera, this.canvas);
    c.enableDamping = true;
    c.dampingFactor = 0.055;
    c.rotateSpeed = 0.62;
    c.zoomSpeed = 0.85;
    c.panSpeed = 0.7;
    c.minDistance = 24;
    c.maxDistance = 300;
    c.minPolarAngle = 0.18;
    c.maxPolarAngle = Math.PI / 2 - 0.06;
    c.target.set(0, 6, 0);
    c.screenSpacePanning = false;
    this.controls = c;
  }

  /* ---------------------------------------------------------------- */
  _buildGround() {
    this.terrain = buildTerrain();
    this.scene.add(this.terrain);
  }

  _buildWater() {
    this.water = buildWater();
    this.scene.add(this.water);
    this.waterUniforms = this.water.userData.uniforms;
  }

  _place(group, id, rotY = 0, yOffset = 0) {
    const lm = LANDMARKS.find((l) => l.id === id);
    const [x, z] = lm.pos;
    const y = Math.max(groundHeight(x, z), 0) + yOffset;
    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
    this.focusTargets.set(id, new THREE.Vector3(x, y + lm.labelY * 0.45, z));
    return group;
  }

  _buildAmpera() {
    this.ampera = buildAmpera();
    this.scene.add(this.ampera);
    const lm = LANDMARKS.find((l) => l.id === 'ampera');
    this.focusTargets.set('ampera', new THREE.Vector3(0, 20, 0));
  }

  _buildCivic() {
    this._place(buildMasjid(), 'masjid', 0.22, -0.4);
    this._place(buildMonpera(), 'monpera', 0.5, -0.4);
  }

  _buildFort() {
    this._place(buildBenteng(), 'benteng', -0.08, -0.4);
  }

  _buildIsland() {
    const g = buildKemaro();
    g.position.set(ISLAND.x, islandHeight(ISLAND.x, ISLAND.z) - 0.6, ISLAND.z);
    g.rotation.y = -0.35;
    this.scene.add(g);
    this.focusTargets.set('kemaro', new THREE.Vector3(ISLAND.x, 20, ISLAND.z));
  }

  _buildVernacular() {
    const rng = makeRng(90210);

    /* --- Kampung Rumah Limas (Seberang Ulu) --- */
    const lm = LANDMARKS.find((l) => l.id === 'limas');
    const [lx, lz] = lm.pos;
    const cluster = new THREE.Group();
    // skala miniatur: rumah adat tetap menonjol tapi proporsional
    // terhadap masjid & benteng di sekitarnya
    const layout = [
      [0, 0, 0.62, 0.1],
      [-17, 5, 0.46, -0.5],
      [16, 7, 0.44, 0.55],
      [-5, -15, 0.40, 3.0],
      [14, -13, 0.38, 2.6],
    ];
    for (const [dx, dz, s, rot] of layout) {
      const h = buildRumahLimas(s);
      const gy = Math.max(groundHeight(lx + dx, lz + dz), 0.2);
      h.position.set(dx, gy - Math.max(groundHeight(lx, lz), 0.2), dz);
      h.rotation.y = rot;
      cluster.add(h);
    }
    // jalan setapak & pagar kampung
    const path = mat('#a1957c', { roughness: 0.96 });
    cluster.add(box(6, 0.2, 42, 0, 0.1, 2, path));
    cluster.add(box(40, 0.2, 5.5, -2, 0.1, 11, path));
    this._place(cluster, 'limas', 0.15, 0);

    /* --- Rumah rakit terapung + dermaga --- */
    const raft = new THREE.Group();
    const rlm = LANDMARKS.find((l) => l.id === 'rakit');
    const positions = [];
    for (let i = 0; i < 11; i++) {
      const x = rlm.pos[0] - 34 + i * 7.4 + (rng() - 0.5) * 2.4;
      const side = i % 3 === 0 ? -1 : 1;
      const z = riverZ(x) + side * (riverHalf(x) - 3.0 - rng() * 2.2);
      const h = buildRumahRakit(rng);
      h.position.set(x, 0.1 + Math.sin(i) * 0.04, z);
      h.rotation.y = riverAngle(x) * -1 + (side > 0 ? 0 : Math.PI) + (rng() - 0.5) * 0.25;
      h.userData.bob = { base: h.position.y, phase: rng() * 6.28, rot: h.rotation.z };
      raft.add(h);
      positions.push([x, z]);
    }
    this.scene.add(raft);
    this.raftHouses = raft.children;
    this.focusTargets.set('rakit', new THREE.Vector3(rlm.pos[0], 6, riverZ(rlm.pos[0]) + 12));

    // dermaga kayu di beberapa titik
    for (const [x, side] of [[-70, -1], [-30, -1], [26, 1], [58, 1], [-95, -1]]) {
      this.scene.add(buildDock(x, side));
    }
  }

  _buildCity() {
    const rng = makeRng(4242);
    this._place(buildAlQuran(), 'alquran', -0.4, -0.4);
    this._place(buildDowntown(rng), 'kota', 0.18, -0.3);

    // Pasar 16 Ilir dekat Benteng
    const pasar = buildPasar(rng);
    const px = -100, pz = -135;
    pasar.position.set(px, Math.max(groundHeight(px, pz), 0) - 0.2, pz);
    pasar.rotation.y = 0.3;
    this.scene.add(pasar);
  }

  _buildNature() {
    const rng = makeRng(777);
    // area yang harus bebas pohon/rumah (x, z, radius)
    const avoid = [
      [0, 0, 40],                                   // koridor jembatan
      [-115, -82, 42], [-45, -70, 42], [40, -72, 36],
      [40, 72, 32], [-60, 34, 30], [-15, -135, 44],
      [-100, -135, 34],
      [ISLAND.x, ISLAND.z, ISLAND.r + 6],
    ];
    this.scene.add(buildVegetation(rng, avoid));
    this.scene.add(buildKampung(rng, avoid));
    this.scene.add(buildRiverRoads());
  }

  _buildLife() {
    const rng = makeRng(31415);

    /* --- perahu ketek --- */
    const fleet = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const b = buildKetek(rng);
      const dir = rng() > 0.5 ? 1 : -1;
      b.userData = {
        x: -145 + rng() * 290,
        off: (rng() - 0.5) * 34,
        speed: (3.2 + rng() * 4.2) * dir,
        phase: rng() * 6.28,
        dir,
      };
      fleet.add(b);
    }
    this.scene.add(fleet);
    this.keteks = fleet.children;

    /* --- kapal tongkang --- */
    const barges = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const t = buildTongkang();
      t.userData = {
        x: -130 + i * 95 + rng() * 30,
        off: (rng() - 0.5) * 12,
        speed: (2.0 + rng() * 1.4) * (i % 2 === 0 ? 1 : -1),
        phase: rng() * 6.28,
      };
      barges.add(t);
    }
    this.scene.add(barges);
    this.barges = barges.children;

    /* --- lalu lintas --- */
    this.traffic = buildTraffic(rng);
    this.scene.add(this.traffic);
  }

  /* ---------------------------------------------------------------- */
  setTime(key, instant = false) {
    const p = TIME_PRESETS[key];
    if (!p) return;
    this.currentTime = key;
    this._target = p;

    const apply = (t) => {
      const from = this._from || p;
      const lerpC = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), t);

      this.skyUniforms.top.value.copy(lerpC(from.sky[0], p.sky[0]));
      this.skyUniforms.mid.value.copy(lerpC(from.sky[1], p.sky[1]));
      this.skyUniforms.bot.value.copy(lerpC(from.sky[2], p.sky[2]));

      this.scene.fog.color.copy(lerpC(from.fog, p.fog));
      this.scene.fog.density = THREE.MathUtils.lerp(from.fogDensity, p.fogDensity, t);

      this.sun.color.copy(lerpC(from.sun.color, p.sun.color));
      this.sun.intensity = THREE.MathUtils.lerp(from.sun.intensity, p.sun.intensity, t);
      this.sun.position.set(
        THREE.MathUtils.lerp(from.sun.pos[0], p.sun.pos[0], t),
        THREE.MathUtils.lerp(from.sun.pos[1], p.sun.pos[1], t),
        THREE.MathUtils.lerp(from.sun.pos[2], p.sun.pos[2], t)
      );

      this.hemi.color.copy(lerpC(from.hemi.sky, p.hemi.sky));
      this.hemi.groundColor.copy(lerpC(from.hemi.ground, p.hemi.ground));
      this.hemi.intensity = THREE.MathUtils.lerp(from.hemi.intensity, p.hemi.intensity, t);
      this.ambient.intensity = THREE.MathUtils.lerp(from.ambient, p.ambient, t);
      this.renderer.toneMappingExposure = THREE.MathUtils.lerp(from.exposure, p.exposure, t);

      const u = this.waterUniforms;
      u.uDeep.value.copy(lerpC(from.water.deep, p.water.deep));
      u.uShallow.value.copy(lerpC(from.water.shallow, p.water.shallow));
      u.uSky.value.copy(lerpC(from.sky[1], p.sky[1]));
      u.uFogColor.value.copy(this.scene.fog.color);
      u.uFogDensity.value = this.scene.fog.density;
      u.uSunColor.value.copy(this.sun.color);
      u.uSunStrength.value = THREE.MathUtils.lerp(from.water.sun, p.water.sun, t);
      u.uSunDir.value.copy(this.sun.position).normalize();

      const lit = THREE.MathUtils.lerp(from.lightsOn, p.lightsOn, t);
      setLampIntensity(lit * 1.5);
      this.amperaGlow.intensity = lit * 28;
    };

    if (instant) {
      this._from = p;
      apply(1);
      return;
    }
    // transisi halus
    const from = this._from || TIME_PRESETS[this.currentTime];
    this._from = from;
    const start = performance.now();
    const DUR = 900;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / DUR);
      apply(THREE.MathUtils.smoothstep(t, 0, 1));
      if (t < 1) requestAnimationFrame(tick);
      else this._from = p;
    };
    tick();
  }

  /* ---------------------------------------------------------------- */
  focusLandmark(id, duration = 1500) {
    const lm = LANDMARKS.find((l) => l.id === id);
    if (!lm) return;
    const target = this.focusTargets.get(id) || new THREE.Vector3(lm.pos[0], 8, lm.pos[1]);
    const { radius, phi, theta } = lm.focus;
    const dest = new THREE.Vector3(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    this._flyTo(dest, target, duration);
  }

  overview(duration = 1600) {
    this._flyTo(new THREE.Vector3(128, 104, 158), new THREE.Vector3(0, 8, -6), duration);
  }

  _flyTo(pos, target, duration) {
    const c = this.controls;
    const p0 = this.camera.position.clone();
    const t0 = c.target.clone();
    const start = performance.now();
    this._fly = { p0, t0, pos, target, start, duration };
    c.enabled = false;
  }

  _updateFly() {
    if (!this._fly) return;
    const f = this._fly;
    const t = Math.min(1, (performance.now() - f.start) / f.duration);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    this.camera.position.lerpVectors(f.p0, f.pos, e);
    this.controls.target.lerpVectors(f.t0, f.target, e);
    if (t >= 1) {
      this._fly = null;
      this.controls.enabled = true;
    }
  }

  /* ---------------------------------------------------------------- */
  pick(clientX, clientY) {
    this.pointer.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.landmark) return o.userData.landmark;
        o = o.parent;
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------- */
  _bindResize() {
    this._onResize = () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    };
    addEventListener('resize', this._onResize);
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.waterUniforms.uTime.value = t;
    this._updateFly();

    // perahu ketek menyusuri sungai
    for (const b of this.keteks) {
      const u = b.userData;
      u.x += u.speed * dt;
      if (u.x > 150) u.x = -150;
      if (u.x < -150) u.x = 150;
      const cz = riverZ(u.x);
      const half = riverHalf(u.x);
      const off = THREE.MathUtils.clamp(u.off, -half + 6, half - 6);
      b.position.set(u.x, 0.15 + Math.sin(t * 1.6 + u.phase) * 0.22, cz + off);
      b.rotation.y = -riverAngle(u.x) + (u.speed > 0 ? 0 : Math.PI);
      b.rotation.z = Math.sin(t * 1.3 + u.phase) * 0.055;
      b.rotation.x = Math.cos(t * 1.1 + u.phase) * 0.03;
    }

    // kapal tongkang
    for (const b of this.barges) {
      const u = b.userData;
      u.x += u.speed * dt;
      if (u.x > 165) u.x = -165;
      if (u.x < -165) u.x = 165;
      const cz = riverZ(u.x);
      b.position.set(u.x, 0.1 + Math.sin(t * 0.8 + u.phase) * 0.12, cz + u.off);
      b.rotation.y = -riverAngle(u.x) + (u.speed > 0 ? 0 : Math.PI);
      b.rotation.z = Math.sin(t * 0.7 + u.phase) * 0.02;
    }

    // rumah rakit bergoyang pelan
    for (const h of this.raftHouses) {
      const u = h.userData.bob;
      h.position.y = u.base + Math.sin(t * 0.9 + u.phase) * 0.12;
      h.rotation.z = u.rot + Math.sin(t * 0.7 + u.phase) * 0.018;
    }

    // lalu lintas
    this.traffic.userData.update(dt);

    // matahari mengikuti target agar bayangan stabil
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);
  }
}
