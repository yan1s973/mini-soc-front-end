"use client";

import { useCallback, useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_";

/**
 * Texte qui se décode : les lettres défilent puis se fixent de gauche à
 * droite. Se déclenche à l'apparition et au survol de l'élément parent
 * marqué [data-scramble-root] (ou de lui-même).
 */
export function Scramble({ text, className = "", auto = false }: { text: string; className?: string; auto?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const run = useCallback(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const dur = 380 + text.length * 22;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const fixed = Math.floor(k * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        out += i < fixed || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [text]);

  useEffect(() => {
    const el = ref.current!;
    const root = el.closest<HTMLElement>("[data-scramble-root]") ?? el;
    root.addEventListener("mouseenter", run);
    let io: IntersectionObserver | null = null;
    if (auto) {
      io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && run()), { threshold: 0.6 });
      io.observe(el);
    }
    return () => {
      root.removeEventListener("mouseenter", run);
      io?.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [run, auto]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}
