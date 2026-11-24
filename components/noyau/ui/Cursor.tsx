"use client";

import { useEffect, useRef } from "react";

/**
 * Curseur en négatif (mix-blend-mode: difference) : un point qui suit la
 * main et un anneau qui traîne derrière. Sur un élément [data-cursor], il
 * grossit et affiche le libellé (« Ouvrir », « Écrire »…).
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const p = { x: -100, y: -100, rx: -100, ry: -100, s: 1, ts: 1 };
    let raf = 0;
    const move = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      const text = t?.dataset.cursor ?? "";
      p.ts = t ? (text ? 4.2 : 2.2) : 1;
      if (label.current && label.current.textContent !== text) label.current.textContent = text;
    };
    const down = () => (p.ts *= 0.7);
    const loop = () => {
      p.rx += (p.x - p.rx) * 0.16;
      p.ry += (p.y - p.ry) * 0.16;
      p.s += (p.ts - p.s) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${p.rx}px, ${p.ry}px, 0) scale(${p.s})`;
      if (label.current) label.current.style.transform = `translate3d(${p.rx}px, ${p.ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200] mix-blend-difference max-[900px]:hidden">
      <div ref={dot} className="absolute left-0 top-0 -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-white" />
      <div ref={ring} className="absolute left-0 top-0 -ml-5 -mt-5 h-10 w-10 rounded-full border border-white" />
      <span ref={label} className="t-mono absolute left-0 top-0 whitespace-nowrap text-white" />
    </div>
  );
}
