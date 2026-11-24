/**
 * NOYAU — un galet de verre épais contenant un noyau de métal liquide,
 * dans un studio photo clair. Raymarching plein écran : verre (réflexion +
 * réfraction avec dispersion), métal (réflexion du studio), fond en
 * cyclorama. Le nom est imprimé sur le mur, presque invisible à l'œil nu :
 * il ne se révèle qu'à travers la matière.
 *
 * États (uW) : 0 repos · 1 cristal · 2 coque · 3 archipel · 4 fonte.
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
uniform float uPulse;     // impulsion du clic (1 -> 0)
uniform float uW[5];
uniform sampler2D uText;
uniform float uTextAspect;
uniform vec2 uCursor;     // curseur en NDC (pour la faille de la coque)

const vec3 PAPER = vec3(0.925, 0.898, 0.850);
const vec3 PAPER_LO = vec3(0.835, 0.800, 0.745);
const vec3 INK = vec3(0.110, 0.141, 0.188);
const vec3 RED = vec3(0.761, 0.255, 0.176);
const float FLOOR_Y = -1.18;
const float WALL_Z = -3.4;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec3 hash3(vec2 p) {
  return vec3(hash(p), hash(p + 17.1), hash(p + 31.7));
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
  // tétraèdre, qui respire
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

float glassD(vec3 p) {
  float d = sdRoundBox(p, vec3(0.5, 0.6, 0.5), 0.44);
  if (uW[3] > 0.001) {
    float drops = 1e5;
    for (int i = 0; i < 4; i++) drops = smin(drops, length(p - dropPos(i)) - 0.4, 0.1);
    d = mix(d, drops, uW[3]);
  }
  d += uW[4] * 0.075 * chaos(p);
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
    float oc = sdOcta(q, 0.46);
    vec3 qc = rotY(0.785) * rotX(0.615) * q;
    float cube = sdRoundBox(qc, vec3(0.25), 0.005);
    float crystal = min(oc, cube);              // octaèdre + cube : un cristal maclé
    m = mix(m, crystal, uW[1]);
  }
  if (uW[3] > 0.001) {
    float s = 1e5;
    for (int i = 0; i < 4; i++) s = min(s, length(p - dropPos(i) - uPull * 0.06) - 0.2);
    m = mix(m, s, uW[3]);
  }
  m += uW[4] * 0.07 * chaos(p * 1.7 + 2.0);
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

// through = 1 : le rayon a traversé la matière -> le nom apparaît
vec3 backdrop(vec3 ro, vec3 rd, float through) {
  float tf = rd.y < -1e-4 ? (FLOOR_Y - ro.y) / rd.y : 1e9;
  float tw = rd.z < -1e-4 ? (WALL_Z - ro.z) / rd.z : 1e9;
  vec3 col;
  if (tf < tw && tf < 1e8) {
    vec3 p = ro + rd * tf;
    col = mix(PAPER_LO, PAPER, smoothstep(6.0, -1.0, p.z));
    // ombre portée douce + caustique : la lumière concentrée par le verre
    vec2 q = p.xz - vec2(0.18, -0.12);
    float sh = smoothstep(0.15, 1.5, length(q * vec2(0.9, 1.35)));
    col *= mix(0.66, 1.0, sh);
    vec2 c = p.xz - vec2(0.42, 0.3);
    float caus = exp(-dot(c, c * vec2(1.0, 1.8)) / 0.05) * (1.0 - uW[2] * 0.85);
    col += vec3(1.0, 0.9, 0.75) * caus * 0.32;
    // cyclorama : le sol remonte en mur sans arête
    col = mix(col, PAPER, smoothstep(WALL_Z + 1.2, WALL_Z, p.z) * 0.6);
  } else if (tw < 1e8) {
    vec3 p = ro + rd * tw;
    col = mix(PAPER_LO, PAPER, smoothstep(-1.2, 2.5, p.y));
    float W = 7.8;
    vec2 uv = vec2(p.x / W + 0.5, 0.5 - (p.y - 0.08) / (W / uTextAspect));
    float a = (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) ? texture(uText, uv).a : 0.0;
    col = mix(col, INK, a * mix(0.04, 0.82, through));
  } else {
    // derrière la caméra : le mur du studio, en lumière douce
    col = mix(PAPER_LO * 0.86, PAPER * 0.94, smoothstep(-0.4, 0.6, rd.y));
  }
  return col;
}

vec3 lights(vec3 rd) {
  vec3 l = vec3(0.0);
  // boîte à lumière haute, légèrement à gauche
  l += smoothstep(0.78, 0.84, rd.y) * smoothstep(0.42, 0.34, abs(rd.x + 0.2)) * 2.2;
  // bande verticale à droite (contre-jour)
  l += smoothstep(0.82, 0.88, rd.x) * smoothstep(0.55, 0.45, abs(rd.y - 0.1)) * 1.6;
  // bande gauche plus faible
  l += smoothstep(0.9, 0.95, -rd.x) * smoothstep(0.3, 0.2, abs(rd.y - 0.2)) * 0.32;
  // filet rouge : la seule couleur, rasante
  vec3 red = RED * smoothstep(0.9, 0.95, -rd.z) * smoothstep(0.08, 0.02, abs(rd.y + 0.05)) * 1.4;
  return l * vec3(1.0, 0.97, 0.92) + red;
}

// drapeaux noirs : les panneaux sombres du photographe. Sans eux, le chrome
// ne reflète que du papier clair et ressemble à du plastique.
float flags(vec3 rd) {
  float f = 0.0;
  f += smoothstep(0.3, 0.38, rd.x) * smoothstep(0.78, 0.7, rd.x) * smoothstep(0.75, 0.55, abs(rd.y - 0.05));
  f += smoothstep(-0.25, -0.33, rd.x) * smoothstep(-0.8, -0.72, rd.x) * smoothstep(0.6, 0.4, abs(rd.y - 0.15));
  f += smoothstep(0.0, -0.12, rd.y) * smoothstep(0.2, 0.5, rd.z) * 0.8;   // sol devant l'objet
  return clamp(f, 0.0, 1.0);
}

vec3 env(vec3 p, vec3 rd) {
  vec3 c = backdrop(p, rd, 0.0) * 0.92;
  c = mix(c, INK * 0.55 + vec3(0.03), flags(rd) * 0.88);
  return c + lights(rd);
}

/* ---------------------------- rendu ---------------------------- */

