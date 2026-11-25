/**
 * NOYAU — un galet de verre épais contenant un noyau de métal liquide, dans
 * un studio photo qui bascule du blanc au noir. Raymarching plein écran :
 * verre (réflexion + réfraction avec légère dispersion), métal (réflexion du
 * studio), cyclorama. Sur le mur, un mot presque invisible à l'œil nu, qui
 * ne se révèle qu'à travers la matière — et qui change à chaque chapitre.
 *
 * États (uW) : 0 repos · 1 cristal · 2 coque · 3 archipel · 4 fonte.
 * Rendu strictement monochrome.
 */

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform mat3 uRot;        // monde -> local (rotation du galet)
uniform vec3 uPull;       // attraction du curseur, en local
uniform float uPulse;     // impulsion (1 -> 0)
uniform float uW[5];
uniform float uAgit;      // agitation (vitesse de scroll)
uniform float uInvert;    // 0 studio blanc, 1 studio noir
uniform vec2 uShift;      // décalage de l'objet à l'écran
uniform float uZoom;
uniform sampler2D uText;  // atlas : un mot par rangée
uniform float uRows;
uniform float uWordA;
uniform float uWordB;
uniform float uWordMix;
uniform vec2 uCursor;     // curseur en NDC (faille de la coque)

vec3 HI;    // mur
vec3 LO;    // sol / ombre
vec3 INK;   // mot, filets

const float FLOOR_Y = -1.18;
const float WALL_Z = -3.4;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float sdOcta(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }

/* ---------------------------- formes ---------------------------- */

vec3 dropPos(int i) {
  vec3 d = i == 0 ? vec3(1, 1, 1) : i == 1 ? vec3(-1, -1, 1) : i == 2 ? vec3(-1, 1, -1) : vec3(1, -1, -1);
  return normalize(d) * (0.98 + 0.05 * sin(uTime * 0.9 + float(i)));
}

vec3 blob(int i) {
  float fi = float(i);
  float t = uTime * 0.55;
  return vec3(
    sin(t * (0.9 + 0.21 * fi) + fi * 1.7),
    cos(t * (0.7 + 0.17 * fi) + fi * 2.3),
    sin(t * (0.8 + 0.13 * fi) + fi * 0.9)
  ) * 0.3;
}

float chaos(vec3 p) {
  return sin(p.x * 5.0 + uTime * 1.3) * sin(p.y * 4.3 + uTime * 1.1) * sin(p.z * 5.2 - uTime * 0.8);
}

float CH; // fonte effective : état 04 + agitation du scroll

float glassD(vec3 p) {
  float d = sdRoundBox(p, vec3(0.5, 0.6, 0.5), 0.44);
  if (uW[3] > 0.001) {
    float drops = 1e5;
    for (int i = 0; i < 4; i++) drops = smin(drops, length(p - dropPos(i)) - 0.4, 0.1);
    d = mix(d, drops, uW[3]);
  }
  d += CH * 0.075 * chaos(p);
  return d;
}

float coreD(vec3 p) {
  float m = 1e5;
  float grow = 1.0 + uPulse * 0.9;
  for (int i = 0; i < 4; i++) {
    vec3 c = blob(i) * grow + uPull * 0.2;
    m = smin(m, length(p - c) - 0.23, 0.34);
  }
  if (uW[1] > 0.001) {
    vec3 q = rotY(uTime * 0.35) * rotX(0.6) * (p - uPull * 0.1);
    float oc = sdOcta(q, 0.4);
    vec3 qc = rotY(0.785) * rotX(0.615) * q;
    float cube = sdRoundBox(qc, vec3(0.21), 0.005);
    // cristal maclé, mais encore un peu liquide : pas d'aplats « découpés »
    m = mix(m, smin(oc, cube, 0.05), uW[1] * 0.78);
  }
  if (uW[3] > 0.001) {
    float s = 1e5;
    for (int i = 0; i < 4; i++) s = min(s, length(p - dropPos(i) - uPull * 0.06) - 0.2);
    m = mix(m, s, uW[3]);
  }
  m += CH * 0.07 * chaos(p * 1.7 + 2.0);
  return m;
}

