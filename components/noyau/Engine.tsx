"use client";

import { useEffect, useRef, useState } from "react";
import { NSCENES, WORDS, nlive } from "@/lib/noyau";
import { FRAG, VERT } from "./shader";

const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));
const ease = (t: number) => t * t * (3 - 2 * t);

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Atlas : un mot par rangée, chacun ajusté à la largeur. */
async function wordAtlas(gl: WebGL2RenderingContext) {
  const family = '"Archivo Variable", "Archivo", "Arial Black", sans-serif';
  await document.fonts.load(`800 200px ${family}`, WORDS.join("")).catch(() => undefined);
  const RW = 2048;
  const RH = 512;
  const c = document.createElement("canvas");
  c.width = RW;
  c.height = RH * WORDS.length;
  const ctx = c.getContext("2d")!;
  (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  WORDS.forEach((w, i) => {
    const word = w.split("").join(String.fromCharCode(8202));
    ctx.font = `800 300px ${family}`;
    const m = ctx.measureText(word).width;
    const size = Math.floor(300 * Math.min(1.4, (RW * 0.92) / m));
    ctx.font = `800 ${size}px ${family}`;
    ctx.fillText(word, RW / 2, RH * i + RH / 2 + size * 0.04);
  });
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/**
 * Le moteur : une seule toile plein écran, persistante entre les pages.
 * Il lit `nlive` (scroll, vitesse, impulsions, fiche ouverte) et écrit en
 * retour `--bg` / `--fg` pour que l'interface bascule avec le studio.
 */
export function Engine() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!ctx) {
      setFailed(true);
      nlive.ready = true;
      nlive.progress = 1;
      return;
    }
    const gl: WebGL2RenderingContext = ctx;
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    } catch (e) {
      console.error(e);
      setFailed(true);
      nlive.ready = true;
      nlive.progress = 1;
      return;
    }
    nlive.progress = 0.4;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const names = ["uRes", "uTime", "uRot", "uPull", "uPulse", "uW", "uAgit", "uInvert", "uShift", "uZoom", "uText", "uRows", "uWordA", "uWordB", "uWordMix", "uCursor"] as const;
    const u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<(typeof names)[number], WebGLUniformLocation | null>;

    const params = new URLSearchParams(location.search);
    const hq = params.has("hq");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    let scale = hq ? 1 : coarse ? 0.5 : 0.7;
    const maxScale = Math.min(1.2, (window.devicePixelRatio || 1) * 0.8);

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const rot = { yaw: 0, pitch: 0, vy: 0, vp: 0 };
    const view = { s: nlive.target, inv: 0, shx: 0, shy: 0.02, zoom: 1, agit: 0, word: 0 };
    const w = [1, 0, 0, 0, 0];
    let time = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    let raf = 0;
    let alive = true;
    let lastCss = -1;

    const resize = () => {
      cv.width = Math.max(2, Math.round(window.innerWidth * scale));
      cv.height = Math.max(2, Math.round(window.innerHeight * scale));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const move = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button, input")) return;
      nlive.pulse = 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    wordAtlas(gl).then((tex) => {
      if (!alive) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(u.uText, 0);
      gl.uniform1f(u.uRows, WORDS.length);
      nlive.progress = 0.8;
      raf = requestAnimationFrame(frame);
    });

    let first = 0;
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += reduced ? dt * 0.3 : dt;

      ptr.x = damp(ptr.x, ptr.tx, 6, dt);
      ptr.y = damp(ptr.y, ptr.ty, 6, dt);

      /* ---- scène ---- */
      const focus = nlive.focus;
      view.s = damp(view.s, nlive.target, reduced ? 12 : 3.2, dt);
      const n = NSCENES.length;
      const sc = Math.min(Math.max(view.s, 0), n - 1);
      const i = Math.min(Math.floor(sc), n - 2);
      const f = ease(Math.min(1, sc - i));
      const A = NSCENES[i];
      const B = NSCENES[i + 1];
      let state = f < 0.5 ? A.state : B.state;
      let inv = A.invert + (B.invert - A.invert) * f;
      let shx = A.shift[0] + (B.shift[0] - A.shift[0]) * f;
      let shy = A.shift[1] + (B.shift[1] - A.shift[1]) * f;
      let zoom = A.zoom + (B.zoom - A.zoom) * f;
      if (focus) {
        state = focus.state;
        inv = focus.invert;
        shx = window.innerWidth > window.innerHeight ? -0.52 : 0;
        shy = window.innerWidth > window.innerHeight ? 0.22 : 0.3;
        zoom = 2.3;
      }
      const portrait = window.innerWidth < window.innerHeight;
      if (portrait) {
        shx = 0;
        if (!focus) shy = view.s < 0.5 ? 0.06 : 0.36;
        zoom *= view.s < 0.5 ? 0.82 : 1.05;
      }
      const L = reduced ? 12 : 2.6;
      view.inv = damp(view.inv, inv, L, dt);
      view.shx = damp(view.shx, shx, L, dt);
      view.shy = damp(view.shy, shy, L, dt);
      view.zoom = damp(view.zoom, zoom, L, dt);
      // le mot : fondu entre le mot de A et celui de B
      const wordA = f < 0.5 ? A.word : B.word;
      for (let k = 0; k < 5; k++) w[k] = damp(w[k], k === state ? 1 : 0, reduced ? 12 : 2.8, dt);

      /* ---- agitation : la vitesse du scroll secoue la matière ---- */
      const vel = reduced ? 0 : Math.min(1, nlive.velocity);
      view.agit = damp(view.agit, vel * 0.55, vel > view.agit ? 8 : 2, dt);
      nlive.velocity *= Math.exp(-4 * dt);

      /* ---- galet : ressort amorti ---- */
      const targetYaw = (reduced ? 0 : time * 0.12) + ptr.x * 0.75;
      const targetPitch = -ptr.y * 0.45 + 0.12;
      rot.vy += ((targetYaw - rot.yaw) * 18 - rot.vy * 7) * dt;
      rot.vp += ((targetPitch - rot.pitch) * 18 - rot.vp * 7) * dt;
      rot.yaw += rot.vy * dt;
      rot.pitch += rot.vp * dt;
      const cy = Math.cos(rot.yaw);
      const sy = Math.sin(rot.yaw);
      const cp = Math.cos(rot.pitch);
      const sp = Math.sin(rot.pitch);
      const R = [cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp];
      const RT = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
      gl.uniformMatrix3fv(u.uRot, false, RT);

      const px = (ptr.x - view.shx * 1.2) * 1.1;
      const py = ptr.y * 0.8;
      gl.uniform3f(
        u.uPull,
        RT[0] * px + RT[3] * py + RT[6] * 0.6,
        RT[1] * px + RT[4] * py + RT[7] * 0.6,
        RT[2] * px + RT[5] * py + RT[8] * 0.6,
      );

      nlive.pulse *= Math.exp(-2.2 * dt);
      gl.uniform1f(u.uPulse, nlive.pulse);
      gl.uniform1fv(u.uW, w);
      gl.uniform1f(u.uAgit, view.agit);
      gl.uniform1f(u.uInvert, view.inv);
      gl.uniform2f(u.uShift, view.shx, view.shy);
      gl.uniform1f(u.uZoom, view.zoom);
      // fondu de mot : au milieu d'une transition, on passe de l'un à l'autre
      const wf = Math.min(1, Math.max(0, (f - 0.35) / 0.3));
      gl.uniform1f(u.uWordA, A.word);
      gl.uniform1f(u.uWordB, B.word);
      gl.uniform1f(u.uWordMix, focus ? 0 : wf);
      view.word = wordA;
      gl.uniform2f(u.uRes, cv.width, cv.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform2f(u.uCursor, ptr.x, ptr.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      /* ---- l'interface suit le studio ---- */
      nlive.invert = view.inv;
      if (Math.abs(view.inv - lastCss) > 0.003) {
        lastCss = view.inv;
        const bg = Math.round(238 + (23 - 238) * view.inv);
        const fg = Math.round(14 + (236 - 14) * view.inv);
        const r = document.documentElement.style;
        r.setProperty("--bg", `rgb(${bg} ${bg} ${bg - 2})`);
        r.setProperty("--fg", `rgb(${fg} ${fg} ${fg})`);
        r.setProperty("--inv", view.inv.toFixed(3));
      }

      if (++first === 3) {
        nlive.ready = true;
        nlive.progress = 1;
        setShown(true);
      }

      acc += dt;
      frames++;
      if (acc > 1.2 && !hq) {
        const fps = frames / acc;
        const prev = scale;
        if (fps < 45) scale = Math.max(0.35, scale - 0.1);
        else if (fps > 58) scale = Math.min(maxScale, scale + 0.05);
        if (scale !== prev) resize();
        acc = 0;
        frames = 0;
      }
      raf = requestAnimationFrame(frame);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="fixed inset-0 z-0 h-full w-full transition-opacity duration-[1600ms] ease-[var(--ease-pen)]"
        style={{ opacity: shown ? 1 : 0 }}
      />
      {failed && <div className="fixed inset-0 z-0 bg-[var(--bg)]" aria-hidden="true" />}
    </>
  );
}
