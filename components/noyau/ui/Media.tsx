"use client";

import { useEffect, useRef } from "react";
import { nlive } from "@/lib/noyau";

/**
 * Couche média WebGL. Les vignettes ne sont pas des <img> : un bloc HTML
 * vide (<MediaSlot>) réserve la place, et une seule toile plein écran les
 * dessine à leur position exacte, chaque image.
 *
 *  - noir & blanc par défaut, la couleur revient au survol ;
 *  - loupe qui bombe l'image sous le curseur ;
 *  - ondulation et décalage RGB selon la vitesse du scroll ;
 *  - apparition par une vague qui remonte.
 */

interface Slot {
  el: HTMLElement;
  src: string | null;
  label: string;
  code: string;
  tex: WebGLTexture | null;
  aspect: number;
  hover: number;
  hoverT: number;
  reveal: number;
  mx: number;
  my: number;
}

const slots = new Set<Slot>();
let notify: (() => void) | null = null;

export function MediaSlot({
  src,
  label,
  code,
  className = "",
}: {
  src: string | null | undefined;
  label: string;
  code: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const s: Slot = { el, src: src ?? null, label, code, tex: null, aspect: 1.6, hover: 0, hoverT: 0, reveal: 0, mx: 0.5, my: 0.5 };
    const root = (el.closest(".media-root") as HTMLElement) ?? el;
    const enter = () => (s.hoverT = 1);
    const leave = () => (s.hoverT = 0);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      s.mx = (e.clientX - r.left) / r.width;
      s.my = (e.clientY - r.top) / r.height;
    };
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointermove", move);
    slots.add(s);
    notify?.();
    return () => {
      slots.delete(s);
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointermove", move);
    };
  }, [src, label, code]);
  return <div ref={ref} className={`media-slot ${className}`} aria-hidden="true" />;
}

/** Vignette neutre générée tant qu'aucune image n'est fournie. */
function placeholder(label: string, code: string) {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 800;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 1280, 800);
  grad.addColorStop(0, "#1b1b1b");
  grad.addColorStop(1, "#070707");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1280, 800);
  // trame : la vignette attend son image
  g.strokeStyle = "rgba(255,255,255,0.07)";
  g.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 64) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, 800);
    g.stroke();
  }
  for (let y = 0; y <= 800; y += 64) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(1280, y + 0.5);
    g.stroke();
  }
  // grand numéro en contour
  g.font = '200 520px "Archivo Variable", "Archivo", sans-serif';
  (g as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  g.textBaseline = "alphabetic";
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 2;
  g.strokeText(code, 40, 720);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = '400 26px "IBM Plex Mono", monospace';
  g.fillText(label.toUpperCase(), 48, 76);
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.fillText("VIGNETTE À VENIR", 48, 116);
  return c;
}

const VERT = /* glsl */ `#version 300 es
in vec2 aUv;
uniform vec4 uRect;      // x, y, w, h en pixels (origine en haut à gauche)
uniform vec2 uView;
uniform float uVel;
uniform float uHover;
out vec2 vUv;
void main() {
  vUv = aUv;
  vec2 p = uRect.xy + aUv * uRect.zw;
  // la plaque ondule avec la vitesse : le centre traîne derrière les bords
  p.y += sin(aUv.x * 3.14159) * uVel * 0.06 * uRect.w;
  // au survol, elle s'avance très légèrement
  p += (aUv - 0.5) * uRect.zw * 0.02 * uHover;
  vec2 ndc = (p / uView) * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec4 uRect;
uniform float uAspect;   // image
uniform float uHover;
uniform vec2 uMouse;
uniform float uVel;
uniform float uReveal;
uniform float uTime;
uniform float uRadius;

vec2 cover(vec2 uv) {
  float ra = uRect.z / uRect.w;
  vec2 s = ra > uAspect ? vec2(1.0, uAspect / ra) : vec2(ra / uAspect, 1.0);
  return (uv - 0.5) * s + 0.5;
}

float rounded(vec2 uv) {
  vec2 px = uv * uRect.zw;
  vec2 q = abs(px - uRect.zw * 0.5) - (uRect.zw * 0.5 - uRadius);
  float d = length(max(q, 0.0)) - uRadius;
  return 1.0 - smoothstep(-1.0, 1.0, d);
}

void main() {
  vec2 uv = vUv;
  // zoom doux au survol
  uv = (uv - 0.5) * (1.0 - 0.06 * uHover) + 0.5;
  // loupe : l'image bombe sous le curseur
  vec2 asp = vec2(uRect.z / uRect.w, 1.0);
  vec2 d = (uv - uMouse) * asp;
  float r = length(d);
  float lens = smoothstep(0.32, 0.0, r) * uHover;
  uv -= d / asp * lens * 0.22;

  vec2 tuv = cover(uv);
  float shift = 0.004 * uHover + abs(uVel) * 0.02;
  vec3 col;
  col.r = texture(uTex, tuv + vec2(shift, 0.0)).r;
  col.g = texture(uTex, tuv).g;
  col.b = texture(uTex, tuv - vec2(shift, 0.0)).b;

  // noir & blanc par défaut ; la couleur revient au survol, depuis le curseur
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float colorize = smoothstep(0.0, 0.9, uHover * 1.6 - r * 0.9);
  col = mix(vec3(lum) * 1.02, col, clamp(colorize, 0.0, 1.0));
  // anneau de la loupe
  col += smoothstep(0.012, 0.0, abs(r - 0.32 * uHover)) * 0.18 * uHover;

  // apparition : une vague qui remonte
  float edge = uReveal * 1.25 - 0.12 + 0.04 * sin(vUv.x * 9.0 + uTime * 2.0);
  float show = smoothstep(edge, edge - 0.04, 1.0 - vUv.y);
  col = mix(vec3(0.0), col, smoothstep(0.0, 0.25, uReveal));

  // grain
  float n = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.04;

  outColor = vec4(col, rounded(vUv) * show);
}`;

