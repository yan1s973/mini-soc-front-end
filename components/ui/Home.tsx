"use client";

import Lenis from "lenis";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { STRATA, type Stratum } from "@/content/disciplines";
import { codeOf, relevesOf } from "@/content/projects";
import { PROFILE } from "@/content/profile";
import { smoothstep } from "@/lib/field";
import { live, useUI } from "@/lib/store";

/**
 * Le parcours. Chaque section correspond à une scène ; son contenu est
 * épinglé (sticky) pendant qu'on la lit, puis la fin de la section pilote
 * la métamorphose du terrain vers la scène suivante.
 */
const SECTIONS = [
  { id: "surface", h: 100, hold: 0 },
  { id: "coupe", h: 230, hold: 0.5 },
  { id: "software", h: 240, hold: 0.5 },
  { id: "cyber", h: 240, hold: 0.5 },
  { id: "cloud", h: 240, hold: 0.5 },
  { id: "lab", h: 240, hold: 0.5 },
  { id: "about", h: 220, hold: 0.55 },
  { id: "fin", h: 110, hold: 0 },
];

let returnY = 0;
let lenisRef: Lenis | null = null;

export function Home() {
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const reduced = useUI.getState().reducedMotion;
    const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    lenisRef = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      let s = 0;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const top = el.offsetTop;
        const h = el.offsetHeight - (i === SECTIONS.length - 1 ? vh : 0);
        if (y >= top - 1) {
          const local = Math.min(1, Math.max(0, (y - top) / Math.max(1, h)));
          s = i + smoothstep(SECTIONS[i].hold, 1, local);
        }
      });
      live.sceneTarget = Math.min(s, SECTIONS.length - 1);
      refs.current.forEach((el, i) => {
        if (!el) return;
        const active = Math.abs(live.sceneTarget - i) < 0.5;
        if (el.dataset.active !== String(active)) el.dataset.active = String(active);
      });
    };

    const scrollTo = (i: number, immediate = false) => {
      const el = refs.current[Math.max(0, Math.min(SECTIONS.length - 1, i))];
      if (!el) return;
      const y = i === 0 ? 0 : el.offsetTop;
      if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: y });
    };

    const onGoto = (e: Event) => scrollTo((e as CustomEvent<number>).detail);
    window.addEventListener("releve:goto", onGoto);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // retour d'une fiche, ou arrivée par ancre (#cyber)
    const hash = location.hash.slice(1);
    const idx = SECTIONS.findIndex((s) => s.id === hash);
    if (returnY > 0) {
      window.scrollTo(0, returnY);
      lenis?.scrollTo(returnY, { immediate: true });
    } else if (idx > 0) scrollTo(idx, true);
    update();
    live.scene = live.sceneTarget;

    live.fromHome = false;
    return () => {
      returnY = window.scrollY;
      live.fromHome = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenisRef = null;
      window.removeEventListener("releve:goto", onGoto);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const reg = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
  };

  return (
    <main id="contenu" className="relative z-20">
      <Surface ref={reg(0)} />
      <Coupe ref={reg(1)} />
      {STRATA.slice(0, 4).map((st, k) => (
        <Chapter key={st.id} ref={reg(k + 2)} st={st} />
      ))}
      <About ref={reg(6)} />
      <Fin ref={reg(7)} />
    </main>
  );
}

/* -------------------------------------------------------------------------- */

type SecProps = { ref: (el: HTMLElement | null) => void };

function Section({
  id,
  h,
  children,
  label,
  ref,
}: {
  id: string;
  h: number;
  label: string;
  children: React.ReactNode;
  ref: (el: HTMLElement | null) => void;
}) {
  return (
    <section ref={ref} id={id} aria-label={label} data-active="false" className="sec relative" style={{ height: `${h}svh` }}>
      <div className="sticky top-0 h-svh overflow-hidden">{children}</div>
    </section>
  );
}

