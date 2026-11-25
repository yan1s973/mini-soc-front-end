"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { NSCENES, nlive } from "@/lib/noyau";
import { Scramble } from "./Scramble";
import { wipeTo } from "./Transition";

const LABELS: Record<string, string> = {
  hero: "Index",
  profil: "01 — Profil",
  projets: "02 — Projets",
  certifications: "03 — Certifications",
  experiences: "04 — Expériences",
  autres: "05 — Autres",
  contact: "Contact",
};

export function goSection(id: string) {
  window.dispatchEvent(new CustomEvent("noyau:goto", { detail: id }));
}

export function Nav() {
  const where = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const home = pathname === "/";

  useEffect(() => {
    let raf = 0;
    let last = "";
    const tick = () => {
      const id = NSCENES[Math.min(NSCENES.length - 1, Math.max(0, Math.round(nlive.target)))].id;
      const text = home ? LABELS[id] : pathname.startsWith("/certifications") ? "03 — Certifications" : "Fiche projet";
      if (text !== last && where.current) {
        last = text;
        where.current.textContent = text;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [home, pathname]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (home) goSection(id);
    else wipeTo(`/#${id}`, e);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex items-start justify-between p-[var(--gutter)] text-[var(--fg)]">
      <a href="/" onClick={go("hero")} data-scramble-root className="t-wide text-[13px] font-[650] tracking-[0.42em]">
        <Scramble text="YANIS" />
      </a>
      <span ref={where} className="t-mono hidden opacity-60 md:block" aria-live="polite">
        Index
      </span>
      <nav aria-label="Principal" className="t-mono flex gap-5">
        {[
          ["profil", "Profil"],
          ["projets", "Projets"],
          ["certifications", "Certifs"],
          ["experiences", "Parcours"],
          ["contact", "Contact"],
        ].map(([id, label], k) => (
          <a
            key={id}
            href={`/#${id}`}
            onClick={go(id)}
            data-scramble-root
            className={`hover:opacity-60 ${k > 0 && k < 4 ? "hidden sm:inline" : ""}`}
          >
            <Scramble text={label} />
          </a>
        ))}
      </nav>
    </header>
  );
}
