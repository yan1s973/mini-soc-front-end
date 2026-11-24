"use client";

import { useEffect, useState } from "react";
import { live, useUI } from "@/lib/store";

/**
 * Calage de l'instrument. Un seul trait d'encre — la progression réelle
 * (police, champ du nom, compilation des shaders) — posé exactement là où
 * naîtra l'arête avant du bloc.
 */
export function Loader() {
  const ready = useUI((s) => s.ready);
  const field = useUI((s) => s.nameField);
  const webgl = useUI((s) => s.webgl);
  const reduced = useUI((s) => s.reducedMotion);
  const [phase, setPhase] = useState<"load" | "out" | "gone">("load");

  const progress = webgl === null ? 0.08 : (field ? 0.6 : 0.25) + (ready ? 0.4 : 0);

  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(
      () => {
        setPhase("out");
        live.introStart = live.time;
      },
      reduced ? 0 : 700,
    );
    const t2 = setTimeout(() => setPhase("gone"), reduced ? 300 : 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ready, reduced]);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90]"
      style={{
        background: "var(--paper-live)",
        opacity: phase === "out" ? 0 : 1,
        transition: "opacity 900ms var(--ease-pen) 150ms",
      }}
    >
      <div
        className="absolute h-px origin-left bg-ink"
        style={{
          left: "var(--edge-x, 25%)",
          top: "var(--edge-y, 58%)",
          width: "var(--edge-w, 50%)",
          transform: `scaleX(${progress})`,
          transition: "transform 700ms var(--ease-pen)",
        }}
      />
      <div className="t-mono absolute bottom-[var(--gutter)] left-[var(--gutter)] flex gap-6 text-graphite">
        <span>Relevé n°01</span>
        <span>Calage de l&apos;instrument</span>
        <span className="tabular-nums text-ink">{String(Math.round(progress * 100)).padStart(3, "0")}</span>
      </div>
    </div>
  );
}
