import * as THREE from 'three';
import { mulberry32 } from './util.js';

function canvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function toTexture(c, { srgb = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------------------ *
 * Fasad bangunan: peta warna + peta emissive (jendela menyala malam)
 * ------------------------------------------------------------------ */
export function makeFacade({ base, cols = 4, rows = 3, litChance = 0.45, seed = 1, glass = '#2b3a45' }) {
  const rnd = mulberry32(seed);
  const S = 256;
  const c = canvas(S), e = canvas(S);
  const x = c.getContext('2d'), xe = e.getContext('2d');

  // dinding dasar + gradasi kotoran
  x.fillStyle = base;
  x.fillRect(0, 0, S, S);
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, 'rgba(255,255,255,0.10)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.02)');
  g.addColorStop(1, 'rgba(0,0,0,0.16)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);

  xe.fillStyle = '#000';
  xe.fillRect(0, 0, S, S);

  const cw = S / cols, ch = S / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const px = col * cw, py = r * ch;
      const isGround = r === rows - 1;
      const pad = cw * (isGround ? 0.16 : 0.22);
      const ww = cw - pad * 2;
      const wh = ch - pad * 2.1;

      // kusen
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.fillRect(px + pad - 2, py + pad - 2, ww + 4, wh + 4);

      if (isGround && cols > 2) {
        // lantai dasar: pintu / rolling door ruko
        x.fillStyle = rnd() > 0.5 ? '#5d4a38' : '#6f6a5e';
        x.fillRect(px + pad, py + pad, ww, wh);
        x.fillStyle = 'rgba(255,255,255,0.07)';
        for (let i = 0; i < 7; i++) x.fillRect(px + pad, py + pad + (wh / 7) * i, ww, 1.4);
      } else {
        x.fillStyle = glass;
        x.fillRect(px + pad, py + pad, ww, wh);
        x.fillStyle = 'rgba(255,255,255,0.16)';
        x.fillRect(px + pad, py + pad, ww, wh * 0.32);
        x.strokeStyle = 'rgba(0,0,0,0.35)';
        x.lineWidth = 1.2;
        x.strokeRect(px + pad, py + pad, ww, wh);
        x.beginPath();
        x.moveTo(px + pad + ww / 2, py + pad);
        x.lineTo(px + pad + ww / 2, py + pad + wh);
        x.stroke();

        if (rnd() < litChance) {
          const warm = rnd();
          const col2 = warm > 0.65 ? '#ffd9a0' : warm > 0.3 ? '#ffe9c4' : '#cfe6ff';
          const a = 0.55 + rnd() * 0.45;
          xe.fillStyle = col2;
          xe.globalAlpha = a;
          xe.fillRect(px + pad, py + pad, ww, wh);
          xe.globalAlpha = 1;
        }
      }
    }
  }
  return { map: toTexture(c), emissiveMap: toTexture(e, { srgb: true }) };
}

/** Atap genteng / seng dengan garis-garis rusuk. */
export function makeRoof(color = '#a4573c', rows = 10) {
  const S = 128;
  const c = canvas(S), x = c.getContext('2d');
  x.fillStyle = color;
  x.fillRect(0, 0, S, S);
  const rh = S / rows;
  for (let i = 0; i < rows; i++) {
    x.fillStyle = 'rgba(0,0,0,0.16)';
    x.fillRect(0, i * rh, S, 2);
    x.fillStyle = 'rgba(255,255,255,0.06)';
    x.fillRect(0, i * rh + 3, S, rh - 5);
  }
  return toTexture(c);
}

/** Aspal jalan dengan bintik halus. */
export function makeAsphalt(base = '#33373c') {
  const S = 128, c = canvas(S), x = c.getContext('2d');
  const rnd = mulberry32(77);
  x.fillStyle = base;
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const v = rnd();
    x.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)';
    x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6);
  }
  return toTexture(c);
}

/** Tanah/rumput maket. */
export function makeGround(base = '#7f8b5c') {
  const S = 256, c = canvas(S), x = c.getContext('2d');
  const rnd = mulberry32(4242);
  x.fillStyle = base;
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) {
    const t = rnd();
    x.fillStyle = t > 0.66 ? 'rgba(255,255,255,0.05)' : t > 0.33 ? 'rgba(0,0,0,0.07)' : 'rgba(120,140,60,0.10)';
    x.fillRect(rnd() * S, rnd() * S, 2.2, 2.2);
  }
  return toTexture(c);
}

/** Tekstur untuk sisi dasar maket (penampang tanah). */
export function makeEarth() {
  const S = 128, c = canvas(S), x = c.getContext('2d');
  const rnd = mulberry32(99);
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#7a6a4f');
  g.addColorStop(0.12, '#5f503a');
  g.addColorStop(1, '#3b3226');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.16)';
    const w = 2 + rnd() * 16;
    x.fillRect(rnd() * S, rnd() * S, w, 1.6);
  }
  return toTexture(c);
}

/** Papan nama pada tepi maket. */
export function makeNamePlate(text = 'PALEMBANG', sub = 'KOTA · BUMI SRIWIJAYA') {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#15181c';
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = 'rgba(224,180,90,0.55)';
  x.lineWidth = 3;
  x.strokeRect(10, 10, c.width - 20, c.height - 20);
  x.fillStyle = '#e0b45a';
  x.font = '600 62px "Segoe UI", system-ui, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.letterSpacing = '14px';
  x.fillText(text, c.width / 2, 52);
  x.fillStyle = 'rgba(238,242,244,0.72)';
  x.font = '400 26px "Segoe UI", system-ui, sans-serif';
  x.letterSpacing = '8px';
  x.fillText(sub, c.width / 2, 98);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Jejak buih di belakang perahu. */
export function makeWake() {
  const S = 128, c = canvas(S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  return toTexture(c, { srgb: true, repeat: false });
}

/** Papan penanda stadion/gedung. */
export function makeSign(text, bg = '#8e2b23', fg = '#f6e7c6') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.fillStyle = fg;
  x.font = '700 52px "Segoe UI", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
