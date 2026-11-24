"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { buildNameField } from "@/lib/field";
import { detectTier, detectWebGL, TIER } from "@/lib/device";
import { goTo, live, useUI } from "@/lib/store";
import { World } from "./World";
import { StaticMap } from "./StaticMap";

const WORD = "YANIS";
const FONT = '"Archivo Variable", "Archivo", "Arial Black", sans-serif';

/** Ajuste le DPR à la volée pour tenir ~60 fps, avec hystérésis. */
function AdaptiveDpr({ max }: { max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, dpr: Math.min(max, window.devicePixelRatio || 1), good: 0 });
  useEffect(() => setDpr(acc.current.dpr), [setDpr]);
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.n++;
    if (a.t < 1) return;
    const fps = a.n / a.t;
    a.t = 0;
    a.n = 0;
    if (fps < 48 && a.dpr > 0.75) {
      a.dpr = Math.max(0.75, a.dpr - 0.25);
      a.good = 0;
      setDpr(a.dpr);
    } else if (fps > 58) {
      a.good++;
      const cap = Math.min(max, window.devicePixelRatio || 1);
      if (a.good >= 4 && a.dpr < cap) {
        a.dpr = Math.min(cap, a.dpr + 0.25);
        a.good = 0;
        setDpr(a.dpr);
      }
    }
  });
  return null;
}

function usePointer() {
  useEffect(() => {
    const p = live.pointer;
    const move = (e: PointerEvent) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.y = -(e.clientY / window.innerHeight) * 2 + 1;
      p.touch = e.pointerType === "touch";
      if (!p.touch) p.active = true;
      p.lastMove = performance.now();
    };
    const down = (e: PointerEvent) => {
      move(e);
      if (p.touch) p.active = true;
      const t = e.target as HTMLElement;
      if (t.closest("a, button, input, [data-ui]")) return;
      // clic sur la coupe : descendre dans la strate
      if (live.stratum >= 0) {
        goTo(live.stratum + 2);
        return;
      }
      if (!useUI.getState().reducedMotion) {
        live.pulse.x = live.lens.x;
        live.pulse.z = live.lens.z;
        live.pulse.t = live.time;
      }
    };
    const up = () => {
      if (p.touch) p.active = false;
    };
    const leave = () => (p.active = false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
}

export default function Experience() {
  const webgl = useUI((s) => s.webgl);
  const tier = useUI((s) => s.tier);
  const field = useUI((s) => s.nameField);
  usePointer();

  useEffect(() => {
    const set = useUI.getState().set;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const forceFallback = new URLSearchParams(location.search).has("static");
    set({ webgl: !forceFallback && detectWebGL(), tier: detectTier(), reducedMotion: mq.matches });
    const onMq = () => set({ reducedMotion: mq.matches });
    mq.addEventListener("change", onMq);
    let alive = true;
    document.fonts
      .load(`800 120px ${FONT}`, WORD)
      .catch(() => undefined)
      .then(() => {
        if (alive) set({ nameField: buildNameField(WORD, FONT) });
      });
    return () => {
      alive = false;
      mq.removeEventListener("change", onMq);
    };
  }, []);

  if (webgl === null) return null;
  if (!webgl) return <StaticMap />;
  if (!field) return null;

  return (
    <div className="experience" aria-hidden="true">
      <Canvas
        flat
        linear
        dpr={1}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 30, near: 0.1, far: 40, position: [0, 2, 4] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <World />
        <AdaptiveDpr max={TIER[tier].dpr} />
      </Canvas>
    </div>
  );
}
