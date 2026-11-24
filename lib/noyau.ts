/**
 * NOYAU — storyboard et état partagé DOM ↔ moteur.
 * Le scroll produit un index de scène continu ; le moteur interpole ces
 * états (forme du noyau, inversion noir/blanc, cadrage, mot réfracté).
 */

/** mots imprimés sur le mur du studio, révélés à travers le verre */
export const WORDS = ["YANIS", "SOFTWARE", "SECURITY", "CLOUD", "EXPERIMENTS"] as const;

export interface NScene {
  id: string;
  /** 0 repos · 1 cristal · 2 coque · 3 archipel · 4 fonte */
  state: number;
  /** 0 studio blanc · 1 studio noir */
  invert: number;
  /** décalage de l'objet à l'écran (unités de hauteur d'écran) */
  shift: [number, number];
  /** 1 = cadrage nominal, > 1 = plus loin */
  zoom: number;
  word: number;
}

export const NSCENES: NScene[] = [
  { id: "hero", state: 0, invert: 0, shift: [0, 0.04], zoom: 1.14, word: 0 },
  { id: "manifeste", state: 0, invert: 0, shift: [0.42, 0], zoom: 1.25, word: 0 },
  { id: "software", state: 1, invert: 0, shift: [0.38, 0], zoom: 1.05, word: 1 },
  { id: "cyber", state: 2, invert: 1, shift: [-0.38, 0], zoom: 1.05, word: 2 },
  { id: "cloud", state: 3, invert: 0, shift: [0.38, 0], zoom: 1.1, word: 3 },
  { id: "lab", state: 4, invert: 1, shift: [-0.38, 0], zoom: 1.05, word: 4 },
  { id: "about", state: 0, invert: 0, shift: [0.4, 0], zoom: 1.2, word: 0 },
  { id: "contact", state: 0, invert: 1, shift: [0, 0.18], zoom: 1.9, word: 0 },
];

export const NSCENE_INDEX = Object.fromEntries(NSCENES.map((s, i) => [s.id, i])) as Record<string, number>;

export const nlive = {
  /** index de scène visé (scroll) */
  target: 0,
  /** vitesse de scroll normalisée (0-1) — agite la matière */
  velocity: 0,
  /** impulsion : clic, survol d'un projet */
  pulse: 0,
  /** fiche projet ouverte : l'objet se range dans un coin */
  focus: null as null | { state: number; invert: number },
  /** inversion affichée (amortie) — lue par le DOM pour ses couleurs */
  invert: 0,
  ready: false,
  /** progression du chargement (0-1) */
  progress: 0,
};
