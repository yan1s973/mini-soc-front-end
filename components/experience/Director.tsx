"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BLOCK_DEPTH, STRATUM, heightAt, smoothstep, type Weights } from "@/lib/field";
import { SCENES } from "@/lib/scenes";
import { slotPosition } from "@/lib/slots";
import { live, useUI } from "@/lib/store";

export interface Uniforms {
  [k: string]: { value: unknown };
  uName: { value: THREE.DataTexture };
  uW: { value: number[] };
  uTime: { value: number };
  uGrow: { value: number };
  uGrowDepth: { value: number };
  uLens: { value: THREE.Vector3 };
  uLensLift: { value: number };
  uCut: { value: number };
  uWater: { value: number };
  uLiquid: { value: number };
  uDusk: { value: number };
  uPulse: { value: THREE.Vector4 };
  uHi: { value: number };
}

const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const PAPER = [0xec, 0xe5, 0xd5];
const PAPER_SHADE = [0xd5, 0xcc, 0xb8];

const tmpV = new THREE.Vector3();
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

export function Director({ uniforms }: { uniforms: Uniforms }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const reduced = useUI((s) => s.reducedMotion);
  const field = useUI((s) => s.nameField);

  const st = useRef({
    weights: [1, 1, 0, 0, 0, 0] as Weights,
    look: new THREE.Vector3(),
    orbit: [4, 0, 0.5],
    shift: [0, 0],
    px: 0,
    py: 0,
    lens: 0,
    focusMix: 0,
    frame: 0,
    duskCss: -1,
    edgeSet: false,
    hoverBand: -1,
    focusPos: new THREE.Vector3(),
  });

  // signale que les shaders sont compilés et que la première image est prête
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.compile(scene, camera);
  }, [gl, scene, camera]);

  useFrame((_, rawDt) => {
    const s0 = st.current;
    const dt = Math.min(rawDt, 1 / 20);
    live.time += reduced ? dt * 0.35 : dt;
    uniforms.uTime.value = live.time;
    s0.frame++;
    if (s0.frame === 3) useUI.getState().set({ ready: true });

    /* ---------------- scène ---------------- */
    const focus = live.focus;
    const target = focus ? focus.scene : live.sceneTarget;
    live.scene = damp(live.scene, target, reduced ? 10 : 2.4, dt);
    const sRaw = Math.min(Math.max(live.scene, 0), SCENES.length);
    const outro = Math.max(0, sRaw - (SCENES.length - 1)); // aplatissement final
    const s = Math.min(sRaw, SCENES.length - 1);
    const i = Math.min(Math.floor(s), SCENES.length - 2);
    const f = ease(Math.min(1, s - i));
    const A = SCENES[i];
    const B = SCENES[i + 1];

    const w = s0.weights;
    for (let k = 0; k < 6; k++) w[k] = lerp(A.weights[k], B.weights[k], f);
    uniforms.uW.value = w;

    s0.focusMix = damp(s0.focusMix, focus ? 1 : 0, reduced ? 10 : 2.6, dt);
    const fm = ease(Math.min(1, s0.focusMix));

    let cut = lerp(A.cut, B.cut, f);
    const water = lerp(A.water, B.water, f);
    const liquid = lerp(A.liquid, B.liquid, f);
    uniforms.uWater.value = water;
    uniforms.uLiquid.value = liquid;
    uniforms.uLensLift.value = lerp(A.lensLift, B.lensLift, f);
    const dusk = lerp(A.dusk, B.dusk, f) * (1 - fm * 0.5);
    uniforms.uDusk.value = dusk;

    /* ---------------- ouverture ---------------- */
    let intro = 0;
    if (live.introStart >= 0) intro = reduced ? 1 : Math.min(1, (live.time - live.introStart) / 2.6);
    const growDepth = smoothstep(0, 0.4, intro) * (1 - smoothstep(0.35, 1, outro));
    const grow = ease(smoothstep(0.2, 1, intro)) * (1 - smoothstep(0, 0.6, outro));
    uniforms.uGrow.value = grow;
    uniforms.uGrowDepth.value = growDepth;

    /* ---------------- borne ouverte ---------------- */
    if (focus) {
      const [fx, fz] = slotPosition(SCENES[focus.scene].id, focus.index, live.time);
      const fy = heightAt(fx, fz, w, live.time, grow, field);
      s0.focusPos.set(fx, fy, fz);
    }
    cut = lerp(cut, s0.focusPos.x + 0.001, fm);
    uniforms.uCut.value = cut;

    /* ---------------- caméra ---------------- */
    const portrait = size.width / size.height < 0.9;
    const pointer = live.pointer;
    s0.px = damp(s0.px, reduced ? 0 : pointer.x, 2.2, dt);
    s0.py = damp(s0.py, reduced ? 0 : pointer.y, 2.2, dt);

    let r = lerp(A.orbit[0], B.orbit[0], f);
    let az = lerp(A.orbit[1], B.orbit[1], f) + s0.px * 0.07 * (1 - liquid * 0.5);
    let el = lerp(A.orbit[2], B.orbit[2], f) - s0.py * 0.04;
    s0.look.set(lerp(A.look[0], B.look[0], f), lerp(A.look[1], B.look[1], f), lerp(A.look[2], B.look[2], f));
    let shx = lerp(A.shift[0], B.shift[0], f);
    let shy = lerp(A.shift[1], B.shift[1], f);

    // fiche ouverte : plongée vers la borne, coupe à son droit
    s0.look.lerp(s0.focusPos, fm * 0.85);
    r = lerp(r, 3.5, fm);
    az = lerp(az, 62 * (Math.PI / 180), fm);
    el = lerp(el, 24 * (Math.PI / 180), fm);
    shx = lerp(shx, portrait ? 0 : 0.24, fm);
    shy = lerp(shy, portrait ? 0.3 : 0, fm);

    if (portrait) {
      const aspect = size.width / size.height;
      r *= 1 + (1 / aspect - 1) * 0.62;
      shx = 0;
      // portrait : le bloc monte dans la moitié haute, le texte vit dessous
      const up = Math.min(1, Math.max(0, s - 0.5) * 2);
      shy = lerp(0.04, 0.22, up) * (1 - fm) + 0.3 * fm;
    }

    const ce = Math.cos(el);
    camera.position.set(
      s0.look.x + r * Math.sin(az) * ce,
      s0.look.y + r * Math.sin(el),
      s0.look.z + r * Math.cos(az) * ce,
    );
    camera.lookAt(s0.look);
    camera.setViewOffset(size.width, size.height, shx * size.width, shy * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // place la ligne de chargement exactement sur l'arête avant du bloc
    if (!s0.edgeSet || live.introStart < 0) {
      const a = tmpV.set(-1, 0, 1).project(camera);
      const ax = (a.x * 0.5 + 0.5) * size.width;
      const ay = (-a.y * 0.5 + 0.5) * size.height;
      const b = tmpV.set(1, 0, 1).project(camera);
      const bx = (b.x * 0.5 + 0.5) * size.width;
      const root = document.documentElement.style;
      root.setProperty("--edge-x", `${ax}px`);
      root.setProperty("--edge-y", `${ay}px`);
      root.setProperty("--edge-w", `${bx - ax}px`);
      s0.edgeSet = true;
    }

    /* ---------------- loupe ---------------- */
    ndc.set(pointer.x, pointer.y);
    ray.setFromCamera(ndc, camera);
    const o = ray.ray.origin;
    const d = ray.ray.direction;
    let hy = live.lens.h;
    let hx = 0;
    let hz = 0;
    let inside = false;
    if (Math.abs(d.y) > 1e-4) {
      for (let k = 0; k < 4; k++) {
        const t = (hy - o.y) / d.y;
        hx = o.x + d.x * t;
        hz = o.z + d.z * t;
        hy = heightAt(hx, hz, w, live.time, grow, field);
      }
      inside = t0(hx, hz, cut);
    }
    const now = performance.now();
    const wantLens =
      !focus && grow > 0.5 && pointer.active && inside && (pointer.touch || now - pointer.lastMove < 3200);
    s0.lens = damp(s0.lens, wantLens ? 1 : 0, wantLens ? 5 : 1.6, dt);
    if (inside) {
      live.lens.x = damp(live.lens.x, hx, 14, dt);
      live.lens.z = damp(live.lens.z, hz, 14, dt);
      live.lens.h = hy;
    }
    uniforms.uLens.value.set(live.lens.x, live.lens.z, s0.lens);
    const pl = live.pulse;
    uniforms.uPulse.value.set(pl.x, pl.z, pl.t, 0);

    /* ---------------- coupe : survol des strates ---------------- */
    const coupe = 1 - Math.min(1, Math.abs(s - 1) / 0.35);
    let band = -1;
    if (coupe > 0.5 && !focus && pointer.active && Math.abs(d.x) > 1e-4) {
      const t = (cut - o.x) / d.x;
      const y = o.y + d.y * t;
      const z = o.z + d.z * t;
      const top = heightAt(cut, z, w, live.time, grow, field);
      if (t > 0 && Math.abs(z) <= 1 && y <= top && y >= -BLOCK_DEPTH) {
        band = Math.min(4, Math.max(0, Math.floor(-y / STRATUM)));
      }
    }
    if (band !== s0.hoverBand) {
      s0.hoverBand = band;
      live.stratum = band;
      document.body.style.cursor = band >= 0 ? "pointer" : "";
    }
    const domBand = useUI.getState().stratum;
    uniforms.uHi.value = coupe > 0.2 ? (domBand >= 0 ? domBand : band) : -1;

    /* ---------------- lignes de rappel des strates ---------------- */
    if (live.bands.length) {
      const vis = coupe;
      const rects = live.bands.map((b) => b.label?.getBoundingClientRect() ?? null);
      live.bands.forEach((b, k) => {
        if (!b.line) return;
        const y = k === 0 ? -0.045 : -STRATUM * (k + 0.5);
        const p = tmpV.set(cut, y, 0.35 - k * 0.12).project(camera);
        const x2 = (p.x * 0.5 + 0.5) * size.width;
        const y2 = (-p.y * 0.5 + 0.5) * size.height;
        const rc = rects[k];
        if (!rc) return;
        b.line.setAttribute("x1", String(rc.right + 12));
        b.line.setAttribute("y1", String(rc.top + rc.height / 2));
        b.line.setAttribute("x2", String(x2));
        b.line.setAttribute("y2", String(y2));
        b.line.style.opacity = String(Math.max(0, vis * 2 - 1));
      });
    }

    /* ---------------- bornes ---------------- */
    live.markers.forEach((m) => {
      const isFocus = focus?.slug === m.el.dataset.slug;
      const dist = Math.abs(s - m.scene);
      let v = focus ? (isFocus ? fm : 0) : (1 - smoothstep(0.12, 0.4, dist)) * smoothstep(0.6, 1, grow);
      const [mx, mz] = slotPosition(m.sceneId, m.index, live.time);
      if (mx > cut + 0.002) v = 0;
      const my = heightAt(mx, mz, w, live.time, grow, field);
      const p = tmpV.set(mx, my, mz).project(camera);
      const x = (p.x * 0.5 + 0.5) * size.width;
      const y = (-p.y * 0.5 + 0.5) * size.height;
      if (p.z > 1) v = 0;
      m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      m.el.style.opacity = v.toFixed(3);
      const on = v > 0.6;
      if (m.el.dataset.on !== String(on)) {
        m.el.dataset.on = String(on);
        m.el.toggleAttribute("inert", !on);
      }
    });

    /* ---------------- cotes (HUD) ---------------- */
    if (s0.frame % 4 === 0) {
      const { x, z, alt } = live.hud;
      const fmt = (n: number) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(3);
      if (x) x.textContent = fmt(live.lens.x);
      if (z) z.textContent = fmt(live.lens.z);
      if (alt) alt.textContent = (Math.max(0, live.lens.h) * 1000).toFixed(0).padStart(3, "0");
    }

    /* ---------------- papier CSS = papier WebGL ---------------- */
    if (Math.abs(dusk - s0.duskCss) > 0.004) {
      s0.duskCss = dusk;
      const c = PAPER.map((v, k) => Math.round(lerp(v, PAPER_SHADE[k], dusk)));
      document.documentElement.style.setProperty("--paper-live", `rgb(${c[0]} ${c[1]} ${c[2]})`);
    }
  });

  return null;
}

function t0(x: number, z: number, cut: number) {
  return Math.abs(x) <= 1 && Math.abs(z) <= 1 && x <= cut;
}