function Lines({ children, className = "" }: { children: React.ReactNode[]; className?: string }) {
  return (
    <span className={`reveal ${className}`}>
      {children.map((c, i) => (
        <span key={i}>
          <span className="line" style={{ transitionDelay: `${i * 90 + 120}ms` }}>
            {c}
          </span>
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

function Surface({ ref }: SecProps) {
  const webgl = useUI((s) => s.webgl);
  return (
    <section ref={ref} id="surface" aria-label="Surface" data-active="true" className="sec relative h-svh">
      <h1 className="sr-only">
        Yanis — {PROFILE.role} : {PROFILE.domains.join(", ")}
      </h1>
      <div className="absolute bottom-[var(--gutter)] left-[var(--gutter)] w-[min(360px,calc(100vw-2*var(--gutter)))] border border-ink/70 bg-[color-mix(in_srgb,var(--paper-live)_82%,transparent)] backdrop-blur-[2px]">
        <div className="t-mono flex justify-between border-b border-ink/40 px-3 py-2 text-graphite">
          <span>Relevé n°01</span>
          <span>Feuille 1 / 5</span>
        </div>
        <div className="px-3 pb-3 pt-2">
          <p className="t-serif text-[34px] leading-none">{PROFILE.name}</p>
          <p className="t-mono mt-2 text-ink">{PROFILE.role}</p>
          <p className="t-mono text-graphite">{PROFILE.domains.join(" · ")}</p>
        </div>
        <div className="t-mono grid grid-cols-2 border-t border-ink/40 text-graphite">
          <span className="border-r border-ink/40 px-3 py-2">Équidist. 0,012 u</span>
          <span className="px-3 py-2">Échelle 1 : 1</span>
        </div>
      </div>

      <div
        className={`t-mono pointer-events-none absolute bottom-[var(--gutter)] right-[var(--gutter)] hidden max-w-[240px] text-right text-graphite ${webgl ? "md:block" : ""}`}
      >
        <p>
          <span className="text-ink">Survolez</span> — la loupe révèle ce qui est sous la surface.
        </p>
        <p className="mt-1">
          <span className="text-ink">Cliquez</span> — lancer un sondage.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-[var(--gutter)] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex">
        <span className="t-mono text-graphite">0 m</span>
        <span className="scale-rule block h-14 w-px bg-ink/60" />
        <span className="t-serif text-[17px]">descendre</span>
      </div>
    </section>
  );
}

function Coupe({ ref }: SecProps) {
  const set = useUI((s) => s.set);
  const hi = useUI((s) => s.stratum);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    live.bands = STRATA.map((_, k) => ({ line: lineRefs.current[k], label: labelRefs.current[k] }));
    return () => {
      live.bands = [];
    };
  }, []);

  return (
    <Section id="coupe" h={230} label="Coupe — sommaire" ref={ref}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {STRATA.map((_, k) => (
          <line
            key={k}
            ref={(el) => {
              lineRefs.current[k] = el;
            }}
            stroke={hi === k ? "var(--color-red)" : "var(--color-ink)"}
            strokeWidth="1"
            strokeDasharray={hi === k ? undefined : "1 3"}
            style={{ opacity: 0 }}
          />
        ))}
      </svg>
      <div className="relative flex h-full flex-col justify-end px-[var(--gutter)] pb-[var(--gutter)] sm:justify-center sm:pb-0 sm:pt-16">
        <p className="t-mono text-graphite">Coupe A — A′</p>
        <h2 className="t-wide mt-3 text-[clamp(22px,3vw,40px)] font-[500] leading-[1.05]">
          <Lines>{["Cinq", "strates"]}</Lines>
        </h2>
        <p className="t-serif mt-4 max-w-[22ch] text-[clamp(20px,1.8vw,26px)] leading-[1.15] text-ink/85">
          Chaque couche est un métier. Choisissez où descendre.
        </p>
        <ol className="mt-10 flex flex-col">
          {STRATA.map((st, k) => (
            <li key={st.id}>
              <button
                type="button"
                data-ui
                ref={(el) => {
                  labelRefs.current[k] = el;
                }}
                onPointerEnter={() => set({ stratum: k })}
                onPointerLeave={() => set({ stratum: -1 })}
                onFocus={() => set({ stratum: k })}
                onBlur={() => set({ stratum: -1 })}
                onClick={() => window.dispatchEvent(new CustomEvent("releve:goto", { detail: k + 2 }))}
                className="group flex items-center gap-4 border-t border-ink/25 py-[10px] pr-4 text-left"
              >
                <span className={`legend-${k} block h-5 w-8 shrink-0`} />
                <span className={`t-mono w-6 ${hi === k ? "text-red" : "text-graphite"}`}>{st.n}</span>
                <span className="flex flex-col">
                  <span
                    className={`t-wide text-[12px] font-[560] transition-colors ${hi === k ? "text-red" : "text-ink"}`}
                  >
                    {st.title}
                  </span>
                  <span className="t-serif text-[16px] text-graphite">{st.landform}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

function Chapter({ st, ref }: SecProps & { st: Stratum }) {
  const list = relevesOf(st.id as never);
  const k = STRATA.indexOf(st);
  return (
    <Section id={st.id} h={240} label={`${st.n} — ${st.title}`} ref={ref}>
      <div className="relative flex h-full flex-col justify-end px-[var(--gutter)] pb-[calc(var(--gutter)+2svh)]">
        <span aria-hidden="true" className="t-ghost pointer-events-none absolute left-[calc(var(--gutter)-0.06em)] top-[10svh] hidden select-none text-[min(24vw,34svh)] sm:block">
          {st.n}
        </span>
        <div className="relative max-w-[30rem] max-sm:-mx-[var(--gutter)] max-sm:bg-[linear-gradient(to_bottom,transparent,var(--paper-live)_64px)] max-sm:px-[var(--gutter)] max-sm:pt-16">
          <p className="t-mono flex items-center gap-3 text-graphite">
            <span className={`legend-${k} inline-block h-3 w-5`} />
            Strate {st.n} — {st.legend}
          </p>
          <h2 className="t-wide mt-4 text-[clamp(19px,2.15vw,31px)] font-[480] leading-[1.08] tracking-[0.12em]">
            <Lines>{st.title.split(" ")}</Lines>
          </h2>
          <p className="t-serif mt-3 text-[clamp(22px,2vw,30px)] text-red">{st.landform}</p>
          <p className="mt-5 max-w-[38ch] text-[15.5px] leading-[1.6] text-ink/85">{st.lede}</p>

          <div className="mt-9">
            <p className="t-mono mb-2 flex justify-between text-graphite">
              <span>Registre des relevés</span>
              <span>{String(list.length).padStart(2, "0")}</span>
            </p>
            <ul>
              {list.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/releves/${r.slug}`}
                    data-ui
                    scroll={false}
                    className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-t border-ink/25 py-[11px]"
                  >
                    <span className="t-mono text-graphite group-hover:text-red">R {codeOf(r)}</span>
                    {r.title ? (
                      <span className="t-wide text-[11.5px] font-[560]">{r.title}</span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <span className="hatch block h-[10px] w-16" />
                        <span className="t-serif text-[16px] text-graphite">non relevé</span>
                      </span>
                    )}
                    <span className="t-mono text-graphite transition-transform duration-300 group-hover:translate-x-1 group-hover:text-red">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

function About({ ref }: SecProps) {
  return (
    <Section id="about" h={220} label="05 — About" ref={ref}>
      <div className="relative flex h-full flex-col justify-end px-[var(--gutter)] pb-[calc(var(--gutter)+2svh)]">
        <span aria-hidden="true" className="t-ghost pointer-events-none absolute left-[calc(var(--gutter)-0.06em)] top-[10svh] hidden select-none text-[min(24vw,34svh)] sm:block">
          05
        </span>
        <div className="relative max-w-[30rem] max-sm:-mx-[var(--gutter)] max-sm:bg-[linear-gradient(to_bottom,transparent,var(--paper-live)_64px)] max-sm:px-[var(--gutter)] max-sm:pt-16">
          <p className="t-mono flex items-center gap-3 text-graphite">
            <span className="legend-4 inline-block h-3 w-5" />
            Strate 05 — Socle — hachures
          </p>
          <h2 className="t-wide mt-4 text-[clamp(19px,2.15vw,31px)] font-[480] leading-[1.08] tracking-[0.12em]">
            <Lines>{["About"]}</Lines>
          </h2>
          <p className="t-serif mt-3 max-w-[20ch] text-[clamp(24px,2.3vw,34px)] leading-[1.1]">
            Vu d&apos;en haut, le relief se lit enfin.
          </p>
          <p className="mt-5 max-w-[40ch] text-[15.5px] leading-[1.6] text-ink/85">
            {PROFILE.role} — {PROFILE.domains.join(", ")}.
          </p>
          {PROFILE.bio ? (
            <p className="mt-3 max-w-[40ch] text-[15.5px] leading-[1.6] text-ink/85">{PROFILE.bio}</p>
          ) : (
            <p className="mt-4 flex items-center gap-3">
              <span className="hatch block h-[10px] w-20" />
              <span className="t-serif text-[16px] text-graphite">présentation non relevée</span>
            </p>
          )}

          <dl className="t-mono mt-9 border border-ink/60">
            <div className="flex justify-between border-b border-ink/40 px-3 py-2 text-graphite">
              <dt>Coordonnées</dt>
              <dd>Cartouche</dd>
            </div>
            {PROFILE.contact.map((c) => (
              <div key={c.label} className="grid grid-cols-[7rem_1fr] border-b border-ink/20 px-3 py-[9px] last:border-0">
                <dt className="text-graphite">{c.label}</dt>
                <dd>
                  {c.href ? (
                    <a data-ui href={c.href} className="text-ink underline-offset-4 hover:text-red hover:underline">
                      {c.value ?? c.href}
                    </a>
                  ) : (
                    <span className="flex items-center gap-3 normal-case">
                      <span className="hatch block h-[8px] w-10" />
                      <span className="t-serif text-[15px] tracking-normal text-graphite">à renseigner</span>
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}

function Fin({ ref }: SecProps) {
  return (
    <section ref={ref} id="fin" aria-label="Fin du relevé" data-active="false" className="sec relative h-[110svh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-5 text-center">
        <p className="t-mono text-graphite">Fin du relevé</p>
        <p className="t-serif text-[clamp(26px,3vw,44px)] leading-tight">Le territoire redevient une ligne.</p>
        <button
          type="button"
          data-ui
          onClick={() => {
            if (lenisRef) lenisRef.scrollTo(0, { duration: 3.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
            else window.scrollTo({ top: 0 });
          }}
          className="t-mono mt-4 border border-ink/70 px-4 py-2 transition-colors hover:border-red hover:text-red"
        >
          Remonter à la surface ↑
        </button>
      </div>
    </section>
  );
}