vec3 gradGlass(vec3 p) {
  const vec2 k = vec2(1, -1) * 0.0015;
  return normalize(k.xyy * glassD(p + k.xyy) + k.yyx * glassD(p + k.yyx) + k.yxy * glassD(p + k.yxy) + k.xxx * glassD(p + k.xxx));
}
vec3 gradCore(vec3 p) {
  const vec2 k = vec2(1, -1) * 0.0015;
  return normalize(k.xyy * coreD(p + k.xyy) + k.yyx * coreD(p + k.yyx) + k.yxy * coreD(p + k.yxy) + k.xxx * coreD(p + k.xxx));
}

/* ---------------------------- studio ---------------------------- */

float word(vec2 uv, float row) {
  if (uv.x <= 0.0 || uv.x >= 1.0 || uv.y <= 0.0 || uv.y >= 1.0) return 0.0;
  return texture(uText, vec2(uv.x, (uv.y + row) / uRows)).a;
}

// through = 1 : le rayon a traversé la matière -> le mot apparaît
vec3 backdrop(vec3 ro, vec3 rd, float through) {
  float tf = rd.y < -1e-4 ? (FLOOR_Y - ro.y) / rd.y : 1e9;
  float tw = rd.z < -1e-4 ? (WALL_Z - ro.z) / rd.z : 1e9;
  vec3 col;
  if (tf < tw && tf < 1e8) {
    vec3 p = ro + rd * tf;
    col = mix(LO, HI, smoothstep(6.0, -1.0, p.z));
    vec2 q = p.xz - vec2(0.18, -0.12);
    float sh = smoothstep(0.15, 1.5, length(q * vec2(0.9, 1.35)));
    col *= mix(mix(0.66, 0.35, uInvert), 1.0, sh);
    vec2 c = p.xz - vec2(0.42, 0.3);
    float caus = exp(-dot(c, c * vec2(1.0, 1.8)) / 0.05) * (1.0 - uW[2] * 0.85);
    col += vec3(1.0) * caus * mix(0.3, 0.55, uInvert);
    col = mix(col, HI, smoothstep(WALL_Z + 1.2, WALL_Z, p.z) * 0.6);
  } else if (tw < 1e8) {
    vec3 p = ro + rd * tw;
    col = mix(LO, HI, smoothstep(-1.2, 2.5, p.y));
    float W = 7.8;
    vec2 uv = vec2(p.x / W + 0.5, 0.5 - (p.y - 0.08) / (W / 4.0));
    float a = mix(word(uv, uWordA), word(uv, uWordB), uWordMix);
    col = mix(col, INK, a * mix(0.045, 0.92, through));
  } else {
    col = mix(LO * 0.9, HI * 0.97, smoothstep(-0.4, 0.6, rd.y));
  }
  return col;
}

vec3 lights(vec3 rd) {
  float l = 0.0;
  l += smoothstep(0.78, 0.84, rd.y) * smoothstep(0.42, 0.34, abs(rd.x + 0.2)) * 2.2;
  l += smoothstep(0.82, 0.88, rd.x) * smoothstep(0.55, 0.45, abs(rd.y - 0.1)) * 1.6;
  l += smoothstep(0.9, 0.95, -rd.x) * smoothstep(0.3, 0.2, abs(rd.y - 0.2)) * mix(0.32, 1.1, uInvert);
  // filet rasant derrière l'objet : un trait blanc sur le chrome
  l += smoothstep(0.9, 0.95, -rd.z) * smoothstep(0.06, 0.015, abs(rd.y + 0.05)) * mix(0.6, 1.4, uInvert);
  return vec3(l);
}

float flags(vec3 rd) {
  float f = 0.0;
  f += smoothstep(0.3, 0.38, rd.x) * smoothstep(0.78, 0.7, rd.x) * smoothstep(0.75, 0.55, abs(rd.y - 0.05));
  f += smoothstep(-0.25, -0.33, rd.x) * smoothstep(-0.8, -0.72, rd.x) * smoothstep(0.6, 0.4, abs(rd.y - 0.15));
  f += smoothstep(0.0, -0.12, rd.y) * smoothstep(0.2, 0.5, rd.z) * 0.8;
  return clamp(f, 0.0, 1.0);
}

vec3 env(vec3 p, vec3 rd) {
  vec3 c = backdrop(p, rd, 0.0) * 0.92;
  c = mix(c, vec3(0.04), flags(rd) * mix(0.88, 0.6, uInvert));
  return c + lights(rd);
}

/* ---------------------------- rendu ---------------------------- */

