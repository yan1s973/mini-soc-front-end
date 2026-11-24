"use client";

import { useEffect, useRef, useState } from "react";
import { nlive } from "@/lib/noyau";

/**
 * Compteur géant 000 → 100 qui suit la progression réelle (shaders, atlas,
 * première image), puis le rideau se lève sur le studio.
 */
export function Loader() {
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<"load" | "out" | "gone">("load");

  useEffect(() => {
    let shown = 0;
    let raf = 0;
    const tick = () => {
      shown += (nlive.progress * 100 - shown) * 0.08 + 0.15;
      shown = Math.min(shown, nlive.progress * 100);
      if (num.current) num.current.textContent = String(Math.floor(shown)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown / 100})`;
      if (shown >= 99.5 && nlive.ready) {
        setTimeout(() => setPhase("out"), 250);
        setTimeout(() => setPhase("gone"), 1500);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (phase === "gone") return null;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[180] bg-[#0e0e0e] text-[#ececec]"
      style={{
        clipPath: phase === "out" ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 1100ms cubic-bezier(0.7, 0, 0.2, 1)",
      }}
    >
      <div className="absolute inset-x-[var(--gutter)] top-[var(--gutter)] flex justify-between t-mono">
        <span>Yanis</span>
        <span>Noyau — initialisation</span>
      </div>
      <span
        ref={num}
        className="absolute bottom-[calc(var(--gutter)-0.08em)] left-[calc(var(--gutter)-0.05em)] font-[family-name:var(--font-wide)] text-[min(34vw,52svh)] font-[200] leading-[0.8] tabular-nums [font-stretch:125%]"
      >
        000
      </span>
      <span ref={bar} className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#ececec]" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
