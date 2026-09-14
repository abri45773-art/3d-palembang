import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWorld } from './scene/world.js';
import { initUI, CameraFly } from './ui.js';

const canvas = document.getElementById('scene');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
} catch (err) {
  document.getElementById('loader').classList.add('done');
  document.getElementById('fatal').classList.remove('hidden');
  throw err;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 6000);
camera.position.set(158, 128, 262);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 18;
controls.maxDistance = 900;
controls.maxPolarAngle = Math.PI * 0.495;
controls.autoRotateSpeed = 0.35;
controls.update();

/* ---------------- rakit dunia ---------------- */
const stepEl = document.getElementById('loader-step');
let world = null;

function boot() {
  world = createWorld(scene, renderer, (msg) => { stepEl.textContent = msg; });
  world.sky.setTime(13);
  world.setNight(0);
  scene.userData.cameraPos = camera.position;

  const fly = new CameraFly(camera, controls);
  const ui = initUI({ renderer, camera, controls, world, fly });

  /* ---------------- loop ---------------- */
  const clock = new THREE.Clock();
  let frames = 0, fpsAt = performance.now();

  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    fly.update(dt);
    controls.update();
    scene.userData.cameraPos = camera.position;
    world.sky.mesh.position.copy(camera.position);
    world.update(dt, t);
    ui.updateLabels();

    renderer.render(scene, camera);

    frames++;
    const now = performance.now();
    if (now - fpsAt > 1000) {
      const fps = Math.round((frames * 1000) / (now - fpsAt));
      const el = document.getElementById('stat');
      if (el && !el.dataset.locked) {
        el.textContent = `${world.stats.buildings.toLocaleString('id-ID')} bangunan · ${fps} fps`;
      }
      frames = 0; fpsAt = now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.getElementById('loader').classList.add('done');
  window.dispatchEvent(new CustomEvent('palembang:ready'));
}

// beri satu frame agar layar loader sempat tampil sebelum perakitan berat
requestAnimationFrame(() => setTimeout(boot, 60));

window.__palembang = {
  get ready() { return !!world; },
  get scene() { return scene; },
  get camera() { return camera; },
  get renderer() { return renderer; },
  get world() { return world; },
};
