import { BLOCK_DEPTH, FIELD_GLSL, ISLANDS, LINKS, STRATUM, WATER_LEVEL } from "@/lib/field";

/**
 * Tous les matériaux du site. Couleurs en sRGB directement (le renderer est
 * configuré en sortie linéaire/sans tone mapping), pour que le papier WebGL
 * soit au pixel près le papier CSS.
 */

const PALETTE = /* glsl */ `
const vec3 PAPER = vec3(0.925, 0.898, 0.835);
const vec3 PAPER_SHADE = vec3(0.835, 0.800, 0.722);
const vec3 INK = vec3(0.110, 0.141, 0.188);
const vec3 GRAPHITE = vec3(0.431, 0.416, 0.376);
const vec3 RED = vec3(0.761, 0.255, 0.176);
const vec3 WATER_C = vec3(0.333, 0.494, 0.627);
const vec3 OCRE = vec3(0.788, 0.639, 0.416);
const vec3 CLAY = vec3(0.725, 0.541, 0.416);
const vec3 SCHIST = vec3(0.490, 0.482, 0.455);
const vec3 OXIDE = vec3(0.557, 0.290, 0.196);
const vec3 BASEMENT = vec3(0.227, 0.227, 0.235);
const float DEPTH = ${BLOCK_DEPTH.toFixed(3)};
const float STRATUM = ${STRATUM.toFixed(3)};
const float WATER = ${WATER_LEVEL.toFixed(3)};
`;

const COMMON = /* glsl */ `
uniform vec3 uLens;      // x, z, force
uniform float uLensLift;
uniform float uCut;
uniform float uWater;
uniform float uLiquid;
uniform float uDusk;
uniform vec4 uPulse;     // x, z, t0, -
uniform float uHi;       // strate surlignée

float lensField(vec2 p, float r2) {
  vec2 d = p - uLens.xy;
  return uLens.z * exp(-dot(d, d) / r2);
}

float H(vec2 p) {
  return fieldHeight(p) + uLensLift * lensField(p, 0.045);
}

`;

const FRAG_COMMON = /* glsl */ `
// trait à épaisseur constante à l'écran (px ≈ largeur en pixels)
float iso(float v, float interval, float px) {
  float x = v / interval;
  float d = abs(fract(x - 0.5) - 0.5);
  float fw = max(fwidth(x), 1e-5);
  return 1.0 - smoothstep(px * fw * 0.5, px * fw * 0.5 + fw, d);
}

// Studio procédural reflété par le mercure : sol papier, plafond clair,
// deux boîtes à lumière et une ligne d'horizon encre pour le contraste.
vec3 studio(vec3 d) {
  float y = d.y;
  // studio photo : plafond sombre rayé de boîtes à lumière, mur papier
  // lumineux à l'horizon, sol chaud. Le chrome n'existe que par ce contraste.
  vec3 ceilC = vec3(0.17, 0.165, 0.16);
  vec3 wall = PAPER * 0.98;
  vec3 ground = vec3(0.32, 0.29, 0.26);
  vec3 c = mix(ground, wall, smoothstep(-0.12, -0.02, y));
  c = mix(c, ceilC, smoothstep(0.18, 0.42, y));
  // bandes de softbox au plafond
  float az = atan(d.z, d.x);
  float strips = smoothstep(0.86, 0.9, abs(sin(az * 3.0 + 0.4))) * smoothstep(0.42, 0.5, y) * smoothstep(0.98, 0.9, y);
  float top = smoothstep(0.93, 0.96, y);
  float side = smoothstep(0.62, 0.68, d.x) * smoothstep(0.2, 0.14, abs(y - 0.12));
  c += vec3(1.0, 0.98, 0.95) * (strips * 0.95 + top * 0.85 + side * 0.9);
  c = mix(c, RED * 1.1, smoothstep(0.8, 0.86, -d.x) * smoothstep(0.14, 0.08, abs(y - 0.08)) * 0.85);
  return c * vec3(1.0, 0.97, 0.94);
}
`;

