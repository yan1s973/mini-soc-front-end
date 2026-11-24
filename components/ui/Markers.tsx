"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { RELEVES, codeOf, indexOf, type Releve } from "@/content/projects";
import { SCENE_INDEX } from "@/lib/scenes";
import { live } from "@/lib/store";

/**
 * Bornes géodésiques. Des liens HTML réels (clavier, lecteurs d'écran),
 * positionnés chaque image par le Director sur le relief 3D.
 */
function Marker({ r }: { r: Releve }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const index = indexOf(r);
  const code = codeOf(r);
  const empty = r.status === "placeholder";

  useEffect(() => {
    const el = ref.current!;
    live.markers.set(r.slug, { el, scene: SCENE_INDEX[r.discipline], sceneId: r.discipline, index });
    return () => {
      live.markers.delete(r.slug);
    };
  }, [r.slug, r.discipline, index]);

  return (
    <Link
      ref={ref}
      href={`/releves/${r.slug}`}
      data-slug={r.slug}
      data-ui
      inert
      aria-label={`Relevé ${code}${r.title ? ` — ${r.title}` : " — non relevé"}`}
      className="marker group fixed left-0 top-0 z-10 opacity-0"
      style={{ willChange: "transform, opacity" }}
      scroll={false}
    >
      <span className="absolute -translate-x-1/2 -translate-y-1/2">
        <svg width="18" height="16" viewBox="0 0 18 16" className="block overflow-visible">
          <path
            d="M9 1 L17 15 L1 15 Z"
            fill={empty ? "var(--paper-live)" : "var(--color-ink)"}
            stroke="var(--color-ink)"
            strokeWidth="1"
            strokeDasharray={empty ? "2 2" : undefined}
            className="transition-[stroke,fill] duration-300 group-hover:stroke-[var(--color-red)] group-focus-visible:stroke-[var(--color-red)]"
          />
          <circle cx="9" cy="10.5" r="1.4" fill={empty ? "var(--color-ink)" : "var(--paper-live)"} />
          <circle
            cx="9"
            cy="10"
            r="13"
            fill="none"
            stroke="var(--color-red)"
            strokeWidth="1"
            className="origin-center scale-50 opacity-0 transition-all duration-500 ease-[var(--ease-pen)] [transform-box:fill-box] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
          />
        </svg>
      </span>
      <span className="absolute bottom-[10px] left-0 h-[46px] w-px origin-bottom bg-ink transition-all duration-500 ease-[var(--ease-pen)] group-hover:h-[64px] group-hover:bg-red" />
      <span className="absolute bottom-[56px] left-[6px] whitespace-nowrap bg-[color-mix(in_srgb,var(--paper-live)_78%,transparent)] px-[5px] py-[2px] shadow-[inset_1px_0_0_var(--color-ink)] transition-transform duration-500 ease-[var(--ease-pen)] group-hover:-translate-y-[18px] group-hover:shadow-[inset_1px_0_0_var(--color-red)]">
        <span className="t-mono block text-ink group-hover:text-red">R {code}</span>
        <span className="t-serif block text-[15px] leading-tight text-ink/80">{r.title ?? "non relevé"}</span>
      </span>
    </Link>
  );
}

export function Markers() {
  return (
    <div aria-label="Bornes du terrain" role="navigation">
      {RELEVES.map((r) => (
        <Marker key={r.slug} r={r} />
      ))}
    </div>
  );
}
