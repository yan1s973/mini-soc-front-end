"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { CERTIFICATIONS } from "@/content/certifications";
import { EXPERIENCES } from "@/content/experiences";
import { EXTRAS } from "@/content/extras";
import { CHAPTERS, MANIFESTE } from "@/content/noyau";
import { PROFILE } from "@/content/profile";
import { codeOf, featured } from "@/content/projects";
import { NSCENES, nlive } from "@/lib/noyau";
import { Marquee } from "./Marquee";
import { MediaSlot } from "./Media";
import { Roll } from "./Roll";
import { Scramble } from "./Scramble";
import { wipeTo } from "./Transition";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

let returnY = 0;

/** Titre cinétique : chaque lettre monte de son masque, en cascade. */
function Split({ text, className = "" }: { text: string; className?: string }) {
  let k = 0;
  return (
    <span className={`split ${className}`} aria-label={text}>
      {text.split(" ").map((w, wi) => (
        <span key={wi} className="split-w" aria-hidden="true">
          {w.split("").map((c, ci) => (
            <span key={ci} className="split-c" style={{ transitionDelay: `${(k++) * 28}ms` }}>
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function NoyauHome() {
  const secs = useRef<(HTMLElement | null)[]>([]);
  const manif = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    let raf = 0;
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    lenis?.on("scroll", (l: Lenis) => {
      const v = Math.min(1, Math.abs(l.velocity) / 45);
      nlive.velocity = Math.max(nlive.velocity, v);
      document.documentElement.style.setProperty("--skew", String(Math.max(-6, Math.min(6, l.velocity * 0.12))));
    });

    const holds: Record<string, number> = { hero: 0, profil: 0.3, projets: 0.8, experiences: 0.7, contact: 0 };
    const update = () => {
      const y = window.scrollY;
      let s = 0;
      secs.current.forEach((el, i) => {
        if (!el) return;
        const top = el.offsetTop;
        const h = Math.max(1, el.offsetHeight - (i === NSCENES.length - 1 ? window.innerHeight : 0));
        if (y >= top - 1) s = i + smooth(holds[NSCENES[i].id] ?? 0.55, 1, (y - top) / h);
      });
      nlive.target = Math.min(s, NSCENES.length - 1);

      // manifeste : les mots s'allument au fil du scroll
      const m = manif.current;
      if (m) {
        const r = m.getBoundingClientRect();
        const p = smooth(window.innerHeight * 0.85, -r.height * 0.35, r.top);
        m.style.setProperty("--p", p.toFixed(3));
      }
    };
    const onGoto = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const el = document.getElementById(id);
      if (!el) return;
      const top = id === "hero" ? 0 : el.offsetTop;
      if (lenis) lenis.scrollTo(top, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("noyau:goto", onGoto);

    // titres : on déclenche la cascade quand ils entrent à l'écran
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting || e.target.hasAttribute("data-in")) return;
          e.target.setAttribute("data-in", "");
          // compteurs : de 0 à la valeur, une seule fois
          const el = e.target as HTMLElement;
          const v = Number(el.dataset.value);
          if (el.classList.contains("count") && el.dataset.value && Number.isFinite(v)) {
            const t0 = performance.now();
            const tick = (now: number) => {
              const k = Math.min(1, (now - t0) / 1600);
              el.textContent = Math.round(v * (1 - Math.pow(1 - k, 4))).toLocaleString("fr-FR");
              if (k < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }),
      { threshold: 0.25 },
    );
    document.querySelectorAll(".split, .rise, .count").forEach((el) => io.observe(el));

    const hash = location.hash.slice(1);
    if (returnY > 0) {
      window.scrollTo(0, returnY);
      lenis?.scrollTo(returnY, { immediate: true });
    } else if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        window.scrollTo(0, el.offsetTop);
        lenis?.scrollTo(el.offsetTop, { immediate: true });
      }
    }
    update();

    return () => {
      returnY = window.scrollY;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      io.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("noyau:goto", onGoto);
    };
  }, []);

  const reg = (i: number) => (el: HTMLElement | null) => {
    secs.current[i] = el;
  };
  const words = MANIFESTE.split(" ");

  return (
    <main id="contenu" className="relative z-10 text-[var(--fg)]">
      {/* ------------------------------------------------ héro */}
      <section ref={reg(0)} id="hero" className="relative h-svh">
        <h1 className="sr-only">
          Yanis — {PROFILE.role} : {PROFILE.domains.join(", ")}
        </h1>
        <div className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-[var(--gutter)] flex items-end justify-between gap-8">
          <p className="rise max-w-[19ch] text-[clamp(26px,3.3vw,52px)] font-[300] leading-[1.02] tracking-[-0.01em]">
            <Split text="Logiciel, sécurité, infrastructure." />
          </p>
          <div className="t-mono hidden shrink-0 text-right opacity-70 md:block">
            <p>{PROFILE.role}</p>
            <p className="mt-1">Défiler — la matière change d&apos;état</p>
          </div>
        </div>
        <div className="t-mono pointer-events-none absolute left-1/2 top-[calc(var(--gutter)+2.2rem)] hidden -translate-x-1/2 opacity-60 md:block">
          Bougez · cliquez
        </div>
      </section>

      {/* ------------------------------------------------ 01 profil */}
      <section ref={reg(1)} id="profil" className="relative min-h-[200svh]">
        <div className="sticky top-0 flex h-svh items-center px-[var(--gutter)]">
          <div ref={manif} className="max-w-[min(56rem,58vw)] max-md:max-w-none" style={{ ["--n" as string]: words.length }}>
            <p className="t-mono mb-8 flex gap-6 opacity-60">
              <span>01 — Profil</span>
              <span>{PROFILE.role}</span>
            </p>
            <p className="text-[clamp(30px,4.4vw,76px)] font-[300] leading-[1.04] tracking-[-0.015em]">
              {words.map((w, i) => (
                <span key={i} className="manif-w" style={{ ["--i" as string]: i }}>
                  {w}{" "}
                </span>
              ))}
            </p>
            <div className="mt-10 grid max-w-[44rem] grid-cols-1 gap-6 border-t border-[color-mix(in_srgb,var(--fg)_30%,transparent)] pt-6 sm:grid-cols-2">
              {PROFILE.bio ? (
                <p className="text-[16px] leading-[1.65] opacity-85">{PROFILE.bio}</p>
              ) : (
                <p className="placeholder self-start">Présentation à venir</p>
              )}
              <ul className="t-mono flex flex-col gap-2">
                {PROFILE.domains.map((d) => (
                  <li key={d} className="flex justify-between border-b border-[color-mix(in_srgb,var(--fg)_20%,transparent)] pb-2">
                    <span>{d}</span>
                    <span className="opacity-50">●</span>
                  </li>
                ))}
                <li className="flex justify-between opacity-60">
                  <span>Localisation</span>
                  <span>{PROFILE.location ?? "—"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Marquee items={["Software Engineering", "Cybersecurity", "Cloud & Infrastructure", "Experiments"]} />

      {/* ------------------------------------------------ 02 projets */}
      <section ref={reg(2)} id="projets" className="relative px-[var(--gutter)] pb-[30svh] pt-[22svh]">
        <header className="mb-[10svh] flex items-start justify-between gap-6">
          <h2 className="skewy text-[clamp(56px,12.5vw,230px)] font-[300] uppercase leading-[0.82] tracking-[-0.03em] [font-stretch:125%]">
            <Split text="Projets" />
          </h2>
          <div className="t-mono flex flex-col items-end gap-3 pt-3 text-right">
            <span className="outline-num text-[clamp(40px,5vw,84px)]">{String(featured().length).padStart(2, "0")}</span>
            <span className="opacity-60">02 — Sélection</span>
            <span className="arrow-loop text-[28px] leading-none">↘</span>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-x-[3vw] gap-y-[12svh] md:grid-cols-2">
          {featured().map((r, k) => {
            const ch = CHAPTERS.find((c) => c.id === r.discipline)!;
            return (
              <a
                key={r.slug}
                href={`/projets/${r.slug}`}
                data-cursor="Ouvrir"
                onMouseEnter={() => (nlive.pulse = Math.max(nlive.pulse, 0.5))}
                onClick={(e) => {
                  e.preventDefault();
                  wipeTo(`/projets/${r.slug}`, e);
                }}
                className={`media-root roll-root group block ${k % 2 === 1 ? "md:mt-[18svh]" : ""}`}
              >
                <MediaSlot src={r.thumbnail} label={r.title ?? "Projet à venir"} code={codeOf(r)} className="aspect-[16/10] w-full" />
                <div className="mt-5 flex items-start justify-between gap-6">
                  <div>
                    <p className="t-mono opacity-60">{ch.title} • {r.year ?? "—"}</p>
                    <p className="mt-2 text-[clamp(24px,2.6vw,44px)] uppercase leading-none tracking-[-0.01em] [font-stretch:120%]">
                      <Roll text={r.title ?? "Projet à venir"} />
                    </p>
                  </div>
                  <span className="t-mono mt-1 shrink-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
                    {codeOf(r)} ↗
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ 03 certifications */}
      <section ref={reg(3)} id="certifications" className="relative min-h-[170svh]">
        <div className="sticky top-0 flex min-h-svh flex-col justify-end px-[var(--gutter)] pb-10 pt-28 md:justify-center">
          <div className="max-w-[40rem]">
            <div className="flex items-baseline gap-5">
              <span className="outline-num text-[clamp(90px,15vw,240px)]">03</span>
              <span className="t-mono opacity-60">{String(CERTIFICATIONS.length).padStart(2, "0")} documents</span>
            </div>
            <h2 className="skewy mt-2 text-[clamp(28px,4.1vw,72px)] font-[300] uppercase leading-[0.95] tracking-[-0.015em] [font-stretch:125%]">
              <Split text="Certifications" />
            </h2>
            <p className="t-serif mt-6 max-w-[34ch] text-[clamp(20px,1.8vw,28px)] leading-[1.2] opacity-85">
              Chaque certificat devient un objet : on le prend en main, on le retourne.
            </p>
            <ul className="mt-10 border-t border-[color-mix(in_srgb,var(--fg)_35%,transparent)]">
              {CERTIFICATIONS.slice(0, 3).map((c, i) => (
                <li key={c.slug} className="t-mono flex justify-between border-b border-[color-mix(in_srgb,var(--fg)_35%,transparent)] py-3">
                  <span>{String(i + 1).padStart(2, "0")} — {c.name ?? "À renseigner"}</span>
                  <span className="opacity-60">{c.issuer ?? "—"}</span>
                </li>
              ))}
            </ul>
            <a
              href="/certifications"
              data-cursor="Manipuler"
              data-scramble-root
              onClick={(e) => {
                e.preventDefault();
                wipeTo("/certifications", e);
              }}
              className="btn-fill mt-10 inline-flex items-center gap-4 rounded-full border border-current px-6 py-4 t-mono"
            >
              <Scramble text="Manipuler les certificats" />
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 04 expériences */}
      <section ref={reg(4)} id="experiences" className="relative px-[var(--gutter)] py-[24svh]">
        <div className="max-w-[min(62rem,60vw)] max-md:max-w-none">
          <div className="flex items-baseline gap-5">
            <span className="outline-num text-[clamp(90px,15vw,240px)]">04</span>
            <span className="t-mono opacity-60">Parcours</span>
          </div>
          <h2 className="skewy mt-2 text-[clamp(28px,4.1vw,72px)] font-[300] uppercase leading-[0.95] tracking-[-0.015em] [font-stretch:125%]">
            <Split text="Expériences" />
          </h2>
          <ol className="mt-14 border-t border-[color-mix(in_srgb,var(--fg)_35%,transparent)]">
            {EXPERIENCES.map((x, i) => (
              <li key={i} className="border-b border-[color-mix(in_srgb,var(--fg)_35%,transparent)]">
                <details className="xp roll-root group">
                  <summary className="grid cursor-none list-none grid-cols-[7rem_1fr_auto] items-baseline gap-4 py-7 max-sm:grid-cols-[1fr_auto]">
                    <span className="t-mono opacity-60 max-sm:col-span-2">{x.period ?? "Période —"}</span>
                    <span className="text-[clamp(20px,2.2vw,34px)] uppercase leading-none [font-stretch:115%]">
                      <Roll text={x.role ?? "Poste à renseigner"} />
                      <span className="t-mono mt-2 block normal-case opacity-60">
                        {x.company ?? "Entreprise —"} · {x.location ?? "Lieu —"}
                      </span>
                    </span>
                    <span className="xp-plus t-mono text-[22px]">+</span>
                  </summary>
                  <div className="pb-8 pl-0 sm:pl-[8rem]">
                    {x.summary ? (
                      <p className="max-w-[60ch] text-[16px] leading-[1.65] opacity-85">{x.summary}</p>
                    ) : (
                      <p className="placeholder">Description à venir</p>
                    )}
                    {x.points && (
                      <ul className="mt-4 flex flex-col gap-2 text-[15px] opacity-85">
                        {x.points.map((pt, k) => (
                          <li key={k}>— {pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ 05 autres */}
      <section ref={reg(5)} id="autres" className="relative px-[var(--gutter)] py-[24svh]">
        <div className="md:ml-auto md:max-w-[min(56rem,50vw)]">
          <div className="flex items-baseline gap-5 md:flex-row-reverse">
            <span className="outline-num text-[clamp(90px,15vw,240px)]">05</span>
            <span className="t-mono opacity-60">Signaux</span>
          </div>
          <h2 className="skewy mt-2 text-[clamp(28px,4.1vw,72px)] font-[300] uppercase leading-[0.95] tracking-[-0.015em] [font-stretch:125%] md:text-right">
            <Split text="Autres" />
          </h2>
          <div className="mt-14 grid grid-cols-1 border-l border-t border-[color-mix(in_srgb,var(--fg)_35%,transparent)] sm:grid-cols-2">
            {EXTRAS.map((x) => (
              <div key={x.title} className="flex min-h-[18rem] flex-col justify-between border-b border-r border-[color-mix(in_srgb,var(--fg)_35%,transparent)] p-6">
                <p className="t-mono opacity-60">{x.title}</p>
                {x.figure ? (
                  <p className="my-6">
                    <span
                      className="count block text-[clamp(56px,6vw,110px)] font-[200] leading-none tabular-nums [font-stretch:125%]"
                      data-value={x.figure.value ?? ""}
                    >
                      {x.figure.value === null ? "—" : "0"}
                    </span>
                    <span className="t-mono mt-2 block opacity-60">{x.figure.label}</span>
                  </p>
                ) : null}
                {x.items ? (
                  <ul className="flex flex-col gap-2 text-[15px] opacity-85">
                    {x.items.map((it, k) => (
                      <li key={k}>— {it}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="placeholder self-start">À compléter</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ contact */}
      <section ref={reg(6)} id="contact" className="relative min-h-[130svh]">
        <div className="sticky top-0 flex h-svh flex-col justify-end px-[var(--gutter)] pb-[var(--gutter)]">
          <p className="t-mono mb-6 opacity-60">Contact</p>
          <a
            href={PROFILE.contact[0].href ?? "#contact"}
            data-cursor="Écrire"
            data-scramble-root
            className="skewy block text-[clamp(56px,13vw,220px)] font-[200] uppercase leading-[0.85] tracking-[-0.03em] [font-stretch:125%]"
          >
            <Split text="Écrire" />
          </a>
          <div className="t-mono mt-10 flex flex-wrap justify-between gap-6 border-t border-[color-mix(in_srgb,var(--fg)_35%,transparent)] pt-5">
            {PROFILE.contact.map((c) =>
              c.href ? (
                <a key={c.label} href={c.href} data-scramble-root className="hover:opacity-60">
                  <Scramble text={c.label} />
                </a>
              ) : (
                <span key={c.label} className="opacity-45">
                  {c.label} — à renseigner
                </span>
              ),
            )}
            <span className="opacity-45">© {new Date().getFullYear()} Yanis</span>
          </div>
        </div>
      </section>
    </main>
  );
}
