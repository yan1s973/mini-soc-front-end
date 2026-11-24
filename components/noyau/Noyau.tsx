"use client";

import { useEffect, useRef, useState } from "react";
import { FRAG, VERT } from "./shader";

const STATES = [
  { n: "00", label: "Repos", note: "Le noyau respire." },
  { n: "01", label: "Software", note: "Il se cristallise : ordre, facettes, structure." },
  { n: "02", label: "Cybersecurity", note: "La coque se ferme. Cherchez la faille au curseur." },
  { n: "03", label: "Cloud", note: "Il se divise : quatre îles, un seul système." },
  { n: "04", label: "Experiments", note: "Plus de règle : la matière déborde." },
];

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

async function textTexture(gl: WebGL2RenderingContext) {
  const family = '"Archivo Variable", "Archivo", "Arial Black", sans-serif';
  await document.fonts.load(`800 200px ${family}`, "YANIS").catch(() => undefined);
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 520;
  const ctx = c.getContext("2d")!;
  (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  ctx.font = `800 300px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  const word = "YANIS".split("").join(String.fromCharCode(8202));
  const w = ctx.measureText(word).width;
  const size = Math.floor(300 * Math.min(1.4, (c.width * 0.92) / w));
  ctx.font = `800 ${size}px ${family}`;
  ctx.fillText(word, c.width / 2, c.height / 2 + size * 0.04);
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { tex, aspect: c.width / c.height };
}

export function Noyau() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(0);
  stateRef.current = state;

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!ctx) {
      setFailed(true);
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
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"),
      time: U("uTime"),
      rot: U("uRot"),
      pull: U("uPull"),
      pulse: U("uPulse"),
      w: U("uW"),
      text: U("uText"),
      aspect: U("uTextAspect"),
      cursor: U("uCursor"),
    };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const params = new URLSearchParams(location.search);
    const hq = params.has("hq"); // capture : pleine résolution figée
    let scale = hq ? 1 : coarse ? 0.55 : 0.75; // résolution de rendu, ajustée à la volée
    const maxScale = Math.min(1.25, (window.devicePixelRatio || 1) * 0.85);

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const rot = { yaw: 0, pitch: 0, vy: 0, vp: 0 };
    let pulse = 0;
    const w = [1, 0, 0, 0, 0];
    let time = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    let raf = 0;
    let alive = true;

    const resize = () => {
      cv.width = Math.round(window.innerWidth * scale);
      cv.height = Math.round(window.innerHeight * scale);
      gl.viewport(0, 0, cv.width, cv.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const move = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a")) return;
      move(e);
      pulse = 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);

    textTexture(gl).then(({ tex, aspect }) => {
      if (!alive) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(u.text, 0);
      gl.uniform1f(u.aspect, aspect);
      raf = requestAnimationFrame(frame);
      setTimeout(() => alive && setReady(true), 120);
    });

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += reduced ? dt * 0.3 : dt;

      // pointeur amorti
      ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-6 * dt));
      ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-6 * dt));

      // le galet a de la masse : ressort amorti vers l'orientation visée
      const targetYaw = (reduced ? 0 : time * 0.12) + ptr.x * 0.75;
      const targetPitch = -ptr.y * 0.45 + 0.12;
      const k = 18;
      const c = 7;
      rot.vy += ((targetYaw - rot.yaw) * k - rot.vy * c) * dt;
      rot.vp += ((targetPitch - rot.pitch) * k - rot.vp * c) * dt;
      rot.yaw += rot.vy * dt;
      rot.pitch += rot.vp * dt;

      const cy = Math.cos(rot.yaw);
      const sy = Math.sin(rot.yaw);
      const cp = Math.cos(rot.pitch);
      const sp = Math.sin(rot.pitch);
      // R = Ry * Rx ; on transmet R^T (monde -> local), en colonnes
      const R = [cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp]; // colonnes de Ry*Rx
      const RT = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
      gl.uniformMatrix3fv(u.rot, false, RT);

      // attraction du noyau vers le curseur, exprimée dans le repère du galet
      const px = ptr.x * 1.1;
      const py = ptr.y * 0.8;
      const pz = 0.6;
      const lx = RT[0] * px + RT[3] * py + RT[6] * pz;
      const ly = RT[1] * px + RT[4] * py + RT[7] * pz;
      const lz = RT[2] * px + RT[5] * py + RT[8] * pz;
      gl.uniform3f(u.pull, lx, ly, lz);

      pulse *= Math.exp(-2.2 * dt);
      gl.uniform1f(u.pulse, pulse);

      const st = stateRef.current;
      for (let i = 0; i < 5; i++) w[i] += ((i === st ? 1 : 0) - w[i]) * (1 - Math.exp(-(reduced ? 12 : 2.6) * dt));
      gl.uniform1fv(u.w, w);

      gl.uniform2f(u.res, cv.width, cv.height);
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.cursor, ptr.x, ptr.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // résolution adaptative (~55 fps visés)
      acc += dt;
      frames++;
      if (acc > 1.2 && !hq) {
        const fps = frames / acc;
        const prev = scale;
        if (fps < 45) scale = Math.max(0.4, scale - 0.1);
        else if (fps > 58) scale = Math.min(maxScale, scale + 0.05);
        if (scale !== prev) resize();
        acc = 0;
        frames = 0;
      }
      raf = requestAnimationFrame(frame);
    }

    const initial = Number(params.get("state"));
    if (initial >= 1 && initial <= 4) {
      setState(initial);
      w.fill(0);
      w[initial] = 1;
    }

    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 0 && n <= 4) setState(n);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const s = STATES[state];

  return (
    <main className="relative h-svh w-full overflow-hidden" style={{ background: "#ece5d9" }}>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full transition-opacity duration-[1400ms] ease-[var(--ease-pen)]"
        style={{ opacity: ready ? 1 : 0 }}
      />
      {failed && (
        <p className="t-serif absolute inset-0 grid place-items-center text-[22px] text-graphite">
          WebGL 2 indisponible sur cet appareil.
        </p>
      )}

      <h1 className="sr-only">Yanis — ingénieur logiciel : software engineering, cybersécurité, cloud & infrastructure</h1>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-[var(--gutter)]">
        <span className="t-wide text-[13px] font-[650] tracking-[0.42em]">Yanis</span>
        <span className="t-mono text-graphite">Noyau — prototype du héro</span>
      </header>

      <nav
        aria-label="États du noyau"
        className="absolute bottom-[calc(var(--gutter)+5.5rem)] left-[var(--gutter)] flex gap-4 sm:bottom-auto sm:left-auto sm:right-[var(--gutter)] sm:top-1/2 sm:-translate-y-1/2 sm:flex-col sm:items-end sm:gap-1"
      >
        {STATES.map((st, i) => (
          <button
            key={st.n}
            type="button"
            onClick={() => setState(i)}
            aria-pressed={state === i}
            className={`t-mono flex items-center gap-3 py-1 transition-colors ${state === i ? "text-red" : "text-graphite hover:text-ink"}`}
          >
            <span className={`hidden transition-opacity sm:inline ${state === i ? "opacity-100" : "opacity-0"}`}>{st.label}</span>
            <span className="tabular-nums">{st.n}</span>
            <span className={`hidden h-px transition-all duration-500 sm:block ${state === i ? "w-8 bg-red" : "w-3 bg-ink/40"}`} />
          </button>
        ))}
      </nav>

      <div className="pointer-events-none absolute bottom-[var(--gutter)] left-[var(--gutter)] max-w-[30rem]">
        <p className="t-mono text-graphite">
          {s.n} — {s.label}
        </p>
        <p key={state} className="t-serif mt-2 text-[clamp(22px,2.2vw,32px)] leading-[1.15] text-ink [animation:sheet-in_900ms_var(--ease-pen)_both]">
          {s.note}
        </p>
      </div>

      <div className="t-mono pointer-events-none absolute bottom-[var(--gutter)] right-[var(--gutter)] hidden text-right text-graphite md:block">
        <p>
          <span className="text-ink">Bougez</span> — le galet a du poids.
        </p>
        <p className="mt-1">
          <span className="text-ink">Cliquez</span> — impulsion. <span className="text-ink">0–4</span> — états.
        </p>
      </div>
    </main>
  );
}
