"use client";

import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { CERTIFICATIONS } from "@/content/certifications";
import { nlive } from "@/lib/noyau";
import { CertViewer } from "./CertViewer";
import { Roll } from "./Roll";
import { wipeTo } from "./Transition";

/**
 * Page Certifications : la carte 3D reste épinglée ; on fait défiler la
 * liste (ou on clique, ou ← →) et la carte se retourne sur la suivante.
 */
export function Certifications() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    nlive.suspend = true;
    const r = document.documentElement.style;
    r.setProperty("--bg", "rgb(12 12 12)");
    r.setProperty("--fg", "rgb(236 236 236)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ lerp: 0.09 });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onScroll = () => {
      const mid = window.innerHeight * 0.5;
      let best = 0;
      let bestD = Infinity;
      items.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") go(Math.min(CERTIFICATIONS.length - 1, activeRef.current + 1));
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(Math.max(0, activeRef.current - 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    onScroll();
    return () => {
      nlive.suspend = false;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const activeRef = useRef(0);
  activeRef.current = active;

  const go = (i: number) => {
    const el = items.current[i];
    if (!el) return;
    const y = el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2;
    if (lenisRef.current) lenisRef.current.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y });
  };

  const c = CERTIFICATIONS[active];

  return (
    <main id="contenu" className="relative z-10 text-[var(--fg)]">
      {/* carte épinglée */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[52svh] md:left-[38vw] md:h-svh">
        <div className="pointer-events-auto h-full w-full">
          <CertViewer certs={CERTIFICATIONS} index={active} />
        </div>
        <div className="t-mono absolute bottom-[var(--gutter)] left-1/2 hidden -translate-x-1/2 text-center opacity-60 md:block">
          Glisser pour tourner · défiler ou cliquer pour changer
        </div>
      </div>

      <div className="relative z-10 px-[var(--gutter)] pt-[56svh] md:w-[38vw] md:pt-0">
        <header className="flex min-h-[60svh] flex-col justify-end pb-16 md:min-h-svh">
          <button
            type="button"
            onClick={(e) => wipeTo("/#certifications", e)}
            data-cursor="Retour"
            className="t-mono mb-10 self-start opacity-60 hover:opacity-100"
          >
            ← Accueil
          </button>
          <p className="t-mono opacity-60">03 — Certifications</p>
          <h1 className="mt-4 text-[clamp(40px,5.6vw,96px)] font-[300] uppercase leading-[0.9] tracking-[-0.02em] [font-stretch:125%]">
            Certifi&shy;cations
          </h1>
          <p className="t-serif mt-5 text-[22px] opacity-80">{String(CERTIFICATIONS.length).padStart(2, "0")} documents, à manipuler.</p>
        </header>

        <ol>
          {CERTIFICATIONS.map((x, i) => (
            <li
              key={x.slug}
              ref={(el) => {
                items.current[i] = el;
              }}
              className="flex min-h-[70svh] items-center"
            >
              <button
                type="button"
                onClick={() => go(i)}
                data-cursor="Voir"
                className={`roll-root w-full border-t border-[color-mix(in_srgb,var(--fg)_30%,transparent)] py-6 text-left transition-opacity duration-500 ${
                  active === i ? "opacity-100" : "opacity-35"
                }`}
              >
                <span className="t-mono block opacity-60">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-3 block text-[clamp(22px,2.4vw,36px)] uppercase leading-none tracking-[0.02em] [font-stretch:115%]">
                  <Roll text={x.name ?? "Certification à renseigner"} />
                </span>
                <span className="t-mono mt-4 grid grid-cols-2 gap-2 opacity-70">
                  <span>{x.issuer ?? "Organisme —"}</span>
                  <span>{x.date ?? "Date —"}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="t-mono flex min-h-[40svh] items-center justify-between gap-4 border-t border-[color-mix(in_srgb,var(--fg)_30%,transparent)] py-10">
          <span>
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer" data-cursor="Vérifier" className="underline underline-offset-4">
                Vérifier « {c.name} » ↗
              </a>
            ) : (
              <span className="opacity-60">Vérification — à renseigner</span>
            )}
          </span>
          <button type="button" onClick={(e) => wipeTo("/#experiences", e)} className="hover:opacity-60" data-cursor="Suite">
            Expériences →
          </button>
        </div>
      </div>
    </main>
  );
}
