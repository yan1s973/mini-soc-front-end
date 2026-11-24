"use client";

import { useEffect } from "react";
import { CHAPTERS } from "@/content/noyau";
import { codeOf, indexOf, relevesOf, type Releve } from "@/content/projects";
import { nlive } from "@/lib/noyau";
import { ArchDiagram } from "@/components/ui/ArchDiagram";
import { Scramble } from "./Scramble";
import { wipeTo } from "./Transition";

const LOOK: Record<string, { state: number; invert: number }> = {
  software: { state: 1, invert: 0 },
  cyber: { state: 2, invert: 1 },
  cloud: { state: 3, invert: 0 },
  lab: { state: 4, invert: 1 },
};

/** Fiche projet. Tout champ vide est affiché comme tel — rien n'est inventé. */
export function CaseStudy({ r }: { r: Releve }) {
  const ch = CHAPTERS.find((c) => c.id === r.discipline)!;
  const list = relevesOf(r.discipline);
  const i = indexOf(r);
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  const code = codeOf(r);

  useEffect(() => {
    nlive.focus = LOOK[r.discipline];
    nlive.pulse = 1;
    document.querySelectorAll(".split").forEach((el) => setTimeout(() => el.setAttribute("data-in", ""), 500));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && wipeTo(`/#${r.discipline}`);
    window.addEventListener("keydown", onKey);
    return () => {
      nlive.focus = null;
      window.removeEventListener("keydown", onKey);
    };
  }, [r.discipline, r.slug]);

  const sections: [string, React.ReactNode][] = [
    ["Problème", r.problem],
    ["Concept", r.concept],
    ["Solution", r.solution],
    [
      "Architecture",
      <>
        {r.architecture ?? <Empty field="architecture" />}
        {r.diagram ? <ArchDiagram d={r.diagram} /> : <Empty field="diagram" label="Schéma à venir" />}
      </>,
    ],
    ["Stack", r.stack && <p className="t-mono text-[12px] leading-[2]">{r.stack.join("  ·  ")}</p>],
    ["Décisions", r.decisions && <Items items={r.decisions} />],
    ["Défis", r.challenges && <Items items={r.challenges} />],
    ["Résultats", r.results && <Items items={r.results} />],
    ["Limites", r.limitations && <Items items={r.limitations} />],
  ];

  return (
    <main
      id="contenu"
      className="case relative z-10 text-[var(--fg)]"
      style={
        {
          "--color-ink": "var(--fg)",
          "--color-paper": "var(--bg)",
          "--color-graphite": "color-mix(in srgb, var(--fg) 60%, transparent)",
        } as React.CSSProperties
      }
    >
      <header className="relative flex min-h-svh flex-col justify-end px-[var(--gutter)] pb-[var(--gutter)] pt-32 md:pl-[46vw]">
        <button
          type="button"
          onClick={(e) => wipeTo(`/#${r.discipline}`, e)}
          data-cursor="Retour"
          data-scramble-root
          className="t-mono absolute left-[var(--gutter)] top-[calc(var(--gutter)+2.5rem)] hover:opacity-60"
        >
          <Scramble text={`← ${ch.n} ${ch.title}`} />
        </button>
        <p className="t-mono opacity-60">
          Projet {code} — {ch.title}
        </p>
        <h1 className="skewy mt-5 text-[clamp(40px,6.4vw,112px)] font-[300] uppercase leading-[0.9] tracking-[-0.02em] [font-stretch:125%]">
          <span className="split" aria-label={r.title ?? "Projet à venir"}>
            {(r.title ?? "Projet à venir").split(" ").map((w, wi) => (
              <span key={wi} className="split-w" aria-hidden="true">
                {w.split("").map((c, ci) => (
                  <span key={ci} className="split-c" style={{ transitionDelay: `${(wi * 6 + ci) * 26}ms` }}>
                    {c}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </h1>
        <p className="t-serif mt-6 max-w-[36ch] text-[clamp(20px,1.8vw,28px)] leading-[1.2] opacity-85">
          {r.summary ?? "Résumé à venir."}
        </p>
        <dl className="t-mono mt-10 grid grid-cols-3 border-t border-[color-mix(in_srgb,var(--fg)_35%,transparent)] pt-4">
          {[
            ["Année", r.year ?? "—"],
            ["Rôle", r.role ?? "—"],
            ["Statut", r.status === "published" ? "Publié" : "En préparation"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="opacity-50">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <article className="relative bg-[var(--bg)] px-[var(--gutter)] pb-24">
        {sections.map(([label, body], k) => (
          <section
            key={label}
            className="grid grid-cols-1 gap-4 border-t border-[color-mix(in_srgb,var(--fg)_30%,transparent)] py-10 md:grid-cols-[minmax(12rem,30vw)_1fr]"
          >
            <h2 className="flex items-baseline gap-4">
              <span className="outline-num text-[56px]">{String(k + 1).padStart(2, "0")}</span>
              <span className="t-mono">{label}</span>
            </h2>
            <div className="max-w-[62ch] text-[17px] leading-[1.7]">{body ?? <Empty field={label.toLowerCase()} />}</div>
          </section>
        ))}
        <section className="grid grid-cols-1 gap-4 border-t border-[color-mix(in_srgb,var(--fg)_30%,transparent)] py-10 md:grid-cols-[minmax(12rem,30vw)_1fr]">
          <h2 className="flex items-baseline gap-4">
            <span className="outline-num text-[56px]">10</span>
            <span className="t-mono">Liens</span>
          </h2>
          <div className="t-mono flex flex-wrap gap-3">
            {(
              [
                ["GitHub", r.links.github],
                ["Démo", r.links.demo],
              ] as const
            ).map(([k, v]) =>
              v ? (
                <a key={k} href={v} target="_blank" rel="noreferrer" data-cursor="Ouvrir" className="border border-current px-4 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                  {k} ↗
                </a>
              ) : (
                <span key={k} className="placeholder !mt-0 px-4 py-3">
                  {k} — à venir
                </span>
              ),
            )}
          </div>
        </section>

        <nav aria-label="Projets voisins" className="mt-10 grid grid-cols-2 border-t border-current">
          {[prev, next].map((p, k) => (
            <a
              key={p.slug + k}
              href={`/projets/${p.slug}`}
              data-cursor={k ? "Suivant" : "Précédent"}
              data-scramble-root
              onClick={(e) => {
                e.preventDefault();
                wipeTo(`/projets/${p.slug}`, e);
              }}
              className={`group py-10 ${k ? "text-right" : ""}`}
            >
              <span className="t-mono opacity-60">{k ? "Suivant" : "Précédent"}</span>
              <span className="mt-3 block text-[clamp(22px,3vw,44px)] font-[300] uppercase [font-stretch:125%]">
                <Scramble text={`${codeOf(p)} ${p.title ?? "Projet à venir"}`} />
              </span>
            </a>
          ))}
        </nav>
      </article>
    </main>
  );
}

function Empty({ field, label = "À documenter" }: { field: string; label?: string }) {
  return (
    <div className="placeholder flex items-center justify-between gap-4 px-4 py-5">
      <span className="t-serif text-[18px] normal-case">{label}</span>
      <code className="t-mono opacity-60">projects.ts → {field}</code>
    </div>
  );
}

function Items({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((t, n) => (
        <li key={n} className="grid grid-cols-[2.5rem_1fr]">
          <span className="t-mono pt-1 opacity-60">{String(n + 1).padStart(2, "0")}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}
