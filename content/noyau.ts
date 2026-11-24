/**
 * Textes du portfolio NOYAU. Ils décrivent des domaines et une posture —
 * aucun résultat, aucun chiffre. À réécrire librement.
 */
export const MANIFESTE =
  "Je conçois des logiciels, je cherche leurs failles, je les déploie. Du code à l'infrastructure, une seule exigence : que ça tienne.";

export const CHAPTERS = [
  {
    id: "software",
    n: "01",
    title: "Software Engineering",
    verb: "Structurer",
    lede: "Des systèmes lisibles avant d'être rapides. Chaque couche a une seule raison d'exister.",
  },
  {
    id: "cyber",
    n: "02",
    title: "Cybersecurity",
    verb: "Protéger",
    lede: "Une coque n'est jamais parfaitement close. Le travail : trouver la faille avant les autres.",
  },
  {
    id: "cloud",
    n: "03",
    title: "Cloud & Infrastructure",
    verb: "Distribuer",
    lede: "Des îles autonomes, un seul système. Concevoir pour que l'ensemble survive à la perte d'une partie.",
  },
  {
    id: "lab",
    n: "04",
    title: "Experiments",
    verb: "Tenter",
    lede: "Le seul endroit sans règle. Prototypes, essais, matière en mouvement.",
  },
] as const;
