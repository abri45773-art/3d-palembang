import * as THREE from 'three';
import { Kit, GROUND, mat, gBox, gCyl, gCurvedRoof, group, rnd, rand } from '../lib/util.js';
import { litMaterial, nightLight } from './lights.js';
import { makeSign } from '../lib/textures.js';

const mWhite = mat('#e8e6df', { roughness: 0.75 });
const mGrey = mat('#b8b6ae', { roughness: 0.8 });
const mConcrete = mat('#9d988c', { roughness: 0.95 });
const mRed = mat('#b0392c', { roughness: 0.7 });
const mSteel = mat('#c6cacd', { roughness: 0.3, metalness: 0.7 });
const mGlass = mat('#2c4250', { roughness: 0.2, metalness: 0.5 });
const litFlood = litMaterial('#ffffff', '#fff2d0', 4.0, { roughness: 0.4 });
const litSeat = litMaterial('#3a3f46', '#5b6a7a', 0.4, { roughness: 0.9 });

/** Lapangan sepak bola dengan garis & rumput bergaris. */
function pitchTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 340;
  const x = c.getContext('2d');
  x.fillStyle = '#3f7a35';
  x.fillRect(0, 0, 512, 340);
  for (let i = 0; i < 10; i++) {
    x.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    x.fillRect((i * 512) / 10, 0, 51.2, 340);
  }
  x.strokeStyle = 'rgba(255,255,255,0.85)';
  x.lineWidth = 4;
  x.strokeRect(20, 18, 472, 304);
  x.beginPath(); x.moveTo(256, 18); x.lineTo(256, 322); x.stroke();
  x.beginPath(); x.arc(256, 170, 46, 0, Math.PI * 2); x.stroke();
  for (const s of [0, 1]) {
    const bx = s ? 20 : 492;
    x.strokeRect(s ? 20 : 392, 92, 100, 156);
    x.strokeRect(s ? 20 : 442, 128, 50, 84);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ================================================================== *
 *  GELORA SRIWIJAYA — Jakabaring Sport City
 * ================================================================== */
export function buildGeloraSriwijaya(parent, x = 232, z = 200) {
  const g = group('gelora-sriwijaya', parent, [x, 0, z]);
  const oval = group('mangkuk', g);
  oval.scale.set(1.5, 1, 1);      // lonjong mengikuti bentuk stadion
  const kit = new Kit();

  // podium & fasad luar
  kit.add(gCyl(35, 37, 1.2, 56, 0, GROUND, 0), mConcrete);
  const facade = new THREE.CylinderGeometry(33.5, 30, 11.5, 56, 1, true);
  facade.translate(0, GROUND + 1.2 + 5.75, 0);
  kit.add(facade, mWhite);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    kit.add(gBox(0.7, 11.5, 1.4, Math.cos(a) * 32.2, GROUND + 1.2, Math.sin(a) * 32.2), mGrey);
  }
  kit.add(gCyl(34.2, 34.2, 0.7, 56, 0, GROUND + 12.7, 0), mGrey);

  // tribun bertingkat
  const tiers = [
    [21.5, 25.5, 3.2, mRed],
    [25.5, 29.5, 3.4, mWhite],
    [29.5, 33.0, 3.6, mRed],
  ];
  let yy = GROUND + 1.4;
  for (const [r0, r1, hh, mm] of tiers) {
    const t = new THREE.CylinderGeometry(r1, r0, hh, 56, 1, true);
    t.translate(0, yy + hh / 2, 0);
    kit.add(t, mm);
    yy += hh;
  }
  kit.add(gCyl(21.5, 21.5, 0.5, 56, 0, GROUND + 1.0, 0), mConcrete);

  // lapangan
  const pitch = new THREE.CircleGeometry(21, 48);
  pitch.rotateX(-Math.PI / 2);
  pitch.scale(1.16, 1, 0.66);
  pitch.translate(0, GROUND + 1.28, 0);
  kit.add(pitch, mat('#ffffff', { map: pitchTexture(), roughness: 0.95 }));

  // atap cincin + kolom
  const roof = new THREE.RingGeometry(27, 39, 60, 1);
  roof.rotateX(-Math.PI / 2);
  roof.translate(0, GROUND + 15.4, 0);
  kit.add(roof, mat('#dcdad2', { roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide }));
  const roof2 = new THREE.RingGeometry(36.5, 39.4, 60, 1);
  roof2.rotateX(-Math.PI / 2);
  roof2.rotateX(0.12);
  roof2.translate(0, GROUND + 14.6, 0);
  kit.add(roof2, mSteel);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    kit.add(gBox(0.5, 3.4, 0.5, Math.cos(a) * 35.5, GROUND + 12.4, Math.sin(a) * 35.5), mSteel);
  }
  kit.build(oval, { castShadow: true, receiveShadow: true, name: 'stadion' });

  /* ---- menara lampu sorot & papan skor ---- */
  const extra = new Kit();
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = sx * 46, pz = sz * 30;
    extra.add(gCyl(0.9, 1.5, 18, 10, px, GROUND, pz), mSteel);
    extra.add(gBox(7, 2.6, 1.2, px, GROUND + 18, pz), mGrey);
    for (let i = -2; i <= 2; i++) extra.add(gBox(1.1, 1.9, 0.4, px + i * 1.35, GROUND + 18.3, pz + sz * 0.7), litFlood);
  }
  // papan skor
  extra.add(gBox(14, 6, 1.0, 0, GROUND + 14, -42), mGrey);
  extra.add(gBox(13, 5, 0.2, 0, GROUND + 14.2, -41.4), mat('#101418', { map: makeSign('SRIWIJAYA'), roughness: 0.5 }));
  extra.add(gBox(1.0, 8, 1.0, -6, GROUND + 6, -42), mSteel);
  extra.add(gBox(1.0, 8, 1.0, 6, GROUND + 6, -42), mSteel);
  extra.build(g, { castShadow: true, receiveShadow: false, name: 'stadion-lampu' });

  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const l = nightLight('#fff0cc', 90, 120, 1.8);
    l.position.set(x + sx * 46, GROUND + 19, z + sz * 30);
    parent.add(l);
  }
  return { group: g, labelAt: [x, GROUND + 24, z] };
}

