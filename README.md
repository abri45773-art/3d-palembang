# Miniatur 3D Kota Palembang

Diorama / maket tiga dimensi **Kota Palembang** yang berjalan di peramban (WebGL, [three.js]).
Seluruh kota dirakit secara prosedural dari geometri dan tekstur buatan sendiri — tidak ada
berkas model `.glb`/`.obj` yang diunduh, sehingga repo tetap ringan dan bisa dibuka luring.

![diorama](https://img.shields.io/badge/three.js-0.180-black) ![vite](https://img.shields.io/badge/vite-7-646cff)

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
```

Perintah lain:

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan (Vite) |
| `npm run build` | build produksi ke `dist/` |
| `npm run preview` | pratinjau hasil build |
| `npm test` | uji asap adegan + uji parser shader (tanpa GPU) |

## Kendali

| Aksi | Efek |
| --- | --- |
| Seret / geser | memutar kamera mengelilingi maket |
| Scroll / cubit | zum |
| Klik kanan / dua jari | menggeser pandangan |
| Klik objek atau daftar landmark | kamera terbang ke landmark + kartu info |
| **Fajar · Pagi · Siang · Senja · Malam** | mengubah posisi matahari, warna langit, dan lampu kota |
| **Putar / Label / Hidup / Atas** | rotasi otomatis, nama landmark, animasi lalu lintas, tampak atas |

## Isi maket

**Skala 1 unit = 4 meter.** Sungai Musi mengalir sepanjang sumbu X; Seberang Ilir di utara,
Seberang Ulu di selatan, Jembatan Ampera menyeberang di tengah.

- **Jembatan Ampera** — dua menara 63 m berjarak 75 m, geladak 11,5 m di atas air, lebar 22 m,
  bandul pemberat, rangka baja merah, lampu malam.
- **Sungai Musi** — shader air sendiri: gelombang berjalan, normal analitik, pantulan langit,
  kilau matahari, buih, dan pantulan lampu kota saat malam.
- **Masjid Agung Sultan Mahmud Badaruddin Jayo Wikramo** — kubah bawang, empat kubah sudut,
  menara 45 m (1970), dan menara lama bergaya pagoda.
- **Benteng Kuto Besak** — 288,75 × 183,75 m, dinding 9,99 m setebal 1,99 m, empat bastion,
  gerbang utama menghadap sungai, kolam dan balai agung di dalamnya.
- **Monpera, Tugu Ikan Belido, Pasar 16 Ilir, menara air, Palembang Icon, Taman Kambang Iwak.**
- **Kampung Kapitan, Kampung Arab Al-Munawar, Masjid Ki Marogan, Masjid Cheng Ho.**
- **Rumah rakit** yang bergoyang mengikuti air, **ketek**, tongkang, dan jejak buihnya.
- **LRT Palembang** — jalur layang Bandara SMB II → Jembatan Ampera → Jakabaring, lengkap
  dengan pilar, empat stasiun, dan rangkaian kereta yang berjalan.
- **Gelora Sriwijaya** dan kompleks **Jakabaring Sport City**.
- **Jembatan Musi IV** (kabel pancang) dan **Jembatan Musi II** (rangka baja).
- 488 bangunan prosedural dengan tekstur fasad + `emissiveMap` sehingga jendelanya menyala
  saat malam, jaringan jalan bertrotoar dan marka, 78 kendaraan bergerak, pohon palem dan
  pohon peneduh, lampu jalan, kade bertangga di sepanjang tepian, serta papan nama maket.

## Struktur kode

```
index.html            kerangka UI
src/main.js           renderer, kamera, OrbitControls, loop
src/ui.js             daftar landmark, kartu info, tombol, label 3D, raycast
src/data/landmarks.js deskripsi + fakta + sudut kamera tiap landmark
src/lib/util.js       skala, RNG berbiji, material cache, Kit (merge geometri), kubah/atap
src/lib/textures.js   tekstur kanvas: fasad, genteng, aspal, tanah, papan nama, buih
src/scene/sky.js      kubah langit prosedural + rig matahari/bulan/bintang/kabut
src/scene/water.js    shader Sungai Musi
src/scene/terrain.js  daratan, dasar sungai, kanal, kade, jalan, taman
src/scene/bridge.js   Ampera, Musi IV, Musi II
src/scene/landmarks.js masjid, benteng, monumen, pasar, menara, taman
src/scene/kampung.js  rumah panggung, Kampung Kapitan, Al-Munawar, rumah rakit
src/scene/stadium.js  Gelora Sriwijaya & Jakabaring Sport City
src/scene/city.js     bangunan prosedural
src/scene/props.js    pohon, lampu jalan, lalu lintas, perahu
src/scene/lrt.js      jalur & kereta LRT
src/scene/lights.js   registri material/lampu yang menyala malam hari
scripts/              uji tanpa browser
```

## Verifikasi tanpa GPU

Sandbox/peramban headless tidak selalu tersedia, jadi ada dua pemeriksaan yang bisa dijalankan
di Node dan benar-benar mengeksekusi kode adegan:

- `npm run test:smoke` — merakit **seluruh** dunia (`createWorld`) dengan kanvas tiruan, lalu
  memeriksa jumlah mesh/segitiga, nilai `NaN` pada vertex dan posisi, bounding sphere,
  siklus waktu (fajar → malam), 90 frame animasi, dan kelengkapan data 18 landmark.
- `npm run test:shaders` — mengambil shader dari modul aslinya, menguraikan `#include` three.js,
  lalu mem-parse GLSL-nya untuk menangkap galat sintaks serta memastikan 13 uniform air terkirim.

> Catatan: maket ini adalah **diorama stilasi** untuk keperluan visual — proporsi landmark
> mengikuti angka yang tercantum di atas, tetapi jarak antar-landmark dipadatkan agar seluruh
> kota muat dalam satu bingkai.

## Sumber fakta landmark

- Jembatan Ampera (panjang 1.117 m, lebar 22 m, tinggi 11,5 m, menara 63 m, jarak menara 75 m,
  perubahan warna abu-abu → kuning → merah): detik.com, kemenparekraf-wisatapalembang.org,
  goodnewsfromindonesia.id
- Masjid Agung (dibangun 1738, diresmikan 26 Mei 1748, menara baru ±45 m tahun 1970):
  regional.kompas.com, sumsel.akurat.co
- Benteng Kuto Besak (1780–1797, 288,75 × 183,75 m, tinggi 9,99 m, tebal 1,99 m):
  detik.com, koran-jakarta.com, catatan Balai Arkeologi Palembang
