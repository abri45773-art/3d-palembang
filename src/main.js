import * as THREE from 'three';
import { PalembangScene } from './scene.js';
import { LANDMARKS } from './data.js';

const $ = (s) => document.querySelector(s);

const loader = $('#loader');
const loaderStatus = $('#loader-status');
const listEl = $('#landmark-list');
const labelsEl = $('#labels');
const infoCard = $('#info-card');
const hintEl = $('#hint');

let app;
let activeId = null;
let tourTimer = null;
let tourIndex = 0;

/* ------------------------------------------------------------------ */
/*  Boot                                                              */
/* ------------------------------------------------------------------ */
(async function boot() {
  const canvas = $('#scene');

  if (!isWebGLAvailable()) {
    loaderStatus.textContent = 'Perangkat tidak mendukung WebGL.';
    return;
  }

  app = new PalembangScene(canvas, (msg) => {
    loaderStatus.textContent = msg;
  });

  await app.init();

  buildLandmarkList();
  buildLabels();
  bindUI();

  loader.classList.add('done');
  setTimeout(() => loader.remove(), 800);

  // sapuan kamera pembuka
  app.camera.position.set(182, 150, 225);
  app.controls.target.set(0, 6, 0);
  setTimeout(() => app.overview(2600), 220);

  setTimeout(() => hintEl && (hintEl.style.opacity = '0'), 9000);

  renderLoop();
})();

function renderLoop() {
  requestAnimationFrame(renderLoop);
  app.controls.update();
  app.update();
  updateLabels();
  updateCompass();
}

/* ------------------------------------------------------------------ */
/*  Daftar landmark                                                   */
/* ------------------------------------------------------------------ */
function buildLandmarkList() {
  listEl.innerHTML = '';
  for (const lm of LANDMARKS) {
    const b = document.createElement('button');
    b.className = 'lm';
    b.dataset.id = lm.id;
    b.innerHTML = `
      <span class="dot" style="background:${lm.color}"></span>
      <span class="txt"><b>${lm.name}</b><small>${lm.short}</small></span>`;
    b.addEventListener('click', () => selectLandmark(lm.id));
    listEl.appendChild(b);
  }
}

/* ------------------------------------------------------------------ */
/*  Label 3D                                                          */
/* ------------------------------------------------------------------ */
const labelNodes = new Map();
const tmpV = new THREE.Vector3();

function buildLabels() {
  labelsEl.innerHTML = '';
  for (const lm of LANDMARKS) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = `<div class="lbl-in"><span class="pin" style="background:${lm.color}"></span>${lm.name}</div><span class="stem"></span>`;
    el.addEventListener('click', () => selectLandmark(lm.id));
    labelsEl.appendChild(el);

    const anchor = app.focusTargets.get(lm.id) || new THREE.Vector3(lm.pos[0], lm.labelY, lm.pos[1]);
    labelNodes.set(lm.id, {
      el,
      pos: new THREE.Vector3(anchor.x, Math.max(anchor.y, lm.labelY * 0.7) + lm.labelY * 0.55, anchor.z),
    });
  }
}