const HEADER = (segments: number, oct: number, frag = false) => `
precision highp float;
#define OCT ${oct}
#define SEG ${segments.toFixed(1)}
${PALETTE}
${FIELD_GLSL}
${COMMON}
${frag ? FRAG_COMMON : ""}
`;

/* -------------------------------------------------------------------------- */
/*  Terrain                                                                   */
/* -------------------------------------------------------------------------- */

export function terrainShaders(segments: number, oct: number) {
  const head = HEADER(segments, oct);
  const fhead = HEADER(segments, oct, true);
  const vertexShader = /* glsl */ `
${head}
varying vec3 vPos;
varying vec3 vN;

void main() {
  vec2 p = position.xz;
  p.x = min(p.x, uCut);
  float e = 2.0 / SEG;
  float h = H(p);
  float hx = H(p + vec2(e, 0.0));
  float hz = H(p + vec2(0.0, e));
  vN = normalize(vec3(h - hx, e, h - hz));
  vPos = vec3(p.x, h, p.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
}`;

  const fragmentShader = /* glsl */ `
${fhead}
varying vec3 vPos;
varying vec3 vN;

void main() {
  vec3 n = normalize(vN);
  vec2 p = vPos.xz;
  float h = vPos.y;
  float lens = lensField(p, 0.05);

  // lavis d'ombrage (hillshade) — le volume
  vec3 L = normalize(vec3(-0.6, 0.62, 0.38));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float slope = 1.0 - n.y;
  vec3 paper = mix(PAPER, PAPER_SHADE, uDusk);
  // lumière chaude, ombre froide (lavis graphite)
  vec3 shadeC = mix(paper, vec3(0.62, 0.64, 0.66), 0.55);
  vec3 col = mix(shadeC, paper * 1.03, smoothstep(0.25, 0.95, diff));
  col *= 0.94 + 0.08 * smoothstep(0.0, 0.25, h);

  // teintes hypsométriques révélées par la loupe
  float band = floor(h / 0.012);
  vec3 hyps = mix(OCRE, CLAY, fract(band * 0.618));
  hyps = mix(hyps, OXIDE, smoothstep(0.16, 0.32, h) * 0.55);
  hyps = mix(hyps, WATER_C, smoothstep(0.05, 0.0, h) * 0.5);
  col = mix(col, hyps * (0.78 + 0.3 * diff), lens * 0.6);

  // courbes de niveau
  // origine décalée : un terrain plat ne tombe jamais pile sur une courbe
  float hc = h + 0.0047;
  float minor = iso(hc, 0.012, 0.7);
  float major = iso(hc, 0.06, 1.35);
  float fine = iso(hc, 0.003, 0.6);
  float ink = max(minor * 0.42, major * 0.85);
  ink = max(ink, fine * 0.45 * lens);
  ink *= 0.8 + 0.3 * vnoise(p * 140.0);   // bavure d'encre
  ink *= smoothstep(0.02, 0.35, uGrow);    // l'encre arrive avec le relief
  vec3 inkC = mix(INK, RED * 0.8, lens * 0.35);
  col = mix(col, inkC, ink * (1.0 - uLiquid));

  // réticule de la loupe : l'instrument est visible
  float lr = length(p - uLens.xy);
  float rim = 1.0 - smoothstep(0.0, fwidth(lr) * 1.3, abs(lr - 0.24));
  float ang = atan(p.y - uLens.y, p.x - uLens.x);
  float ticks = step(0.82, fract(ang / 6.2831853 * 48.0)) * (1.0 - smoothstep(0.0, fwidth(lr) * 1.3, abs(lr - 0.255) - 0.012));
  vec2 cq = abs(p - uLens.xy);
  float cross_ = (1.0 - smoothstep(0.0, fwidth(cq.x) * 1.2, min(cq.x, cq.y))) * step(max(cq.x, cq.y), 0.035) * step(0.008, max(cq.x, cq.y));
  col = mix(col, RED, max(max(rim, ticks), cross_) * uLens.z * 0.85 * (1.0 - uLiquid));

  // faille cachée de la caldeira : révélée par la loupe-scanner
  if (uW[3] > 0.01) {
    float r = length(p * vec2(1.0, 1.15));
    float wall = exp(-pow((r - 0.58) / 0.13, 2.0));
    float g = smoothstep(0.25, 0.9, calderaGap(p));
    float s = (p.x + p.y) * 70.0;
    float hatch = 1.0 - smoothstep(0.25, 0.25 + fwidth(s) * 1.2, abs(fract(s) - 0.5));
    float m = g * wall * smoothstep(0.2, 0.7, lens) * smoothstep(0.5, 1.0, uW[3]);
    col = mix(col, RED, m * (0.25 + 0.65 * hatch));
  }

  // sondage : une onde rouge qui épouse le relief
  float age = uTime - uPulse.z;
  if (age > 0.0 && age < 4.0) {
    float d = length(p - uPulse.xy);
    float R = age * 0.55;
    float w = 0.006 + age * 0.004;
    float ring = exp(-pow((d - R) / w, 2.0));
    float echo = exp(-pow((d - R * 0.62) / (w * 0.6), 2.0)) * 0.45;
    float fade = 1.0 - smoothstep(0.0, 4.0, age);
    col = mix(col, RED, (ring + echo * minor * 3.0) * fade * (1.0 - uLiquid));
  }

  // mercure
  if (uLiquid > 0.001) {
    vec3 V = normalize(vPos - cameraPosition);
    vec3 R = reflect(V, n);
    float fres = pow(1.0 - max(dot(-V, n), 0.0), 3.0);
    vec3 metal = studio(R) * (0.72 + 0.35 * fres);
    metal = mix(metal, metal * vec3(1.05, 0.9, 0.85), lens * 0.4);
    col = mix(col, metal, uLiquid);
  }

  col += (hash(gl_FragCoord.xy) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;
  return { vertexShader, fragmentShader };
}

/* -------------------------------------------------------------------------- */
/*  Flancs : coupe géologique                                                 */
/* -------------------------------------------------------------------------- */

export function flankShaders(segments: number, oct: number) {
  const head = HEADER(segments, oct);
  const fhead = HEADER(segments, oct, true);
  const vertexShader = /* glsl */ `
${head}
attribute float aT;
attribute float aTop;
attribute float aSide;
uniform float uGrowDepth;
varying vec3 vPos;
varying float vU;
varying float vTopH;
varying float vSide;

void main() {
  vec2 p;
  float t = aT;
  if (aSide < 0.5) p = vec2(min(t, uCut), 1.0);
  else if (aSide < 1.5) p = vec2(min(t, uCut), -1.0);
  else if (aSide < 2.5) p = vec2(-1.0, t);
  else p = vec2(uCut, t);
  float h = H(p);
  float wy = uWater > 0.001 ? mix(-DEPTH, WATER, uWater) : -DEPTH;
  float top = max(h, wy);
  float y = aTop > 0.5 ? top : -DEPTH * uGrowDepth;
  vPos = vec3(p.x, y, p.y);
  vU = aSide < 1.5 ? p.x : p.y;
  vTopH = h;
  vSide = aSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
}`;

  const fragmentShader = /* glsl */ `
${fhead}
uniform float uGrowDepth;
varying vec3 vPos;
varying float vU;
varying float vTopH;
varying float vSide;

float dots(vec2 q, float r) {
  q.x += 0.5 * mod(floor(q.y), 2.0);
  vec2 c = fract(q) - 0.5;
  float d = length(c);
  float aa = fwidth(q.x) * 0.8;
  return 1.0 - smoothstep(r - aa, r + aa, d);
}
float crosses(vec2 q) {
  q *= 0.7;
  q.x += 0.5 * mod(floor(q.y), 2.0);
  vec2 c = abs(fract(q) - 0.5);
  float aa = fwidth(q.x) * 0.8;
  float arm = 1.0 - smoothstep(0.045 - aa, 0.045 + aa, min(c.x, c.y));
  float len = 1.0 - smoothstep(0.24 - aa, 0.24 + aa, max(c.x, c.y));
  return arm * len;
}
float dashes(vec2 q) {
  float row = floor(q.y * 0.9);
  float aa = fwidth(q.y) * 0.9;
  float l = 1.0 - smoothstep(0.06 - aa, 0.06 + aa, abs(fract(q.y * 0.9) - 0.5));
  float seg = step(fract(q.x * 0.35 + row * 0.37), 0.62);
  return l * seg;
}
float bricks(vec2 q) {
  q *= vec2(0.45, 0.9);
  float row = floor(q.y);
  float aa = fwidth(q.y) * 0.9;
  float hz = 1.0 - smoothstep(0.035 - aa, 0.035 + aa, abs(fract(q.y) - 0.5) - 0.465);
  hz = 1.0 - smoothstep(aa, aa * 2.0, min(fract(q.y), 1.0 - fract(q.y)) - 0.03);
  float vx = 1.0 - smoothstep(aa, aa * 2.0, min(fract(q.x + row * 0.5), 1.0 - fract(q.x + row * 0.5)) - 0.03);
  return max(hz, vx);
}
float hatch(vec2 q) {
  float s = (q.x + q.y) * 0.55;
  float aa = fwidth(s);
  return 1.0 - smoothstep(0.1 - aa, 0.1 + aa, abs(fract(s) - 0.5));
}

void main() {
  vec3 N = vSide < 0.5 ? vec3(0, 0, 1) : vSide < 1.5 ? vec3(0, 0, -1) : vSide < 2.5 ? vec3(-1, 0, 0) : vec3(1, 0, 0);
  vec3 L = normalize(vec3(-0.55, 0.78, 0.32));
  float sh = 0.8 + 0.22 * dot(N, L);
  vec3 paper = mix(PAPER, PAPER_SHADE, uDusk);

  float y = vPos.y;
  float d = -y;
  float wob = 0.012 * sin(vU * 6.3 + 1.3) + 0.018 * (fbm(vec2(vU * 2.7, vSide * 3.1)) - 0.5);
  float dd = d + wob;
  float k = clamp(floor(dd / STRATUM), 0.0, 4.0);

  vec2 q = vec2(vU, y) * 64.0;
  float pat;
  vec3 tint;
  if (k < 0.5) { pat = dots(q, 0.13); tint = OCRE; }
  else if (k < 1.5) { pat = crosses(q); tint = CLAY; }
  else if (k < 2.5) { pat = dashes(q); tint = SCHIST; }
  else if (k < 3.5) { pat = bricks(q); tint = OXIDE; }
  else { pat = hatch(q); tint = BASEMENT; }

  float hi = 1.0 - smoothstep(0.0, 0.5, abs(k - uHi));
  vec3 col = mix(paper, tint, 0.34 + 0.12 * k / 4.0) * sh;
  col = mix(col, mix(INK, RED, hi), pat * (0.5 + 0.25 * hi));
  col = mix(col, mix(col, RED, 0.35), hi);

  // limites de strates
  float bl = iso(dd, STRATUM, 1.3) * step(0.03, dd) * step(dd, DEPTH - 0.02);
  col = mix(col, INK, bl * 0.85);

  // eau au-dessus du terrain (03)
  if (y > vTopH) {
    float wd = y - vTopH;
    col = mix(paper, WATER_C, 0.42) * sh;
    col = mix(col, INK, iso(y, 0.012, 0.8) * 0.25);
  }

  // arêtes : bord supérieur (terrain), surface d'eau, base
  float edgeTop = 1.0 - smoothstep(0.0, fwidth(y) * 2.0, abs(y - vTopH));
  float edgeBase = 1.0 - smoothstep(0.0, fwidth(y) * 2.2, abs(y + DEPTH * uGrowDepth));
  col = mix(col, INK, max(edgeTop, edgeBase));

  // mercure : le bloc devient lingot
  if (uLiquid > 0.001) {
    vec3 V = normalize(vPos - cameraPosition);
    vec3 R = reflect(V, N);
    vec3 Rf = normalize(R + vec3(0.0, 0.0, 0.12 * (vnoise(vec2(vU * 9.0, 1.0)) - 0.5)));
    vec3 metal = studio(Rf) * (0.62 + 0.12 * sh);
    metal *= 0.75 + 0.25 * smoothstep(-DEPTH, 0.0, y);
    metal = mix(metal, INK, bl * 0.35);
    col = mix(col, metal, uLiquid);
  }

  col += (hash(gl_FragCoord.xy) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;
  return { vertexShader, fragmentShader };
}

/* -------------------------------------------------------------------------- */
/*  Eau (03 — archipel)                                                       */
/* -------------------------------------------------------------------------- */

const linksGlsl = LINKS.map(([a, b]) => {
  const A = ISLANDS[a];
  const B = ISLANDS[b];
  return `  lk = max(lk, link(p, vec2(${A[0]}, ${A[1]}), vec2(${B[0]}, ${B[1]})));`;
}).join("\n");

export function waterShaders(segments: number, oct: number) {
  const head = HEADER(segments, oct);
  const fhead = HEADER(segments, oct, true);
  const vertexShader = /* glsl */ `
${head}
varying vec3 vPos;
void main() {
  vec3 p = position;
  p.x = min(p.x, uCut);
  vPos = vec3(p.x, mix(-DEPTH, WATER, uWater), p.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
}`;
  const fragmentShader = /* glsl */ `
${fhead}
varying vec3 vPos;

float link(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  float d = length(p - a - ab * t);
  float fw = fwidth(d);
  float line = 1.0 - smoothstep(fw * 0.6, fw * 1.6, d);
  float dash = step(0.45, fract(t * length(ab) * 26.0 - uTime * 0.6));
  return line * dash;
}

void main() {
  vec2 p = vPos.xz;
  float h = fieldHeight(p);
  float depth = WATER - h;
  if (depth < 0.0) discard;
  vec3 paper = mix(PAPER, PAPER_SHADE, uDusk);
  vec3 col = mix(paper, WATER_C, 0.32 + 0.4 * smoothstep(0.0, 0.07, depth));
  col = mix(col, INK, iso(depth, 0.014, 0.8) * 0.28);
  float shore = 1.0 - smoothstep(0.0, fwidth(depth) * 1.8, depth);
  col = mix(col, INK, shore);
  float lk = 0.0;
${linksGlsl}
  col = mix(col, RED, lk * 0.9);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 0.86 * smoothstep(0.0, 0.3, uWater));
}`;
  return { vertexShader, fragmentShader };
}

/* -------------------------------------------------------------------------- */
/*  Table d'arpentage                                                         */
/* -------------------------------------------------------------------------- */

export function tableShaders() {
  const vertexShader = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
  const fragmentShader = /* glsl */ `
precision highp float;
${PALETTE}
uniform float uDusk;
uniform float uCut;
uniform float uGrowDepth;
uniform float uLiquid;
varying vec2 vP;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float grid(vec2 p, float step_, float px) {
  vec2 g = abs(fract(p / step_ - 0.5) - 0.5);
  vec2 fw = fwidth(p / step_);
  vec2 l = 1.0 - smoothstep(fw * px * 0.5, fw * px * 0.5 + fw, g);
  return max(l.x, l.y);
}
void main() {
  vec3 paper = mix(PAPER, PAPER_SHADE, uDusk);
  vec3 col = paper;
  float r = length(vP);
  // graticule
  float gMinor = grid(vP, 0.25, 0.8) * 0.07;
  float gMajor = grid(vP, 1.0, 1.0) * 0.16;
  col = mix(col, GRAPHITE, max(gMinor, gMajor) * (1.0 - smoothstep(1.5, 5.5, r)));
  // ombre portée du bloc
  vec2 c = vec2((uCut - 1.0) * 0.5 + 0.12, 0.1);
  vec2 b = vec2((uCut + 1.0) * 0.5, 1.0);
  float sd = sdBox(vP - c, b);
  float sh = (1.0 - smoothstep(-0.35, 0.75, sd)) * 0.22 + (1.0 - smoothstep(-0.05, 0.12, sd)) * 0.1;
  col *= 1.0 - sh * uGrowDepth * (1.0 + uLiquid * 0.6);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.03;
  float a = 1.0 - smoothstep(3.0, 7.5, r);
  gl_FragColor = vec4(col, a);
}`;
  return { vertexShader, fragmentShader };
}