/* ================================================================== *
 *  Fasilitas Jakabaring Sport City
 * ================================================================== */
export function buildJakabaring(parent, x = 232, z = 200) {
  const g = group('jakabaring-sport-city', parent);
  const kit = new Kit();

  // GOR / hall atletik
  const hall = (hx, hz, w, d, h, m) => {
    kit.add(gBox(w, h, d, hx, GROUND + 0.2, hz), m);
    const roof = new THREE.CylinderGeometry(w * 0.52, w * 0.52, d, 24, 1, false, 0, Math.PI);
    roof.rotateZ(Math.PI / 2);
    roof.rotateY(Math.PI / 2);
    roof.translate(hx, GROUND + 0.2 + h, hz);
    kit.add(roof, mWhite);
    for (let i = -2; i <= 2; i++) kit.add(gBox(w * 0.14, h * 0.5, 0.2, hx + i * (w * 0.2), GROUND + 1.2, hz + d / 2 + 0.1), mGlass);
  };
  hall(170, 258, 40, 26, 7, mWhite);
  hall(300, 252, 44, 30, 8, mWhite);

  // wisma atlet (menara kembar)
  for (const [tx, tz] of [[108, 268], [128, 268], [148, 268], [108, 292], [128, 292], [148, 292]]) {
    kit.add(gBox(13, 16, 10, tx, GROUND, tz), mGrey);
    for (let fl = 0; fl < 5; fl++) {
      for (let i = -2; i <= 2; i++) {
        kit.add(gBox(1.9, 1.6, 0.18, tx + i * 2.5, GROUND + 2 + fl * 2.9, tz + 5.05), litSeat);
        kit.add(gBox(1.9, 1.6, 0.18, tx + i * 2.5, GROUND + 2 + fl * 2.9, tz - 5.05), litSeat);
      }
    }
  }

  // gerbang JSC
  const gx = 96, gz = 150;
  kit.add(gBox(3.0, 12, 3.0, gx - 14, GROUND, gz), mRed);
  kit.add(gBox(3.0, 12, 3.0, gx + 14, GROUND, gz), mRed);
  kit.add(gBox(34, 3.2, 3.4, gx, GROUND + 12, gz), mWhite);
  kit.add(gBox(30, 2.2, 0.3, gx, GROUND + 12.4, gz + 1.8), mat('#101418', { map: makeSign('JAKABARING SPORT CITY'), roughness: 0.5 }));

  // arena akuatik
  kit.add(gBox(34, 6, 26, 300, GROUND, 190), mWhite);
  const rr = new THREE.CylinderGeometry(19, 19, 26, 28, 1, false, 0, Math.PI);
  rr.rotateZ(Math.PI / 2);
  rr.rotateY(Math.PI / 2);
  rr.translate(300, GROUND + 6, 190);
  kit.add(rr, mat('#cfe3ea', { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.85 }));

  kit.build(g, { castShadow: true, receiveShadow: true, name: 'jakabaring' });
  return { group: g, labelAt: [300, GROUND + 20, 190] };
}
