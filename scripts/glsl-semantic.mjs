/* ------------------------------------------------------------------ *
 *  Pemeriksaan SEMANTIK shader (bukan sekadar sintaks).
 *
 *  Parser GLSL hanya menolak galat tata bahasa; ia tetap menerima
 *  `uSunDirr` yang salah ketik. Skrip ini mengumpulkan setiap
 *  identifier yang dideklarasi lalu membandingkannya dengan identifier
 *  yang benar-benar dipakai. Selisihnya = kemungkinan bug.
 *
 *  PENTING: skrip ini juga menguji dirinya sendiri (selfTest).
 *  Pemeriksa yang selalu menjawab "bersih" lebih berbahaya daripada
 *  tidak ada pemeriksa sama sekali.
 * ------------------------------------------------------------------ */

/** Nama bawaan GLSL ES + yang disuntikkan three.js ke setiap shader. */
const BUILTINS = new Set([
  'void','bool','int','uint','float','double','vec2','vec3','vec4','ivec2','ivec3','ivec4',
  'uvec2','uvec3','uvec4','bvec2','bvec3','bvec4','mat2','mat3','mat4','mat2x2','mat2x3',
  'mat2x4','mat3x2','mat3x3','mat3x4','mat4x2','mat4x3','mat4x4','sampler2D','sampler3D',
  'samplerCube','sampler2DArray','isampler2D','usampler2D','sampler2DShadow',
  'sin','cos','tan','asin','acos','atan','pow','exp','log','exp2','log2','sqrt','inversesqrt',
  'abs','sign','floor','ceil','fract','mod','min','max','clamp','mix','step','smoothstep',
  'length','distance','dot','cross','normalize','faceforward','reflect','refract',
  'matrixCompMult','lessThan','lessThanEqual','greaterThan','greaterThanEqual','equal',
  'notEqual','any','all','not','texture','texture2D','textureProj','dFdx','dFdy','fwidth',
  'radians','degrees','transpose','inverse','determinant','outerProduct','isnan','isinf',
  'round','roundEven','trunc','sinh','cosh','tanh','asinh','acosh','atanh',
  'gl_Position','gl_FragColor','gl_FragCoord','gl_PointSize','gl_PointCoord','gl_FrontFacing',
  'gl_FragDepth','gl_VertexID','gl_InstanceID','gl_DepthRange',
  'position','normal','uv','uv2','color','tangent',
  'true','false','const','in','out','inout','uniform','varying','attribute','struct',
  'return','if','else','for','while','do','break','continue','discard','switch','case',
  'default','precision','highp','mediump','lowp','layout','flat','smooth','centroid',
  'modelMatrix','modelViewMatrix','projectionMatrix','viewMatrix','normalMatrix',
  'cameraPosition','isOrthographic','toneMapping','toneMappingExposure','linearToOutputTexel',
]);

/** Tipe GLSL — penanda bahwa kata sesudahnya adalah nama yang dideklarasi. */
const TYPES = new Set([
  'void','bool','int','uint','float','double',
  'vec2','vec3','vec4','ivec2','ivec3','ivec4','uvec2','uvec3','uvec4','bvec2','bvec3','bvec4',
  'mat2','mat3','mat4','mat2x2','mat2x3','mat2x4','mat3x2','mat3x3','mat3x4','mat4x2','mat4x3','mat4x4',
  'sampler2D','sampler3D','samplerCube','sampler2DArray','isampler2D','usampler2D','sampler2DShadow',
]);

const stripNoise = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/#[^\n]*/g, ' ');

/**
 * Kumpulkan identifier yang dideklarasi.
 * Setiap "<tipe> <nama>" adalah sebuah deklarasi — uniform, varying,
 * parameter fungsi, variabel lokal, maupun nama fungsi beserta tipe
 * kembaliannya. Lebih tahan bising daripada mencocokkan bentuk kalimat.
 */
export function declaredNames(src) {
  const names = new Set();
  const s = stripNoise(src);
  // Lookahead (bukan konsumsi) untuk nama kedua: tanpa ini, pada
  // "uniform vec3 uSunDir" pasangan `uniform vec3` sudah terpakai sehingga
  // `vec3 uSunDir` tidak pernah diperiksa dan uSunDir lolos sebagai "tak dikenal".
  for (const m of s.matchAll(/\b([A-Za-z_]\w*)\s+(?=([A-Za-z_]\w*)\b)/g)) {
    if (TYPES.has(m[1])) names.add(m[2]);
  }
  for (const m of s.matchAll(/\b([A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)\b/g)) {
    if (TYPES.has(m[1])) { names.add(m[2]); names.add(m[3]); }
  }
  for (const m of s.matchAll(/\bstruct\s+([A-Za-z_]\w*)/g)) names.add(m[1]);
  return names;
}

/** Kumpulkan identifier yang dipakai (bukan setelah titik). */
export function usedNames(src) {
  const s = stripNoise(src);
  const used = new Set();
  for (const m of s.matchAll(/(\.)?\b([A-Za-z_]\w*)\b/g)) {
    if (m[1]) continue;                       // .xyz / .field -> anggota
    used.add(m[2]);
  }
  return used;
}

/** @returns {{unknown:string[], declared:number, used:number}} */
export function semanticCheck(src) {
  const declared = declaredNames(src);
  const used = usedNames(src);
  const unknown = [...used]
    .filter((n) => !declared.has(n) && !BUILTINS.has(n) && !/^[A-Z][A-Z0-9_]*$/.test(n))
    .sort();
  return { unknown, declared: declared.size, used: used.size };
}

/* ------------------------------------------------------------------ *
 *  Uji mandiri: pemeriksa ini HARUS menangkap bug, dan HARUS membebaskan
 *  kode yang benar. Kalau salah satu gagal, hasil "bersih" tidak berarti.
 * ------------------------------------------------------------------ */
export function selfTest() {
  const cases = [
    {
      label: 'kode benar dibebaskan',
      src: `uniform vec3 uSunDir; uniform float uTime; varying vec3 vWorld;
            float wave(vec2 p){ return sin(p.x + uTime); }
            void main(){ vec3 n = normalize(vWorld);
                         gl_FragColor = vec4(n * wave(vWorld.xz) * uSunDir, 1.0); }`,
      expect: [],
    },
    {
      label: 'uniform salah ketik tertangkap',
      src: `uniform vec3 uSunDir; varying vec3 vWorld;
            void main(){ gl_FragColor = vec4(vWorld * uSunDirr, 1.0); }`,
      expect: ['uSunDirr'],
    },
    {
      label: 'variabel lokal tak dideklarasi tertangkap',
      src: `uniform vec3 uCol; varying vec3 vN;
            void main(){ vec3 a = normalize(vN); gl_FragColor = vec4(a + bbb, 1.0); }`,
      expect: ['bbb'],
    },
    {
      label: 'pemanggilan fungsi tak dikenal tertangkap',
      src: `varying vec3 vN;
            void main(){ vec3 a = normaliz(vN); gl_FragColor = vec4(a, 1.0); }`,
      expect: ['normaliz'],
    },
  ];

  const failures = [];
  for (const c of cases) {
    const got = semanticCheck(c.src).unknown;
    const ok = JSON.stringify(got) === JSON.stringify(c.expect);
    if (!ok) failures.push(`${c.label}: diharapkan [${c.expect}], dapat [${got}]`);
  }
  return failures;
}
