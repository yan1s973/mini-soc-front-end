/**
 * Le champ de hauteur — source unique du territoire.
 *
 * Écrit deux fois, à l'identique : en GLSL (GPU, rendu) et en TS (CPU, pose des
 * bornes et lecture des cotes). Toute modification d'un côté doit être reportée
 * de l'autre. Coordonnées : p = (x, z) ∈ [-1, 1]², hauteur en unités monde.
 */

export const BLOCK_DEPTH = 0.55; // profondeur du bloc sous y = 0
export const STRATUM = 0.11; // épaisseur nominale d'une strate
export const WATER_LEVEL = 0.085;

/** Poids des états du terrain, dans l'ordre des uniforms GLSL. */
export type Weights = [base: number, name: number, terrace: number, caldera: number, archi: number, liquid: number];

/** Îles de l'archipel (03 — Cloud) : centre x, z, rayon, altitude du plateau. */
export const ISLANDS: [number, number, number, number][] = [
  [-0.58, -0.42, 0.24, 0.2],
  [0.12, -0.6, 0.2, 0.26],
  [0.64, -0.22, 0.22, 0.17],
  [-0.2, 0.18, 0.26, 0.3],
  [0.52, 0.5, 0.19, 0.22],
  [-0.66, 0.58, 0.17, 0.15],
];

/** Liens pointillés entre îles (indices). */
export const LINKS: [number, number][] = [
  [0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [1, 2],
];

export const CALDERA_FAULT_ANGLE = 0.62; // radians — la faille cachée

/* -------------------------------------------------------------------------- */
/*  GLSL                                                                      */
/* -------------------------------------------------------------------------- */

const islandsGlsl = ISLANDS.map(
  ([x, z, r, h]) => `  hi = max(hi, island(p, vec2(${f(x)}, ${f(z)}), ${f(r)}, ${f(h)}, n));`,
).join("\n");

function f(n: number) {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

export const FIELD_GLSL = /* glsl */ `
#ifndef OCT
#define OCT 5
#endif
uniform sampler2D uName;
uniform float uW[6];
uniform float uTime;
uniform float uGrow;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCT; i++) {
    s += a * vnoise(p);
    p = vec2(1.6 * p.x - 1.2 * p.y, 1.2 * p.x + 1.6 * p.y);
    a *= 0.5;
  }
  return s;
}

float hBase(vec2 p) {
  float n = fbm(p * 1.15 + 3.1);
  return 0.02 + 0.13 * n * n + 0.045 * (0.5 - 0.5 * p.y) + 0.02 * p.x * p.x;
}

float hName(vec2 p) {
  vec2 uv = vec2(p.x * 0.5 + 0.5, p.y + 0.5);
  uv += (vec2(vnoise(p * 9.0), vnoise(p * 9.0 + 17.0)) - 0.5) * 0.035;
  if (uv.y < 0.0 || uv.y > 1.0) return 0.0;
  float n = texture2D(uName, uv).r;
  return n * 0.17 * (0.6 + 0.8 * fbm(p * 3.7 + 11.0));
}

float hTerrace(vec2 p) {
  float t = 0.02 + 0.34 * smoothstep(0.2, 0.8, fbm(p * 0.95 + 7.0));
  float x = t * 10.0;
  float fr = fract(x);
  return (floor(x) + smoothstep(0.74, 1.0, fr)) / 10.0;
}

float calderaGap(vec2 p) {
  float a = atan(p.y, p.x);
  float d = abs(mod(a - ${f(CALDERA_FAULT_ANGLE)} + 3.14159265, 6.2831853) - 3.14159265);
  return exp(-pow(d / 0.11, 2.0));
}

float hCaldera(vec2 p) {
  float r = length(p * vec2(1.0, 1.15));
  float n = fbm(p * 2.6 + 19.0);
  float ring = exp(-pow((r - 0.58 - 0.05 * (n - 0.5)) / 0.15, 2.0));
  float core = 0.09 * exp(-r * r / 0.012);
  return 0.035 + ring * (0.27 + 0.08 * n) * (1.0 - 0.32 * calderaGap(p)) + core + 0.035 * fbm(p * 4.0);
}

float island(vec2 p, vec2 c, float r, float h, float n) {
  float d = length(p - c) + 0.2 * (n - 0.5);
  float dome = 1.0 - 0.35 * clamp(length(p - c) / r, 0.0, 1.0);
  return smoothstep(r + 0.14, r - 0.06, d) * (h * dome + 0.04 * n);
}

float hArchi(vec2 p) {
  float n = fbm(p * 4.2 + 5.0);
  float hi = 0.0;
${islandsGlsl}
  return 0.02 + 0.025 * n + hi;
}

float hLiquid(vec2 p) {
  float t = uTime * 0.35;
  float h = 0.05;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = 0.55 * vec2(sin(t * (0.7 + 0.13 * fi) + fi * 1.7), cos(t * (0.5 + 0.11 * fi) + fi * 2.3));
    vec2 d = p - c;
    h += (0.11 + 0.02 * fi) * exp(-dot(d, d) / 0.09);
  }
  float r = length(p);
  h += 0.012 * sin(r * 14.0 - uTime * 1.6);
  return h;
}

float fieldHeight(vec2 p) {
  float h = 0.0;
  if (uW[0] > 0.001) h += uW[0] * hBase(p);
  if (uW[1] > 0.001) h += uW[1] * hName(p);
  if (uW[2] > 0.001) h += uW[2] * hTerrace(p);
  if (uW[3] > 0.001) h += uW[3] * hCaldera(p);
  if (uW[4] > 0.001) h += uW[4] * hArchi(p);
  if (uW[5] > 0.001) h += uW[5] * hLiquid(p);
  return h * uGrow;
}
`;

/* -------------------------------------------------------------------------- */
/*  TS — miroir CPU                                                           */
/* -------------------------------------------------------------------------- */

const fract = (x: number) => x - Math.floor(x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function hash(x: number, y: number) {
  let px = fract(x * 123.34);
  let py = fract(y * 456.21);
  const d = px * (px + 45.32) + py * (py + 45.32);
  px += d;
  py += d;
  return fract(px * py);
}

function vnoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  return mix(mix(hash(ix, iy), hash(ix + 1, iy), ux), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux), uy);
}

export function fbm(x: number, y: number, oct = 5) {
  let s = 0;
  let a = 0.5;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x, y);
    const nx = 1.6 * x - 1.2 * y;
    y = 1.2 * x + 1.6 * y;
    x = nx;
    a *= 0.5;
  }
  return s;
}

