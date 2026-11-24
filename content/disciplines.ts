/**
 * Les cinq strates. Les textes d'introduction décrivent un domaine et une
 * posture — ils ne revendiquent aucun résultat. À réécrire librement.
 */
export type DisciplineId = "software" | "cyber" | "cloud" | "lab";

export interface Stratum {
  n: string;
  id: DisciplineId | "about";
  title: string;
  /** toponyme : nom du paysage que prend le terrain */
  landform: string;
  scene: string;
  lede: string;
  /** convention de légende géologique utilisée sur la coupe */
  legend: string;
}

export const STRATA: Stratum[] = [
  {
    n: "01",
    id: "software",
    title: "Software Engineering",
    landform: "Les terrasses",
    scene: "software",
    lede: "Construire par couches : chaque niveau d'abstraction repose sur celui du dessous et doit pouvoir être relu sans lui.",
    legend: "Sables — pointillé",
  },
  {
    n: "02",
    id: "cyber",
    title: "Cybersecurity",
    landform: "La caldeira",
    scene: "cyber",
    lede: "Un rempart n'est jamais continu. Le travail consiste à trouver la faille avant qu'elle ne soit trouvée. Passez la loupe sur le rempart.",
    legend: "Granite — croix",
  },
  {
    n: "03",
    id: "cloud",
    title: "Cloud & Infrastructure",
    landform: "L'archipel",
    scene: "cloud",
    lede: "Des îles autonomes, reliées par des liens qui peuvent tomber. Concevoir pour que l'archipel survive à la perte d'une île.",
    legend: "Schistes — tirets",
  },
  {
    n: "04",
    id: "lab",
    title: "Experiments",
    landform: "La fonte",
    scene: "lab",
    lede: "Le seul niveau sans règle. Ici le terrain n'a pas de forme stable : prototypes, essais, matière en mouvement.",
    legend: "Oxydes — appareillage",
  },
  {
    n: "05",
    id: "about",
    title: "About",
    landform: "Le socle",
    scene: "about",
    lede: "Vu d'en haut, le relief se lit enfin.",
    legend: "Socle — hachures",
  },
];

export const strataById = Object.fromEntries(STRATA.map((s) => [s.id, s])) as Record<Stratum["id"], Stratum>;
