"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { strataById } from "@/content/disciplines";
import { codeOf, indexOf, relevesOf, type Releve } from "@/content/projects";
import { SCENE_INDEX } from "@/lib/scenes";
import { live } from "@/lib/store";

/**
 * Fiche de relevé. Le terrain se coupe au droit de la borne pendant que la
 * feuille monte sur la table. Lecture 100 % HTML ; les champs vides sont
 * affichés comme tels, jamais remplis.
 */
export function CaseSheet({ r }: { r: Releve }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const st = strataById[r.discipline];
  const siblings = relevesOf(r.discipline);
  const i = indexOf(r);
  const prev = siblings[(i - 1 + siblings.length) % siblings.length];
  const next = siblings[(i + 1) % siblings.length];
  const code = codeOf(r);

  useEffect(() => {
    live.focus = { slug: r.slug, scene: SCENE_INDEX[r.discipline], index: i };
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollTo({ top: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (live.focus?.slug === r.slug) {
        live.sceneTarget = SCENE_INDEX[r.discipline];
        live.focus = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.slug]);

  function close() {
    if (live.fromHome) router.back();
    else router.push(`/#${r.discipline}`);
  }

  const sections: { k: string; label: string; body: React.ReactNode; field: keyof Releve }[] = [
    { k: "1", label: "Problème", field: "problem", body: r.problem },
    { k: "2", label: "Concept", field: "concept", body: r.concept },
    { k: "3", label: "Solution", field: "solution", body: r.solution },
    { k: "4", label: "Architecture", field: "architecture", body: r.architecture },
    { k: "5", label: "Stack technique", field: "stack", body: r.stack && <Inline items={r.stack} /> },
    { k: "6", label: "Décisions d'ingénierie", field: "decisions", body: r.decisions && <List items={r.decisions} /> },
    { k: "7", label: "Défis", field: "challenges", body: r.challenges && <List items={r.challenges} /> },
    { k: "8", label: "Résultats", field: "results", body: r.results && <List items={r.results} /> },
    { k: "9", label: "Limites", field: "limitations", body: r.limitations && <List items={r.limitations} /> },
  ];

  return (
    <div className="sheet fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <button
        type="button"
        data-ui
        aria-label="Fermer la fiche et revenir au terrain"
        onClick={close}
        className="absolute inset-0 cursor-zoom-out"
      />
      <article
        ref={panel}
        tabIndex={-1}
        data-lenis-prevent
        className="sheet-panel relative h-full w-full overflow-y-auto overscroll-contain bg-paper outline-none md:w-[min(680px,54vw)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/30 bg-paper/95 px-[var(--gutter)] py-4 backdrop-blur-sm">
          <span className="t-mono text-graphite">
            Fiche de relevé — <span className="text-ink">R {code}</span>
          </span>
          <button type="button" data-ui onClick={close} className="t-mono hover:text-red">
            Retour au terrain ✕
          </button>
        </div>

        <header className="px-[var(--gutter)] pb-10 pt-12">
          <p className="t-mono flex items-center gap-3 text-graphite">
            <span className={`legend-${["software", "cyber", "cloud", "lab"].indexOf(r.discipline)} inline-block h-3 w-5`} />
            Strate {st.n} — {st.title} — {st.landform}
          </p>
          <h1 id="sheet-title" className="t-wide mt-6 text-[clamp(26px,3.6vw,48px)] font-[480] leading-[1.02]">
            <span className="reveal">
              <span>
                <span className="line">{r.title ?? `Relevé ${code}`}</span>
              </span>
            </span>
          </h1>
          {r.title ? null : (
            <p className="mt-4 flex items-center gap-3">
              <span className="hatch block h-[10px] w-20" />
              <span className="t-serif text-[18px] text-graphite">titre non relevé</span>
            </p>
          )}
          <p className="t-serif mt-5 max-w-[34ch] text-[22px] leading-[1.25] text-ink/85">
            {r.summary ?? <Unrecorded field="summary" inline />}
          </p>

          <dl className="t-mono mt-10 grid grid-cols-3 border border-ink/50">
            {[
              ["Année", r.year],
              ["Rôle", r.role],
              ["Statut", r.status === "published" ? "Publié" : "En attente"],
            ].map(([k, v], n) => (
              <div key={k} className={`px-3 py-2 ${n < 2 ? "border-r border-ink/40" : ""}`}>
                <dt className="text-graphite">{k}</dt>
                <dd className="mt-1 text-ink">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="px-[var(--gutter)]">
          {sections.map((s) => (
            <section key={s.k} className="grid grid-cols-1 gap-3 border-t border-ink/30 py-7 sm:grid-cols-[11rem_1fr]">
              <h2 className="t-mono text-graphite">
                <span className="text-red">§{s.k}</span> {s.label}
              </h2>
              <div className="text-[15.5px] leading-[1.65] text-ink/90">
                {s.body ?? <Unrecorded field={String(s.field)} />}
              </div>
            </section>
          ))}

          <section className="grid grid-cols-1 gap-3 border-t border-ink/30 py-7 sm:grid-cols-[11rem_1fr]">
            <h2 className="t-mono text-graphite">
              <span className="text-red">§10</span> Liens
            </h2>
            <div className="t-mono flex flex-wrap gap-3">
              <ExtLink href={r.links.github} label="GitHub" />
              <ExtLink href={r.links.demo} label="Démo" />
            </div>
          </section>
        </div>

        <nav
          aria-label="Relevés voisins"
          className="t-mono mt-6 grid grid-cols-2 border-t border-ink/50 text-graphite"
        >
          <Link data-ui scroll={false} href={`/releves/${prev.slug}`} className="border-r border-ink/40 px-[var(--gutter)] py-6 hover:text-red">
            ← R {codeOf(prev)}
          </Link>
          <Link data-ui scroll={false} href={`/releves/${next.slug}`} className="px-[var(--gutter)] py-6 text-right hover:text-red">
            R {codeOf(next)} →
          </Link>
        </nav>
      </article>
    </div>
  );
}

function Unrecorded({ field, inline = false }: { field: string; inline?: boolean }) {
  if (inline)
    return (
      <span className="flex items-center gap-3">
        <span className="hatch block h-[10px] w-14" />
        <span className="text-graphite">résumé non relevé</span>
      </span>
    );
  return (
    <div className="hatch flex min-h-[64px] items-end justify-between gap-4 border border-ink/25 px-3 py-2">
      <span className="t-serif bg-paper px-1 text-[17px] text-graphite">non relevé</span>
      <code className="t-mono bg-paper px-1 normal-case tracking-normal text-graphite/80">projects.ts → {field}</code>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t, n) => (
        <li key={n} className="grid grid-cols-[1.5rem_1fr]">
          <span className="t-mono pt-[3px] text-graphite">{String(n + 1).padStart(2, "0")}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Inline({ items }: { items: string[] }) {
  return (
    <p className="t-mono flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-ink">
      {items.map((t, n) => (
        <span key={t}>
          {t}
          {n < items.length - 1 && <span className="ml-2 text-graphite">·</span>}
        </span>
      ))}
    </p>
  );
}

function ExtLink({ href, label }: { href: string | null; label: string }) {
  if (!href)
    return (
      <span className="hatch border border-ink/25 px-3 py-2 text-graphite">
        <span className="bg-paper px-1">{label} — à venir</span>
      </span>
    );
  return (
    <a data-ui href={href} target="_blank" rel="noreferrer" className="border border-ink/70 px-3 py-2 text-ink hover:border-red hover:text-red">
      {label} ↗
    </a>
  );
}