void main() {
  HI = mix(vec3(0.945), vec3(0.085), uInvert);
  LO = mix(vec3(0.80), vec3(0.03), uInvert);
  INK = mix(vec3(0.06), vec3(0.94), uInvert);
  CH = clamp(uW[4] + uAgit, 0.0, 1.0);

  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / min(uRes.x * 0.72, uRes.y);
  uv.y -= uRes.x < uRes.y ? 0.12 : 0.0;
  uv -= uShift;

  vec3 ro = vec3(0.0, 0.3, 7.6 * uZoom);
  vec3 ta = vec3(0.0, -0.02, 0.0);
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(fw, vec3(0, 1, 0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * 2.25 + uv.x * rt + uv.y * up);

  mat3 toW = transpose(uRot);
  vec3 lro = uRot * ro;
  vec3 lrd = uRot * rd;

  vec3 col = backdrop(ro, rd, 0.0);

  float t = length(ro) - 2.2;
  bool hit = false;
  for (int i = 0; i < 72; i++) {
    float d = glassD(lro + lrd * t);
    if (d < 0.0012) { hit = true; break; }
    t += d;
    if (t > length(ro) + 3.0) break;
  }

  if (hit) {
    vec3 p = lro + lrd * t;
    vec3 n = gradGlass(p);
    float ndv = clamp(dot(-lrd, n), 0.0, 1.0);
    float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

    vec3 refl = env(toW * p, toW * reflect(lrd, n));

    float crack = 1.0 - smoothstep(0.0, 0.035, abs(dot(n, normalize(vec3(0.35, 1.0, 0.2)))));
    vec2 screenP = (toW * p).xy * vec2(0.32, 0.42) + uShift * 1.3;
    float near = smoothstep(0.55, 0.0, length(uCursor - screenP));
    float frost = uW[2] * (1.0 - crack * (0.35 + 0.65 * near));

    vec3 rd2 = refract(lrd, n, 1.0 / 1.5);

    vec3 q = p - n * 0.004;
    float s = 0.0;
    bool core = false;
    float minCore = 1e5;
    for (int i = 0; i < 64; i++) {
      vec3 x = q + rd2 * s;
      float dc = coreD(x);
      float dg = -glassD(x);
      minCore = min(minCore, dc);
      float dIn = min(dc, dg);
      if (dIn < 0.0012) { core = dc < dg; break; }
      s += max(dIn, 0.004);
      if (s > 3.5) break;
    }
    vec3 x = q + rd2 * s;
    vec3 absorb = exp(-s * vec3(0.04));
    vec3 inner;

    if (core) {
      vec3 nc = gradCore(x);
      float cd = clamp(dot(-rd2, nc), 0.0, 1.0);
      vec3 metal = env(toW * x, toW * reflect(rd2, nc));
      metal *= 0.55 + 0.45 * pow(1.0 - cd, 1.2) + 0.25;
      metal += uPulse * 0.25 * pow(1.0 - cd, 3.0);
      inner = metal;
    } else {
      vec3 n2 = -gradGlass(x);
      vec3 xw = toW * x;
      vec3 rR = refract(rd2, n2, 1.488);
      vec3 rG = refract(rd2, n2, 1.50);
      vec3 rB = refract(rd2, n2, 1.516);
      if (dot(rG, rG) < 0.01) {
        inner = env(xw, toW * reflect(rd2, n2));
      } else {
        inner = vec3(
          backdrop(xw, toW * rR, 1.0).r,
          backdrop(xw, toW * rG, 1.0).g,
          backdrop(xw, toW * rB, 1.0).b
        );
      }
    }
    inner *= absorb;
    float ghost = 1.0 - smoothstep(0.0, 0.32, minCore);
    vec3 milky = mix(HI * 0.98 + 0.02, mix(LO * 0.7, vec3(0.5), uInvert * 0.4), ghost * 0.75);
    milky += lights(toW * reflect(lrd, n)) * 0.06;
    inner = mix(inner, milky, frost * 0.92);

    col = mix(inner, refl, fres) + lights(toW * reflect(lrd, n)) * 0.35 * fres;
    col = mix(col, INK, smoothstep(0.12, 0.0, ndv) * 0.3);
  }

  // monochrome strict — on ne garde qu'un souffle de dispersion
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 0.12);

  col = col / (1.0 + col * 0.12) * 1.1;
  vec2 vq = frag / uRes - 0.5;
  col *= 1.0 - dot(vq, vq) * mix(0.28, 0.6, uInvert);
  col += (hash(frag + fract(uTime * 7.0) * 100.0) - 0.5) * mix(0.035, 0.05, uInvert);
  outColor = vec4(col, 1.0);
}`;
