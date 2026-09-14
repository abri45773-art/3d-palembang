/** Uji integrasi: jalankan alur scene.js tanpa WebGL untuk menangkap error runtime. */
import * as THREE from 'three';
import { LANDMARKS, TIME_PRESETS } from '../src/data.js';
import { setLampIntensity } from '../src/lib/kit.js';

let fail = 0;
const t = (name, fn) => { try { fn(); console.log('ok   ' + name); } catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message); } };

t('data: 9 landmark unik', () => {
  const ids = LANDMARKS.map(l => l.id);
  if (new Set(ids).size !== ids.length) throw new Error('id duplikat');
  if (ids.length !== 9) throw new Error('jumlah=' + ids.length);
  for (const l of LANDMARKS) {
    for (const k of ['name','short','color','pos','labelY','focus','kicker','desc','meta'])
      if (l[k] === undefined) throw new Error(l.id + ' tanpa ' + k);
    if (!Array.isArray(l.meta) || l.meta.length < 3) throw new Error(l.id + ' meta kurang');
    if (!/^#[0-9a-f]{6}$/i.test(l.color)) throw new Error(l.id + ' warna invalid');
    const f = l.focus;
    if (!(f.radius > 20 && f.phi > 0 && f.phi < Math.PI/2)) throw new Error(l.id + ' focus invalid');
  }
});

t('preset waktu lengkap', () => {
  for (const k of ['pagi','senja','malam']) {
    const p = TIME_PRESETS[k];
    if (!p) throw new Error('preset ' + k + ' hilang');
    if (p.sky.length !== 3) throw new Error(k + ' sky');
    for (const key of ['fog','fogDensity','sun','hemi','ambient','water','exposure','lightsOn'])
      if (p[key] === undefined) throw new Error(k + ' tanpa ' + key);
    if (p.lightsOn < 0 || p.lightsOn > 1) throw new Error(k + ' lightsOn range');
  }
  if (TIME_PRESETS.malam.lightsOn !== 1) throw new Error('malam harus lampu penuh');
  if (TIME_PRESETS.pagi.lightsOn !== 0) throw new Error('pagi harus lampu mati');
});

t('setLampIntensity tidak error', () => { setLampIntensity(0); setLampIntensity(1.5); });

t('focus kamera tidak menembus tanah', async () => {
  for (const l of LANDMARKS) {
    const { radius, phi } = l.focus;
    const y = radius * Math.cos(phi);
    if (y < 4) throw new Error(l.id + ' kamera terlalu rendah y=' + y.toFixed(1));
  }
});

console.log(fail ? `\n${fail} GAGAL` : '\nsemua lolos');
process.exit(fail ? 1 : 0);
