"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STRATA } from "@/content/disciplines";
import { goTo, live } from "@/lib/store";

/**
 * Instruments permanents : marque, cotes du curseur, colonne
 * stratigraphique (navigation) et jauge de profondeur.
 */
export function Chrome() {
  const xRef = useRef<HTMLSpanElement>(null);
  const zRef = useRef<HTMLSpanElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const home = pathname === "/releve";

  useEffect(() => {
    live.hud.x = xRef.current;
    live.hud.z = zRef.current;
    live.hud.alt = altRef.current;
    let raf = 0;
    let last = -1;
    const tick = () => {
      const s = live.scene;
      const c = Math.round(s);
      if (c !== last) {
        last = c;
        setCurrent(c);
      }
      if (depthRef.current) depthRef.current.textContent = (Math.max(0, s - 1) * 110).toFixed(0).padStart(3, "0");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const go = (scene: number, id: string) => {
    if (home) goTo(scene);
    else router.push(`/releve#${id}`);
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-[var(--gutter)]">
        <Link
          href="/releve"
          data-ui
          onClick={(e) => {
            if (home) {
              e.preventDefault();
              goTo(0);
            }
          }}
          className="pointer-events-auto group flex items-baseline gap-4"
        >
          <span className="t-wide text-[13px] font-[650] tracking-[0.42em] text-ink">Yanis</span>
          <span className="t-mono hidden text-graphite sm:inline">Relevé n°01</span>
        </Link>
        <div className="t-mono hidden gap-5 text-graphite tabular-nums md:flex" aria-hidden="true">
          <span>
            X <span ref={xRef} className="text-ink">+0.000</span>
          </span>
          <span>
            Z <span ref={zRef} className="text-ink">+0.000</span>
          </span>
          <span>
            Alt <span ref={altRef} className="text-ink">000</span>
          </span>
        </div>
      </header>

      <nav
        aria-label="Strates"
        className="fixed right-[var(--gutter)] top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-[3px] sm:flex"
      >
        <span className="t-mono mb-2 text-graphite">
          <span ref={depthRef} className="tabular-nums text-ink">000</span> m
        </span>
        {STRATA.map((st, k) => {
          const active = current === k + 2;
          return (
            <button
              key={st.id}
              data-ui
              type="button"
              onClick={() => go(k + 2, st.id)}
              aria-current={active ? "step" : undefined}
              className="group flex items-center gap-3"
            >
              <span
                className={`t-mono whitespace-nowrap transition-all duration-500 ease-[var(--ease-pen)] ${
                  active
                    ? "translate-x-0 bg-[var(--paper-live)] px-1 text-red opacity-100"
                    : "translate-x-2 text-ink opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                {st.n} {st.title}
              </span>
              <span
                className={`legend-${k} block h-9 w-[10px] outline-1 outline-offset-2 transition-[outline-color] duration-300 ${
                  active ? "outline outline-red" : "outline-transparent"
                }`}
              />
            </button>
          );
        })}
        <button
          type="button"
          data-ui
          onClick={() => go(0, "surface")}
          className="t-mono mt-2 text-graphite hover:text-red"
        >
          Surface ↑
        </button>
      </nav>
    </>
  );
}
