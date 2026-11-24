"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Transition de page : un disque plein jaillit du curseur et couvre
 * l'écran, la page change dessous, puis le disque se résorbe.
 */
let trigger: ((href: string, x: number, y: number) => void) | null = null;

export function wipeTo(href: string, e?: { clientX: number; clientY: number }) {
  const x = e?.clientX ?? window.innerWidth / 2;
  const y = e?.clientY ?? window.innerHeight / 2;
  if (trigger) trigger(href, x, y);
  else window.location.href = href;
}

export function TransitionLayer() {
  const el = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef(false);

  useEffect(() => {
    trigger = (href, x, y) => {
      const d = el.current;
      if (!d || pending.current) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      pending.current = true;
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20;
      d.style.transition = "none";
      d.style.clipPath = `circle(0px at ${x}px ${y}px)`;
      d.style.visibility = "visible";
      requestAnimationFrame(() => {
        d.style.transition = "clip-path 720ms cubic-bezier(0.7, 0, 0.2, 1)";
        d.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;
      });
      setTimeout(() => router.push(href), 700);
    };
    return () => {
      trigger = null;
    };
  }, [router]);

  // la nouvelle page est là : le disque se résorbe vers le haut
  useEffect(() => {
    const d = el.current;
    if (!d || !pending.current) return;
    window.scrollTo(0, 0);
    const t = setTimeout(() => {
      d.style.transition = "clip-path 900ms cubic-bezier(0.7, 0, 0.2, 1)";
      d.style.clipPath = `inset(0 0 100% 0)`;
      setTimeout(() => {
        d.style.visibility = "hidden";
        pending.current = false;
      }, 920);
    }, 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[150] bg-[var(--fg)]"
      style={{ visibility: "hidden" }}
    />
  );
}
