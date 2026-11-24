import type { Weights } from "./field";

/**
 * Storyboard sous forme de données. L'index de scène continu `s` interpole
 * entre ces états : caméra (orbite sphérique autour de `look`), poids du
 * terrain, plan de coupe, eau, mercure.
 */
export interface SceneState {
  id: string;
  /** caméra : rayon, azimut (rad, 0 = face +z), élévation (rad) */
  orbit: [r: number, az: number, el: number];
  look: [number, number, number];
  /** décalage du cadre (fraction d'écran) — laisse la place au texte */
  shift: [x: number, y: number];
  weights: Weights;
  cut: number; // position x du plan de coupe (1 = pas de coupe)
  water: number;
  liquid: number;
  lensLift: number;
  /** teinte du papier : 0 = vélin, 1 = vélin ombré */
  dusk: number;
}

const D = Math.PI / 180;

export const SCENES: SceneState[] = [
  {
    id: "hero",
    orbit: [5.9, 0 * D, 38 * D],
    look: [0, -0.1, 0.02],
    shift: [0, 0.02],
    weights: [1, 1, 0, 0, 0, 0],
    cut: 1.001,
    water: 0,
    liquid: 0,
    lensLift: 0.035,
    dusk: 0,
  },
  {
    id: "coupe",
    orbit: [4.7, 66 * D, 10 * D],
    look: [0.2, -0.18, 0],
    shift: [-0.13, 0],
    weights: [1, 1, 0, 0, 0, 0],
    cut: 0.3,
    water: 0,
    liquid: 0,
    lensLift: 0.02,
    dusk: 0.15,
  },
  {
    id: "software",
    orbit: [5.6, -36 * D, 33 * D],
    look: [0, -0.06, 0],
    shift: [-0.15, 0],
    weights: [0.15, 0, 1, 0, 0, 0],
    cut: 1.001,
    water: 0,
    liquid: 0,
    lensLift: 0.03,
    dusk: 0,
  },
  {
    id: "cyber",
    orbit: [5.3, 22 * D, 50 * D],
    look: [0, -0.06, 0],
    shift: [-0.15, 0],
    weights: [0, 0, 0, 1, 0, 0],
    cut: 1.001,
    water: 0,
    liquid: 0,
    lensLift: 0.025,
    dusk: 0.35,
  },
  {
    id: "cloud",
    orbit: [5.0, 44 * D, 37 * D],
    look: [0, -0.06, 0],
    shift: [-0.15, 0],
    weights: [0, 0, 0, 0, 1, 0],
    cut: 1.001,
    water: 1,
    liquid: 0,
    lensLift: 0.03,
    dusk: 0.1,
  },
  {
    id: "lab",
    orbit: [4.9, -14 * D, 24 * D],
    look: [0, -0.04, 0],
    shift: [-0.15, 0],
    weights: [0, 0, 0, 0, 0, 1],
    cut: 1.001,
    water: 0,
    liquid: 1,
    lensLift: 0.14,
    dusk: 0.55,
  },
  {
    id: "about",
    orbit: [5.4, 0 * D, 86 * D],
    look: [0, 0, 0.02],
    shift: [-0.17, 0],
    weights: [1, 1, 0, 0, 0, 0],
    cut: 1.001,
    water: 0,
    liquid: 0,
    lensLift: 0.03,
    dusk: 0,
  },
];

export const SCENE_INDEX: Record<string, number> = Object.fromEntries(SCENES.map((s, i) => [s.id, i]));
