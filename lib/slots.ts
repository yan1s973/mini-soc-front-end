import { ISLANDS } from "./field";

/**
 * Emplacements des bornes géodésiques par chapitre, en coordonnées p.
 * Chaque paysage place ses relevés selon sa logique propre.
 */
const TERRACES: [number, number][] = [
  [-0.52, -0.38], [0.18, -0.52], [0.56, 0.02], [-0.22, 0.3], [0.42, 0.56], [-0.66, 0.62],
];

// sur le rempart de la caldeira, puis le noyau
const RAMPART = (i: number): [number, number] => {
  const a = -2.2 + i * 1.15;
  return [Math.cos(a) * 0.58, (Math.sin(a) * 0.58) / 1.15];
};

export function slotPosition(scene: string, i: number, time: number): [number, number] {
  switch (scene) {
    case "software":
      return TERRACES[i % TERRACES.length];
    case "cyber":
      return RAMPART(i);
    case "cloud": {
      const isl = ISLANDS[[3, 1, 4, 0, 2, 5][i % ISLANDS.length]];
      return [isl[0], isl[1]];
    }
    case "lab": {
      // les expériences flottent avec les masses de mercure
      const t = time * 0.35;
      return [0.55 * Math.sin(t * (0.7 + 0.13 * i) + i * 1.7), 0.55 * Math.cos(t * (0.5 + 0.11 * i) + i * 2.3)];
    }
    default:
      return [0, 0];
  }
}
