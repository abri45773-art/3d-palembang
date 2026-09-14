/* ------------------------------------------------------------------ *
 *  Data landmark: deskripsi singkat + fakta + sudut kamera.
 *  Sumber fakta: detik.com, kompas.com, kemenparekraf-wisatapalembang,
 *  goodnewsfromindonesia, palembang.go.id (diakses saat pembuatan).
 * ------------------------------------------------------------------ */
export const CATEGORIES = ['Ikon', 'Sungai', 'Sejarah', 'Rumah Ibadah', 'Kampung', 'Olahraga', 'Kota Modern'];

export const LANDMARKS = [
  {
    id: 'ampera', name: 'Jembatan Ampera', cat: 'Ikon', major: true,
    at: [0, 26, 0],
    view: { pos: [96, 46, 104], target: [0, 9, 0] },
    body: 'Jembatan angkat vertikal yang membelah Sungai Musi dan menghubungkan Seberang Ilir dengan Seberang Ulu. Dibangun 1962–1965 dan awalnya bernama Jembatan Bung Karno; namanya diubah menjadi Ampera (Amanat Penderitaan Rakyat) setelah 1966.',
    facts: [
      ['Panjang', '±1.117 m'], ['Lebar', '22 m'],
      ['Tinggi menara', '63 m'], ['Jarak antar menara', '75 m'],
      ['Tinggi di atas air', '11,5 m'], ['Warna', 'abu-abu → kuning → merah'],
    ],
  },
  {
    id: 'musi', name: 'Sungai Musi', cat: 'Sungai', major: true,
    at: [-150, 6, 0],
    view: { pos: [-186, 34, 92], target: [-120, 2, 0] },
    body: 'Urat nadi Kota Palembang sejak masa Sriwijaya. Di perairannya berlalu-lalang ketek, getek, dan tongkang batu bara, sementara rumah rakit berjajar di tepinya.',
    facts: [['Panjang', '±750 km'], ['Peran', 'transportasi & perdagangan'], ['Ciri', 'air keruh kecokelatan']],
  },
  {
    id: 'masjid-agung', name: 'Masjid Agung SMB Jayo Wikramo', cat: 'Rumah Ibadah', major: true,
    at: [-34, 26, -106],
    view: { pos: [16, 30, -46], target: [-34, 10, -106] },
    body: 'Masjid Kesultanan Palembang Darussalam yang dibangun mulai 1738 dan diresmikan 26 Mei 1748 pada masa Sultan Mahmud Badaruddin I. Arsitekturnya memadukan unsur Melayu, Tionghoa, dan Timur Tengah: menara lamanya bergaya pagoda, kubah utamanya bergaya Timur Tengah.',
    facts: [['Dibangun', '1738'], ['Diresmikan', '26 Mei 1748'], ['Menara baru', '±45 m (1970)'], ['Gaya', 'Melayu · Tionghoa · Timur Tengah']],
  },
  {
    id: 'kuto-besak', name: 'Benteng Kuto Besak', cat: 'Sejarah', major: true,
    at: [-100, 12, -108],
    view: { pos: [-36, 38, -44], target: [-100, 4, -104] },
    body: 'Keraton berbenteng Kesultanan Palembang Darussalam, digagas Sultan Mahmud Badaruddin I dan dirampungkan Sultan Muhammad Bahauddin. Sering disebut satu-satunya benteng di Indonesia yang dibangun pribumi untuk pertahanan.',
    facts: [['Pembangunan', '1780–1797'], ['Ukuran', '288,75 × 183,75 m'], ['Tinggi dinding', '9,99 m'], ['Tebal dinding', '1,99 m']],
  },
  {
    id: 'monpera', name: 'Monumen Perjuangan Rakyat', cat: 'Sejarah',
    at: [22, 16, -78],
    view: { pos: [54, 18, -44], target: [22, 6, -78] },
    body: 'Monpera berdiri di ujung utara Jembatan Ampera, menghadap pelataran Benteng Kuto Besak. Di dalamnya tersimpan diorama perjuangan rakyat Palembang, termasuk Perang Menteng 1819.',
    facts: [['Tinggi', '±17 m'], ['Lokasi', 'ujung utara Jembatan Ampera']],
  },
  {
    id: 'belido', name: 'Tugu Ikan Belido', cat: 'Ikon',
    at: [-100, 14, -66],
    view: { pos: [-66, 14, -34], target: [-100, 6, -66] },
    body: 'Patung ikan belido perak melengkung di atas kolam pada pelataran Benteng Kuto Besak. Ikan belido adalah bahan baku pempek dan kerupuk khas Palembang.',
    facts: [['Lokasi', 'Pelataran BKB'], ['Ikon', 'spot foto tepi Musi']],
  },
  {
    id: 'kapitan', name: 'Kampung Kapitan', cat: 'Kampung',
    at: [-66, 16, 96],
    view: { pos: [-66, 26, 158], target: [-66, 6, 98] },
    body: 'Permukiman Tionghoa tertua di tepi Musi. Rumah-rumah panggung kayunya berpadu dengan kelenteng keluarga dan lampion merah yang menyala saat malam.',
    facts: [['Ciri', 'rumah panggung kayu'], ['Lokasi', 'Seberang Ulu, tepi Musi']],
  },
  {
    id: 'al-munawar', name: 'Kampung Arab Al-Munawar', cat: 'Kampung',
    at: [42, 14, 84],
    view: { pos: [42, 24, 146], target: [42, 6, 86] },
    body: 'Kampung keturunan Arab yang tumbuh sejak abad ke-19. Rumah-rumah panggung kayu ulinnya berusia ratusan tahun dan masih dihuni hingga kini.',
    facts: [['Ciri', 'rumah panggung kayu ulin'], ['Usia', 'ratusan tahun']],
  },
  {
    id: 'rakit', name: 'Rumah Rakit', cat: 'Kampung',
    at: [-214, 8, -50],
    view: { pos: [-238, 20, 8], target: [-200, 3, -50] },
    body: 'Rumah terapung di atas rakit bambu yang naik-turun mengikuti pasang-surut Musi. Dahulu menjadi tempat tinggal, kini banyak yang beralih menjadi rumah makan terapung.',
    facts: [['Pondasi', 'rakit bambu'], ['Fungsi', 'hunian & rumah makan']],
  },
  {
    id: 'ki-marogan', name: 'Masjid Ki Marogan', cat: 'Rumah Ibadah',
    at: [-172, 18, 84],
    view: { pos: [-172, 24, 146], target: [-172, 8, 84] },
    body: 'Masjid bersejarah abad ke-19 peninggalan Kemas Muhammad Akib (Ki Marogan), berdiri di pertemuan Sungai Ogan dan Sungai Musi.',
    facts: [['Abad', 'ke-19'], ['Lokasi', 'muara Ogan–Musi']],
  },
  {
    id: 'cheng-ho', name: 'Masjid Cheng Ho', cat: 'Rumah Ibadah',
    at: [300, 16, 130],
    view: { pos: [300, 22, 186], target: [300, 8, 130] },
    body: 'Masjid bergaya klenteng dengan atap pagoda bertingkat dan dominasi warna merah, penanda akulturasi Tionghoa–Islam di Palembang.',
    facts: [['Gaya', 'pagoda Tionghoa'], ['Kawasan', 'Jakabaring']],
  },
  {
    id: 'pasar-16', name: 'Pasar 16 Ilir', cat: 'Kota Modern',
    at: [62, 22, -100],
    view: { pos: [112, 26, -56], target: [62, 8, -100] },
    body: 'Pasar tradisional terbesar di tepian Musi. Sejak lama menjadi pusat perdagangan tekstil dan kebutuhan pokok bagi seluruh Sumatera Selatan.',
    facts: [['Jenis', 'pasar tradisional bertingkat'], ['Lokasi', '16 Ilir, tepi Musi']],
  },
  {
    id: 'palembang-icon', name: 'Palembang Icon', cat: 'Kota Modern',
    at: [178, 50, -127],
    view: { pos: [230, 52, -66], target: [178, 18, -127] },
    body: 'Kawasan pusat perbelanjaan dan menara hotel yang menandai wajah modern pusat kota, berdampingan dengan kawasan kolonial di sekitarnya.',
    facts: [['Fungsi', 'mal & hotel'], ['Kawasan', 'pusat kota Ilir']],
  },
  {
    id: 'kambang-iwak', name: 'Taman Kambang Iwak', cat: 'Kota Modern',
    at: [150, 12, -196],
    view: { pos: [150, 44, -134], target: [150, 3, -196] },
    body: 'Taman kota peninggalan masa kolonial dengan danau kecil dan air mancur, dikelilingi rumah-rumah dinas bergaya Indies. Favorit warga untuk olahraga pagi.',
    facts: [['Ciri', 'danau & air mancur'], ['Fungsi', 'ruang terbuka kota']],
  },
  {
    id: 'lrt', name: 'LRT Palembang', cat: 'Kota Modern', major: true,
    at: [0, 16, 30],
    view: { pos: [70, 26, 62], target: [0, 10, 20] },
    body: 'Kereta ringan pertama di Indonesia yang beroperasi, dibangun untuk Asian Games 2018. Rutenya menghubungkan Bandara SMB II dengan Jakabaring dan melintas di atas Jembatan Ampera.',
    facts: [['Beroperasi', '2018'], ['Panjang lintasan', '±23 km'], ['Rute', 'Bandara SMB II ↔ DJKA/Jakabaring']],
  },
  {
    id: 'gelora-sriwijaya', name: 'Gelora Sriwijaya Jakabaring', cat: 'Olahraga', major: true,
    at: [232, 28, 200],
    view: { pos: [232, 62, 316], target: [232, 8, 200] },
    body: 'Stadion utama di Jakabaring Sport City, tuan rumah PON 2004, SEA Games 2011, dan Asian Games 2018. Di sekitarnya berdiri GOR, arena akuatik, dan wisma atlet.',
    facts: [['Kawasan', 'Jakabaring Sport City'], ['Ajang', 'PON 2004 · SEA Games 2011 · Asian Games 2018']],
  },
  {
    id: 'musi-iv', name: 'Jembatan Musi IV', cat: 'Ikon',
    at: [250, 14, 0],
    view: { pos: [250, 34, 104], target: [250, 6, 0] },
    body: 'Jembatan kabel pancang di sisi timur kota yang dibuka awal 2019 untuk membagi beban lalu lintas Jembatan Ampera.',
    facts: [['Jenis', 'kabel pancang'], ['Dibuka', 'awal 2019']],
  },
  {
    id: 'musi-ii', name: 'Jembatan Musi II', cat: 'Ikon',
    at: [-290, 12, 0],
    view: { pos: [-290, 32, 100], target: [-290, 5, 0] },
    body: 'Jembatan rangka baja di sisi barat kota, jalur lintas timur yang menghubungkan Palembang dengan kawasan hulu Musi.',
    facts: [['Jenis', 'rangka baja'], ['Fungsi', 'lintas timur Sumatera']],
  },
];

export const LANDMARK_BY_ID = Object.fromEntries(LANDMARKS.map((l) => [l.id, l]));
