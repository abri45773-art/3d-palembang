import * as THREE from 'three';
import { SkyRig } from './sky.js';
import { createWater } from './water.js';
import { buildTerrain } from './terrain.js';
import { buildAmpera, buildMusiII, buildMusiIV } from './bridge.js';
import {
  buildMasjidAgung, buildKutoBesak, buildMonpera, buildTuguBelido,
  buildPasar16, buildMenaraAir, buildPalembangIcon, buildKambangIwak,
  buildMasjidKiMarogan, buildMasjidChengHo,
} from './landmarks.js';
import { buildKampungKapitan, buildAlMunawar, buildRumahRakit } from './kampung.js';
import { buildGeloraSriwijaya, buildJakabaring } from './stadium.js';
import { buildCity } from './city.js';
import { buildTrees, buildStreetLamps, buildTraffic, buildBoats } from './props.js';
import { buildLRT } from './lrt.js';
import { applyNight } from './lights.js';
import { LANDMARK_BY_ID } from '../data/landmarks.js';

export function createWorld(scene, renderer, onStep = () => {}) {
  onStep('menyiapkan langit & cahaya');
  const sky = new SkyRig(scene, renderer);

  onStep('mengalirkan Sungai Musi');
  const water = createWater(sky);
  scene.add(water.mesh);

  onStep('membentuk daratan & jalan');
  const terrain = buildTerrain(scene);

  onStep('mendirikan Jembatan Ampera');
  const ampera = buildAmpera(scene);
  const musiIV = buildMusiIV(scene, 250);
  const musiII = buildMusiII(scene, -290);

  onStep('menata landmark kota');
  const masjidAgung = buildMasjidAgung(scene);
  const kutoBesak = buildKutoBesak(scene);
  const monpera = buildMonpera(scene);
  const belido = buildTuguBelido(scene);
  const pasar16 = buildPasar16(scene);
  const menaraAir = buildMenaraAir(scene);
  const palembangIcon = buildPalembangIcon(scene);
  const kambangIwak = buildKambangIwak(scene);
  const kiMarogan = buildMasjidKiMarogan(scene);
  const chengHo = buildMasjidChengHo(scene);

  onStep('membangun kampung tepian');
  const kapitan = buildKampungKapitan(scene);
  const almunawar = buildAlMunawar(scene);
  const rakit = buildRumahRakit(scene);

  onStep('merampungkan Jakabaring');
  const stadion = buildGeloraSriwijaya(scene);
  const jsc = buildJakabaring(scene);

  onStep('mengisi kota dengan bangunan');
  const city = buildCity(scene);

  onStep('menanam pohon & lampu jalan');
  buildTrees(scene);
  buildStreetLamps(scene, terrain.railPts);

  onStep('menjalankan lalu lintas & ketek');
  const traffic = buildTraffic(scene);
  const boats = buildBoats(scene);

  onStep('menyambungkan jalur LRT');
  const lrt = buildLRT(scene);

  /* ---- pantulan lampu pada air saat malam ---- */
  water.setLight(0, 0, 0, 30, 0.55, '#ffbb66');          // Ampera
  water.setLight(1, -100, -72, 34, 0.45, '#ffd0a0');     // pelataran BKB
  water.setLight(2, 62, -80, 26, 0.3, '#ffcf9a');        // Pasar 16
  water.setLight(3, -66, 84, 26, 0.28, '#ffb877');       // Kampung Kapitan
  water.setLight(4, 250, 0, 30, 0.3, '#bcd8ff');         // Musi IV
  water.setLight(5, 186, -96, 28, 0.26, '#cfe0ff');      // Palembang Icon

  // jangkar label 3D diambil dari data landmark
  const labels = Object.values(LANDMARK_BY_ID).map((l) => ({
    id: l.id, name: l.name, major: !!l.major, pos: new THREE.Vector3(...l.at),
  }));

  let alive = true;
  let night = 0;

  function setNight(n) {
    night = n;
    applyNight(n);
    ampera.night(n);
  }

  function update(dt, t) {
    water.update(dt, scene.fog);
    sky.mesh.position.copy(scene.userData.cameraPos || sky.mesh.position);
    rakit.update(t);
    if (alive) {
      traffic.update(dt);
      boats.update(t, dt);
      lrt.update(t, dt);
    }
  }

  return {
    sky, water, terrain, ampera, city,
    stats: { buildings: city.count, boats: 16, cars: 78 },
    labels, setNight, update,
    setAlive(v) { alive = v; },
  };
}