export interface NameField {
  width: number;
  height: number;
  data: Uint8Array; // 1 canal
}

function sampleName(field: NameField | null, u: number, v: number) {
  if (!field || v < 0 || v > 1 || u < 0 || u > 1) return 0;
  const x = u * field.width - 0.5;
  const y = v * field.height - 0.5;
  const x0 = Math.max(0, Math.min(field.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(field.height - 1, Math.floor(y)));
  const x1 = Math.min(field.width - 1, x0 + 1);
  const y1 = Math.min(field.height - 1, y0 + 1);
  const tx = Math.min(1, Math.max(0, x - x0));
  const ty = Math.min(1, Math.max(0, y - y0));
  const d = field.data;
  const w = field.width;
  return mix(mix(d[y0 * w + x0], d[y0 * w + x1], tx), mix(d[y1 * w + x0], d[y1 * w + x1], tx), ty) / 255;
}

export function heightAt(x: number, z: number, w: Weights, time: number, grow: number, name: NameField | null) {
  let h = 0;
  if (w[0] > 0.001) {
    const n = fbm(x * 1.15 + 3.1, z * 1.15 + 3.1);
    h += w[0] * (0.02 + 0.13 * n * n + 0.045 * (0.5 - 0.5 * z) + 0.02 * x * x);
  }
  if (w[1] > 0.001) {
    const u = x * 0.5 + 0.5 + (vnoise(x * 9, z * 9) - 0.5) * 0.035;
    const v = z + 0.5 + (vnoise(x * 9 + 17, z * 9 + 17) - 0.5) * 0.035;
    const n = sampleName(name, u, v);
    h += w[1] * n * 0.17 * (0.6 + 0.8 * fbm(x * 3.7 + 11, z * 3.7 + 11));
  }
  if (w[2] > 0.001) {
    const t = 0.02 + 0.34 * smoothstep(0.2, 0.8, fbm(x * 0.95 + 7, z * 0.95 + 7));
    const xx = t * 10;
    h += w[2] * ((Math.floor(xx) + smoothstep(0.74, 1, fract(xx))) / 10);
  }
  if (w[3] > 0.001) {
    const r = Math.hypot(x, z * 1.15);
    const n = fbm(x * 2.6 + 19, z * 2.6 + 19);
    const ring = Math.exp(-Math.pow((r - 0.58 - 0.05 * (n - 0.5)) / 0.15, 2));
    const a = Math.atan2(z, x);
    const d = Math.abs(((((a - CALDERA_FAULT_ANGLE + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI);
    const gap = Math.exp(-Math.pow(d / 0.11, 2));
    const core = 0.09 * Math.exp((-r * r) / 0.012);
    h += w[3] * (0.035 + ring * (0.27 + 0.08 * n) * (1 - 0.32 * gap) + core + 0.035 * fbm(x * 4, z * 4));
  }
  if (w[4] > 0.001) {
    const n = fbm(x * 4.2 + 5, z * 4.2 + 5);
    let hi = 0;
    for (const [cx, cz, r, ih] of ISLANDS) {
      const d0 = Math.hypot(x - cx, z - cz);
      const d = d0 + 0.2 * (n - 0.5);
      const dome = 1 - 0.35 * Math.min(1, Math.max(0, d0 / r));
      hi = Math.max(hi, smoothstep(r + 0.14, r - 0.06, d) * (ih * dome + 0.04 * n));
    }
    h += w[4] * (0.02 + 0.025 * n + hi);
  }
  if (w[5] > 0.001) {
    const t = time * 0.35;
    let hl = 0.05;
    for (let i = 0; i < 5; i++) {
      const cx = 0.55 * Math.sin(t * (0.7 + 0.13 * i) + i * 1.7);
      const cz = 0.55 * Math.cos(t * (0.5 + 0.11 * i) + i * 2.3);
      const dx = x - cx;
      const dz = z - cz;
      hl += (0.11 + 0.02 * i) * Math.exp(-(dx * dx + dz * dz) / 0.09);
    }
    hl += 0.012 * Math.sin(Math.hypot(x, z) * 14 - time * 1.6);
    h += w[5] * hl;
  }
  return h * grow;
}

/* -------------------------------------------------------------------------- */
/*  Le nom, sculpté                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Génère le champ de hauteur du nom : le mot est dessiné sur un canvas 2D,
 * puis flouté à deux rayons (crête + versant) pour obtenir des massifs plutôt
 * que des lettres extrudées. Aucun asset téléchargé.
 */
export function buildNameField(word: string, fontFamily: string): NameField {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 150;
  // chasse étendue : la même voix que les toponymes du site
  (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  ctx.font = `800 ${size}px ${fontFamily}`;
  // espacement cartographique
  const spaced = word.split("").join(String.fromCharCode(8202));
  const target = W * 0.8;
  const m = ctx.measureText(spaced).width;
  size = Math.floor(size * Math.min(1.25, target / m));
  ctx.font = `800 ${size}px ${fontFamily}`;
  ctx.fillText(spaced, W / 2, H / 2 + size * 0.04);

  const src = ctx.getImageData(0, 0, W, H).data;
  const a = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) a[i] = src[i * 4] / 255;

  const ridge = blur(a, W, H, 5);
  const slope = blur(a, W, H, 16);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const v = 0.4 * ridge[i] + 0.6 * slope[i] * 1.25;
    out[i] = Math.round(Math.min(1, v) * 255);
  }
  return { width: W, height: H, data: out };
}

function blur(src: Float32Array, W: number, H: number, r: number) {
  let a = src.slice();
  let b = new Float32Array(W * H);
  for (let pass = 0; pass < 3; pass++) {
    boxH(a, b, W, H, r);
    boxV(b, a, W, H, r);
  }
  return a;
  function boxH(s: Float32Array, d: Float32Array, w: number, h: number, rr: number) {
    const k = 1 / (rr * 2 + 1);
    for (let y = 0; y < h; y++) {
      let acc = 0;
      const row = y * w;
      for (let x = -rr; x <= rr; x++) acc += s[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        d[row + x] = acc * k;
        acc += s[row + Math.min(w - 1, x + rr + 1)] - s[row + Math.max(0, x - rr)];
      }
    }
  }
  function boxV(s: Float32Array, d: Float32Array, w: number, h: number, rr: number) {
    const k = 1 / (rr * 2 + 1);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -rr; y <= rr; y++) acc += s[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        d[y * w + x] = acc * k;
        acc += s[Math.min(h - 1, y + rr + 1) * w + x] - s[Math.max(0, y - rr) * w + x];
      }
    }
  }
}
