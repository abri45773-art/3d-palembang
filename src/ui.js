import * as THREE from 'three';
import { LANDMARKS, CATEGORIES } from './data/landmarks.js';

const $ = (sel) => document.querySelector(sel);

/** Animasi perpindahan kamera yang halus. */
export class CameraFly {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.active = false;
    this.t = 0;
    this.dur = 1.6;
    this.fromPos = new THREE.Vector3();
    this.toPos = new THREE.Vector3();
    this.fromTgt = new THREE.Vector3();
    this.toTgt = new THREE.Vector3();
  }
  to(pos, target, dur = 1.6) {
    this.fromPos.copy(this.camera.position);
    this.fromTgt.copy(this.controls.target);
    this.toPos.set(...pos);
    this.toTgt.set(...target);
    this.t = 0;
    this.dur = dur;
    this.active = true;
  }
  update(dt) {
    if (!this.active) return;
    this.t = Math.min(1, this.t + dt / this.dur);
    const e = this.t < 0.5 ? 4 * this.t ** 3 : 1 - (-2 * this.t + 2) ** 3 / 2;
    this.camera.position.lerpVectors(this.fromPos, this.toPos, e);
    this.controls.target.lerpVectors(this.fromTgt, this.toTgt, e);
    if (this.t >= 1) this.active = false;
  }
}

export function initUI({ renderer, camera, controls, world, fly }) {
  /* ---------------- daftar landmark ---------------- */
  const listEl = $('#landmark-list');
  const infoEl = $('#info');
  const buttons = new Map();

  for (const cat of CATEGORIES) {
    const items = LANDMARKS.filter((l) => l.cat === cat);
    if (!items.length) continue;
    const h = document.createElement('div');
    h.className = 'grp-title';
    h.textContent = cat;
    listEl.appendChild(h);
    for (const l of items) {
      const b = document.createElement('button');
      b.className = 'lm';
      b.dataset.id = l.id;
      b.innerHTML = `<span class="dot"></span><span>${l.name}<small>${l.cat}</small></span>`;
      b.addEventListener('click', () => select(l.id));
      listEl.appendChild(b);
      buttons.set(l.id, b);
    }
  }

  $('#stat').textContent = `${world.stats.buildings.toLocaleString('id-ID')} bangunan · ${world.stats.cars} kendaraan · ${world.stats.boats} perahu`;

  /* ---------------- pencarian ---------------- */
  $('#search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    buttons.forEach((b, id) => {
      const l = LANDMARKS.find((x) => x.id === id);
      b.style.display = !q || l.name.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  /* ---------------- panel buka/tutup ---------------- */
  const panel = $('#panel');
  const panelOpen = $('#panel-open');
  $('#panel-close').addEventListener('click', () => {
    panel.classList.add('hidden');
    panelOpen.classList.remove('hidden');
  });
  panelOpen.classList.add('hidden');
  panelOpen.addEventListener('click', () => {
    panel.classList.remove('hidden');
    panelOpen.classList.add('hidden');
  });

  /* ---------------- kartu info ---------------- */
  let current = null;
  function select(id) {
    const l = LANDMARKS.find((x) => x.id === id);
    if (!l) return;
    current = id;
    buttons.forEach((b, bid) => b.classList.toggle('active', bid === id));
    $('#info-cat').textContent = l.cat;
    $('#info-title').textContent = l.name;
    $('#info-body').textContent = l.body;
    $('#info-facts').innerHTML = l.facts
      .map(([k, v]) => `<div class="fact"><span>${k}</span><b>${v}</b></div>`)
      .join('');
    infoEl.classList.remove('hidden');
    fly.to(l.view.pos, l.view.target, 1.7);
    controls.autoRotate = false;
    $('#t-rotate').classList.remove('active');
  }
  $('#info-close').addEventListener('click', () => {
    infoEl.classList.add('hidden');
    buttons.forEach((b) => b.classList.remove('active'));
    current = null;
  });

  /* ---------------- waktu / pencahayaan ---------------- */
  const hourEl = $('#hour');
  function setHour(h, fromSlider = false) {
    const n = world.sky.setTime(h);
    world.setNight(n);
    if (!fromSlider) hourEl.value = String(h);
    const active = document.querySelector('#time-presets button.active');
    if (active && !fromSlider) active.classList.remove('active');
  }
  $('#time-presets').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll('#time-presets button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    setHour(parseFloat(b.dataset.hour));
  });
  hourEl.addEventListener('input', () => setHour(parseFloat(hourEl.value), true));

  /* ---------------- tombol toggle ---------------- */
  const bind = (sel, fn) => {
    const el = $(sel);
    el.addEventListener('click', () => {
      el.classList.toggle('active');
      fn(el.classList.contains('active'));
    });
  };
  bind('#t-rotate', (v) => { controls.autoRotate = v; });
  bind('#t-labels', (v) => { $('#labels').style.display = v ? '' : 'none'; });
  bind('#t-traffic', (v) => { world.setAlive(v); });
  bind('#t-top', (v) => {
    if (v) fly.to([0, 470, 12], [0, 0, 0], 1.5);
    else fly.to([150, 120, 250], [0, 8, 0], 1.5);
  });
  controls.autoRotate = true;

  /* ---------------- label 3D ---------------- */
  const labelsEl = $('#labels');
  const labelEls = world.labels.map((l) => {
    const el = document.createElement('div');
    el.className = 'label' + (l.major ? ' major' : '');
    el.textContent = l.name;
    labelsEl.appendChild(el);
    return { ...l, el };
  });
  const proj = new THREE.Vector3();

  function updateLabels() {
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    const camDist = camera.position.length();
    for (const l of labelEls) {
      proj.copy(l.pos).project(camera);
      const behind = proj.z > 1;
      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      const far = camDist > 760;
      const show = !behind && !far && x > -80 && x < w + 80 && y > -40 && y < h + 40;
      l.el.style.display = show ? '' : 'none';
      if (show) {
        l.el.style.transform = `translate(-50%,-100%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
        l.el.style.opacity = String(Math.max(0.25, 1 - camDist / 900));
      }
    }
  }

  /* ---------------- klik pada objek ---------------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const dx = e.clientX - downAt[0], dy = e.clientY - downAt[1];
    downAt = null;
    if (Math.hypot(dx, dy) > 6) return;          // itu gestur geser, bukan klik
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    let best = null, bestD = Infinity;
    for (const l of LANDMARKS) {
      const p = new THREE.Vector3(...l.at);
      const d = ray.ray.distanceSqToPoint(p);
      const along = ray.ray.direction.dot(p.clone().sub(ray.ray.origin));
      if (d < 400 && along > 0 && d < bestD) { bestD = d; best = l.id; }
    }
    if (best) select(best);
  });

  return { select, updateLabels, setHour, get current() { return current; } };
}
