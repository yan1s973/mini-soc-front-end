"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { CHAPTERS, MANIFESTE } from "@/content/noyau";
import { PROFILE } from "@/content/profile";
import { codeOf, relevesOf } from "@/content/projects";
import { NSCENES, nlive } from "@/lib/noyau";
import { Marquee } from "./Marquee";
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

    const holds: Record<string, number> = { hero: 0, manifeste: 0.3, contact: 0 };
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
      (es) => es.forEach((e) => e.isIntersecting && e.target.setAttribute("data-in", "")),
      { threshold: 0.25 },
    );
    document.querySelectorAll(".split, .rise").forEach((el) => io.observe(el));

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

      {/* ------------------------------------------------ manifeste */}
      <section ref={reg(1)} id="manifeste" className="relative min-h-[170svh]">
        <div className="sticky top-0 flex h-svh items-center px-[var(--gutter)]">
          <div ref={manif} className="max-w-[min(56rem,58vw)] max-md:max-w-none" style={{ ["--n" as string]: words.length }}>
            <p className="t-mono mb-8 opacity-60">Manifeste</p>
            <p className="text-[clamp(30px,4.4vw,76px)] font-[300] leading-[1.04] tracking-[-0.015em]">
              {words.map((w, i) => (
                <span
                  key={i}
                  className="manif-w"
                  style={{ ["--i" as string]: i }}
                >
                  {w}{" "}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>

      <Marquee items={["Software Engineering", "Cybersecurity", "Cloud & Infrastructure", "Experiments"]} />

      {/* ------------------------------------------------ chapitres */}
      {CHAPTERS.map((c, k) => {
        const right = k % 2 === 1; // l'objet passe à gauche, le texte à droite
        const list = relevesOf(c.id);
        return (
          <section ref={reg(k + 2)} id={c.id} key={c.id} className="relative min-h-[190svh]">
            <div className={`sticky top-0 flex min-h-svh flex-col justify-end px-[var(--gutter)] pb-10 pt-28 md:justify-center md:py-28 ${right ? "md:items-end" : ""}`}>
              <div className={`w-full max-w-[40rem] ${right ? "md:text-right" : ""}`}>
                <div className={`flex items-baseline gap-5 ${right ? "md:flex-row-reverse" : ""}`}>
                  <span className="outline-num text-[clamp(90px,15vw,240px)]">{c.n}</span>
                  <span className="t-mono opacity-60">{c.verb}</span>
                </div>
                <h2 className="skewy mt-2 text-[clamp(28px,4.1vw,72px)] font-[300] uppercase leading-[0.95] tracking-[-0.015em] [font-stretch:125%]">
                  <Split text={c.title} />
                </h2>
                <p className="t-serif mt-6 max-w-[34ch] text-[clamp(20px,1.8vw,28px)] leading-[1.2] opacity-85 md:inline-block">
                  {c.lede}
                </p>

                <ul className="mt-12 border-t border-[color-mix(in_srgb,var(--fg)_35%,transparent)] text-left">
                  {list.map((r) => (
                    <li key={r.slug}>
                      <a
                        href={`/projets/${r.slug}`}
                        data-cursor="Ouvrir"
                        data-scramble-root
                        onMouseEnter={() => (nlive.pulse = Math.max(nlive.pulse, 0.55))}
                        onClick={(e) => {
                          e.preventDefault();
                          wipeTo(`/projets/${r.slug}`, e);
                        }}
                        className="row group relative grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-[color-mix(in_srgb,var(--fg)_35%,transparent)] py-5"
                      >
                        <span className="row-fill" aria-hidden="true" />
                        <span className="t-mono relative">{codeOf(r)}</span>
                        <span className="relative text-[clamp(18px,1.6vw,24px)] font-[400] uppercase tracking-[0.04em] [font-stretch:115%]">
                          <Scramble text={r.title ?? "Projet à venir"} />
                        </span>
                        <span className="t-mono relative transition-transform duration-500 group-hover:translate-x-1">
                          {r.year ?? "—"} ↗
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      {/* ------------------------------------------------ about */}
      <section ref={reg(6)} id="about" className="relative min-h-[170svh]">
        <div className="sticky top-0 flex min-h-svh flex-col justify-end px-[var(--gutter)] pb-10 pt-28 md:justify-center md:py-28">
          <div className="max-w-[40rem]">
            <div className="flex items-baseline gap-5">
              <span className="outline-num text-[clamp(90px,15vw,240px)]">05</span>
              <span className="t-mono opacity-60">À propos</span>
            </div>
            <h2 className="skewy mt-2 text-[clamp(28px,4.1vw,72px)] font-[300] uppercase leading-[0.95] tracking-[-0.015em] [font-stretch:125%]">
              <Split text="Yanis" />
            </h2>
            <p className="t-serif mt-6 text-[clamp(22px,2vw,30px)] leading-[1.2]">
              {PROFILE.role} — {PROFILE.domains.join(", ")}.
            </p>
            {PROFILE.bio ? (
              <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.65] opacity-85">{PROFILE.bio}</p>
            ) : (
              <p className="placeholder mt-6">Présentation à venir</p>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ contact */}
      <section ref={reg(7)} id="contact" className="relative min-h-[130svh]">
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