function updateLabels() {
  const cam = app.camera;
  const camPos = cam.position;
  for (const [id, node] of labelNodes) {
    tmpV.copy(node.pos).project(cam);
    const behind = tmpV.z > 1;
    const dist = camPos.distanceTo(node.pos);

    if (behind || dist > 430) {
      node.el.style.opacity = '0';
      node.el.style.pointerEvents = 'none';
      continue;
    }
    const x = (tmpV.x * 0.5 + 0.5) * innerWidth;
    const y = (-tmpV.y * 0.5 + 0.5) * innerHeight;
    node.el.style.transform = `translate(-50%,-100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;

    // memudar saat terlalu jauh / terlalu dekat agar tidak berdesakan
    const fade = dist > 300 ? 1 - (dist - 300) / 130 : 1;
    const isActive = id === activeId;
    node.el.style.opacity = String(Math.max(0, Math.min(1, fade)) * (isActive ? 1 : 0.92));
    node.el.style.zIndex = String(Math.round(2000 - dist));
    node.el.style.pointerEvents = 'auto';
  }
}

function updateCompass() {
  const dir = new THREE.Vector3();
  app.camera.getWorldDirection(dir);
  const ang = Math.atan2(dir.x, dir.z);
  const rose = document.getElementById('compass-rose');
  if (rose) rose.setAttribute('transform', `rotate(${(ang * 180) / Math.PI} 32 32)`);
}

/* ------------------------------------------------------------------ */
/*  Seleksi landmark                                                  */
/* ------------------------------------------------------------------ */
function selectLandmark(id, fly = true) {
  const lm = LANDMARKS.find((l) => l.id === id);
  if (!lm) return;
  activeId = id;

  document.querySelectorAll('.lm').forEach((b) => b.classList.toggle('active', b.dataset.id === id));

  $('#info-kicker').textContent = lm.kicker;
  $('#info-title').textContent = lm.name;
  $('#info-desc').textContent = lm.desc;
  const meta = $('#info-meta');
  meta.innerHTML = lm.meta.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  infoCard.classList.add('show');

  if (fly) app.focusLandmark(id);
  if (hintEl) hintEl.style.opacity = '0';
}

function deselect() {
  activeId = null;
  infoCard.classList.remove('show');
  document.querySelectorAll('.lm').forEach((b) => b.classList.remove('active'));
}

/* ------------------------------------------------------------------ */
/*  UI bindings                                                       */
/* ------------------------------------------------------------------ */
function bindUI() {
  // klik pada scene
  const canvas = $('#scene');
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 450;
    down = null;
    if (moved > 6 || !quick) return;
    const id = app.pick(e.clientX, e.clientY);
    if (id) { stopTour(); selectLandmark(id); }
    else deselect();
  });

  // waktu
  $('#time-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll('#time-seg button').forEach((x) => x.classList.toggle('active', x === b));
    app.setTime(b.dataset.time);
  });

  // tur
  $('#btn-tour').addEventListener('click', () => (tourTimer ? stopTour() : startTour()));

  // bantuan
  const help = $('#help-modal');
  $('#btn-help').addEventListener('click', () => (help.hidden = false));
  $('#help-close').addEventListener('click', () => (help.hidden = true));
  help.addEventListener('click', (e) => { if (e.target === help) help.hidden = true; });

  // tutup info
  $('#info-close').addEventListener('click', deselect);

  // panel
  const panel = $('#landmark-panel');
  $('#btn-collapse').addEventListener('click', () => panel.classList.add('collapsed'));

  // label on/off
  $('#toggle-labels').addEventListener('change', (e) => {
    labelsEl.classList.toggle('hidden', !e.target.checked);
  });

  // keyboard
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { deselect(); help.hidden = true; stopTour(); }
    if (e.key === ' ') { e.preventDefault(); tourTimer ? stopTour() : startTour(); }
    if (e.key.toLowerCase() === 'r') { stopTour(); deselect(); app.overview(); }
    if (e.key >= '1' && e.key <= '9') {
      const lm = LANDMARKS[+e.key - 1];
      if (lm) { stopTour(); selectLandmark(lm.id); }
    }
  });

  // interaksi manual menghentikan tur
  canvas.addEventListener('wheel', stopTour, { passive: true });
}

/* ------------------------------------------------------------------ */
/*  Tur otomatis                                                      */
/* ------------------------------------------------------------------ */
function startTour() {
  $('#btn-tour').classList.add('active');
  tourIndex = 0;
  const step = () => {
    const lm = LANDMARKS[tourIndex % LANDMARKS.length];
    selectLandmark(lm.id);
    tourIndex++;
    tourTimer = setTimeout(step, 5200);
  };
  step();
}

function stopTour() {
  if (!tourTimer) return;
  clearTimeout(tourTimer);
  tourTimer = null;
  $('#btn-tour').classList.remove('active');
}

/* ------------------------------------------------------------------ */
function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