export function MediaLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: true });
    if (!ctx) {
      document.documentElement.classList.add("no-media-gl");
      return;
    }
    const gl: WebGL2RenderingContext = ctx;
    const sh = (t: number, s: string) => {
      const o = gl.createShader(t)!;
      gl.shaderSource(o, s);
      gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o));
      return o;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // plaque subdivisée (pour l'ondulation)
    const N = 24;
    const verts: number[] = [];
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const a = [i / N, j / N];
        const b = [(i + 1) / N, j / N];
        const c = [i / N, (j + 1) / N];
        const d = [(i + 1) / N, (j + 1) / N];
        verts.push(...a, ...b, ...c, ...c, ...b, ...d);
      }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aUv");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const names = ["uRect", "uView", "uVel", "uHover", "uTex", "uAspect", "uMouse", "uReveal", "uTime", "uRadius"] as const;
    const u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<(typeof names)[number], WebGLUniformLocation | null>;

    const upload = (s: Slot, source: TexImageSource, aspect: number) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      s.tex = t;
      s.aspect = aspect;
    };
    const pending = new WeakSet<Slot>();
    const prepare = () =>
      slots.forEach((s) => {
        if (s.tex || pending.has(s)) return;
        pending.add(s); // évite un double chargement
        if (s.src) {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => upload(s, img, img.naturalWidth / img.naturalHeight);
          img.onerror = () => upload(s, placeholder(s.label, s.code), 1.6);
          img.src = s.src;
        } else {
          document.fonts.ready.then(() => upload(s, placeholder(s.label, s.code), 1.6));
        }
      });
    notify = prepare;
    prepare();

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let vel = 0;
    let lastY = window.scrollY;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const W = window.innerWidth;
      const H = window.innerHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const y = window.scrollY;
      const target = reduced ? 0 : Math.max(-1, Math.min(1, (y - lastY) / 60));
      lastY = y;
      vel += (target - vel) * (1 - Math.exp(-8 * dt));

      gl.uniform2f(u.uView, W, H);
      gl.uniform1f(u.uVel, vel);
      gl.uniform1f(u.uTime, time);
      slots.forEach((s) => {
        if (!s.tex) return;
        const r = s.el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > H + 50 || r.width < 2) return;
        // révélée quand elle entre à l'écran, une seule fois
        if (r.top < H * 0.92) s.reveal = Math.min(1, s.reveal + dt * (reduced ? 10 : 0.9));
        s.hover += (s.hoverT - s.hover) * (1 - Math.exp(-(s.hoverT ? 6 : 4) * dt));
        gl.bindTexture(gl.TEXTURE_2D, s.tex);
        gl.uniform4f(u.uRect, r.left, r.top, r.width, r.height);
        gl.uniform1f(u.uAspect, s.aspect);
        gl.uniform1f(u.uHover, s.hover);
        gl.uniform2f(u.uMouse, s.mx, s.my);
        gl.uniform1f(u.uReveal, s.reveal);
        gl.uniform1f(u.uRadius, Math.min(20, r.width * 0.04));
        gl.drawArrays(gl.TRIANGLES, 0, N * N * 6);
      });
      nlive.velocity = Math.max(nlive.velocity, Math.abs(vel) * 0.6);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      notify = null;
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] h-full w-full" />;
}
