import type { DisciplineId } from "./disciplines";

/**
 * Registre des relevés (projets).
 *
 * RÈGLE : ne jamais inventer. Tout champ inconnu reste `null` — il s'affiche
 * comme une zone hachurée « non relevé ». Pour publier un projet, remplacez
 * un placeholder (ou ajoutez un objet) et passez `status` à "published".
 * La borne apparaît automatiquement sur le terrain du chapitre, la fiche
 * `/releves/[slug]` est générée statiquement.
 */
/**
 * Schéma d'architecture. Grille : x 0-12, y 0-8 (centre des nœuds).
 * kind : "service" (défaut), "store" (base, file, bucket), "external"
 * (tiers, hors périmètre), "edge" (point d'entrée : passerelle, CDN…).
 */
export interface Diagram {
  nodes: { id: string; label: string; x: number; y: number; kind?: "service" | "store" | "external" | "edge" }[];
  edges: { from: string; to: string; label?: string; async?: boolean }[];
}

export interface Releve {
  slug: string;
  discipline: DisciplineId;
  status: "placeholder" | "published";
  title: string | null;
  /** une phrase — apparaît sur la borne et dans le registre */
  summary: string | null;
  year: string | null;
  role: string | null;

  problem: string | null;
  concept: string | null;
  solution: string | null;
  /** description textuelle ; un schéma pourra être ajouté plus tard */
  architecture: string | null;
  diagram: Diagram | null;
  stack: string[] | null;
  decisions: string[] | null;
  challenges: string[] | null;
  results: string[] | null;
  limitations: string[] | null;
  links: { github: string | null; demo: string | null };
}

const empty = (slug: string, discipline: DisciplineId): Releve => ({
  slug,
  discipline,
  status: "placeholder",
  title: null,
  summary: null,
  year: null,
  role: null,
  problem: null,
  concept: null,
  solution: null,
  architecture: null,
  diagram: null,
  stack: null,
  decisions: null,
  challenges: null,
  results: null,
  limitations: null,
  links: { github: null, demo: null },
});

export const RELEVES: Releve[] = [
  empty("software-01", "software"),
  empty("software-02", "software"),
  empty("software-03", "software"),
  empty("cyber-01", "cyber"),
  empty("cyber-02", "cyber"),
  empty("cyber-03", "cyber"),
  empty("cloud-01", "cloud"),
  empty("cloud-02", "cloud"),
  empty("cloud-03", "cloud"),
  empty("lab-01", "lab"),
  empty("lab-02", "lab"),
];

export function relevesOf(d: DisciplineId) {
  return RELEVES.filter((r) => r.discipline === d);
}

export function releveBySlug(slug: string) {
  return RELEVES.find((r) => r.slug === slug) ?? null;
}

/** numéro de relevé : « 02.3 » */
export function codeOf(r: Releve) {
  const order: DisciplineId[] = ["software", "cyber", "cloud", "lab"];
  return `0${order.indexOf(r.discipline) + 1}.${indexOf(r) + 1}`;
}

/** rang dans le chapitre — par slug : les objets traversent la frontière serveur/client */
export function indexOf(r: Releve) {
  return relevesOf(r.discipline).findIndex((x) => x.slug === r.slug);
}
