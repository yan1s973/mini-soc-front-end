import { create } from "zustand";
import type { NameField } from "./field";

/**
 * Pont DOM ↔ 3D. Les valeurs à haute fréquence (scroll, pointeur) sont
 * écrites dans `live` (objet mutable, lu dans useFrame) pour ne jamais
 * provoquer de re-render React.
 */
export const live = {
  /** index de scène visé par le scroll */
  sceneTarget: 0,
  /** index de scène affiché (amorti, écrit par le Rig) */
  scene: 0,
  pointer: { x: 0, y: 0, active: false, lastMove: 0, touch: false },
  /** point du terrain sous le curseur (coords p) */
  lens: { x: 0, z: 0, h: 0 },
  pulse: { x: 0, z: 0, t: -100 },
  /** strate survolée (0-4) ou -1 */
  stratum: -1,
  /** borne ouverte (fiche projet) */
  focus: null as null | { slug: string; scene: number; index: number },
  time: 0,
  /** début de la séquence d'ouverture (temps live), -1 = pas encore */
  introStart: -1,
  /** la fiche a été ouverte depuis le parcours : « retour » = history.back() */
  fromHome: false,
  /** registres DOM écrits par le Director, jamais par React */
  markers: new Map<string, { el: HTMLElement; scene: number; sceneId: string; index: number }>(),
  bands: [] as { line: SVGLineElement | null; label: HTMLElement | null }[],
  hud: { x: null as HTMLElement | null, z: null as HTMLElement | null, alt: null as HTMLElement | null },
};

export function goTo(scene: number) {
  window.dispatchEvent(new CustomEvent("releve:goto", { detail: scene }));
}

export type Tier = "low" | "mid" | "high";

interface UIState {
  ready: boolean;
  webgl: boolean | null;
  tier: Tier;
  reducedMotion: boolean;
  nameField: NameField | null;
  chapter: number;
  stratum: number;
  set: (s: Partial<Omit<UIState, "set">>) => void;
}

export const useUI = create<UIState>((set) => ({
  ready: false,
  webgl: null,
  tier: "mid",
  reducedMotion: false,
  nameField: null,
  chapter: 0,
  stratum: -1,
  set: (s) => set(s),
}));