void main() {
  vec2 frag = gl_FragCoord.xy;
  // portrait : on cadre sur la largeur pour que le galet reste entier
  vec2 uv = (frag - 0.5 * uRes) / min(uRes.x * 0.72, uRes.y);
  uv.y -= uRes.x < uRes.y ? 0.12 : 0.0;

  vec3 ro = vec3(0.0, 0.3, 7.6);
  vec3 ta = vec3(0.0, -0.02, 0.0);
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(fw, vec3(0, 1, 0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * 2.25 + uv.x * rt + uv.y * up);

  mat3 toW = transpose(uRot);
  vec3 lro = uRot * ro;
  vec3 lrd = uRot * rd;

  vec3 col = backdrop(ro, rd, 0.0);

  // marche jusqu'au verre (espace local du galet)
  float t = 5.4;
  bool hit = false;
  for (int i = 0; i < 72; i++) {
    float d = glassD(lro + lrd * t);
    if (d < 0.0012) { hit = true; break; }
    t += d;
    if (t > 10.5) break;
  }

  if (hit) {
    vec3 p = lro + lrd * t;
    vec3 n = gradGlass(p);
    float ndv = clamp(dot(-lrd, n), 0.0, 1.0);
    float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

    vec3 refl = env(toW * p, toW * reflect(lrd, n));

    // coque (02) : verre dépoli, sauf le long d'une faille que le curseur ouvre
    float crack = 1.0 - smoothstep(0.0, 0.035, abs(dot(n, normalize(vec3(0.35, 1.0, 0.2)))));
    float near = smoothstep(0.55, 0.0, length(uCursor - (toW * p).xy * vec2(0.32, 0.42)));
    float frost = uW[2] * (1.0 - crack * (0.35 + 0.65 * near));

    vec3 rd2 = refract(lrd, n, 1.0 / 1.5);

    // dans le verre : jusqu'au noyau ou jusqu'à la sortie
    vec3 q = p - n * 0.004;
    float s = 0.0;
    bool core = false;
    float dIn = 0.0;
    float minCore = 1e5;   // plus courte distance au noyau : son ombre dans le dépoli
    for (int i = 0; i < 64; i++) {
      vec3 x = q + rd2 * s;
      float dc = coreD(x);
      float dg = -glassD(x);
      minCore = min(minCore, dc);
      dIn = min(dc, dg);
      if (dIn < 0.0012) { core = dc < dg; break; }
      s += max(dIn, 0.004);
      if (s > 3.5) break;
    }
    vec3 x = q + rd2 * s;
    vec3 absorb = exp(-s * vec3(0.045, 0.03, 0.035));   // verre épais, à peine teinté
    vec3 inner;

    if (core) {
      vec3 nc = gradCore(x);
      float cd = clamp(dot(-rd2, nc), 0.0, 1.0);
      vec3 r = reflect(rd2, nc);
      vec3 metal = env(toW * x, toW * r) * vec3(0.94, 0.9, 0.86);
      metal *= 0.55 + 0.45 * pow(1.0 - cd, 1.2) + 0.25;
      metal = mix(metal, metal * vec3(1.06, 0.92, 0.86), uPulse * 0.6);
      inner = metal;
    } else {
      vec3 n2 = -gradGlass(x);
      vec3 xw = toW * x;
      // dispersion : trois indices, trois canaux
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
    // dépoli : le verre devient laiteux, le noyau n'est plus qu'une ombre douce
    float ghost = 1.0 - smoothstep(0.0, 0.32, minCore);
    vec3 milky = mix(PAPER * 0.97, PAPER_LO * 0.62, ghost * 0.75);
    milky += lights(toW * reflect(lrd, n)) * 0.06;
    inner = mix(inner, milky, frost * 0.92);

    col = mix(inner, refl, fres) + lights(toW * reflect(lrd, n)) * 0.35 * fres;
    // arête : un filet d'encre très fin sur la silhouette
    col = mix(col, INK, smoothstep(0.12, 0.0, ndv) * 0.35);
  }

  // post : courbe douce, vignette, grain
  col = col / (1.0 + col * 0.12) * 1.1;
  vec2 vq = frag / uRes - 0.5;
  col *= 1.0 - dot(vq, vq) * 0.28;
  col += (hash(frag + fract(uTime * 7.0) * 100.0) - 0.5) * 0.035;
  outColor = vec4(col, 1.0);
}`;
