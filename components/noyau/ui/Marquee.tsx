"use client";

import { useEffect, useRef } from "react";
import { nlive } from "@/lib/noyau";

/**
 * Bandeau défilant. Sa vitesse et son inclinaison suivent la vitesse du
 * scroll : il s'emballe quand on descend vite, et s'inverse quand on remonte.
 */
export function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 0;
    let raf = 0;
    let lastY = window.scrollY;
    let dir = 1;
    const tick = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) > 0.5) dir = Math.sign(dy);
      const speed = 0.6 + Math.min(14, Math.abs(dy) * 0.35);
      x -= speed * dir * (reverse ? -1 : 1);
      const el = track.current;
      if (el) {
        const w = el.scrollWidth / 2;
        if (x < -w) x += w;
        if (x > 0) x -= w;
        el.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-12, Math.min(12, -dy * 0.25))}deg)`;
      }
      nlive.velocity = Math.max(nlive.velocity, Math.min(1, Math.abs(dy) / 60));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const row = items.map((t, i) => (
    <span key={i} className="flex items-center gap-[0.5em] pr-[0.5em]">
      <span>{t}</span>
      <span className="inline-block h-[0.14em] w-[0.6em] bg-current" />
    </span>
  ));
  return (
    <div className="relative overflow-hidden border-y border-[color-mix(in_srgb,var(--fg)_30%,transparent)] py-4 text-[var(--fg)]" aria-hidden="true">
      <div ref={track} className="t-wide flex w-max whitespace-nowrap text-[clamp(28px,6vw,92px)] font-[300] leading-none will-change-transform">
        {row}
        {row}
      </div>
    </div>
  );
}
