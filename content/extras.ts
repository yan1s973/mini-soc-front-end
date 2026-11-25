/**
 * Autres informations : open source, collaborations, recherche,
 * compétitions… Texte et chiffres. Un chiffre `null` s'affiche « — ».
 * Ne mettre que des chiffres vérifiables.
 */
export interface Extra {
  title: string;
  figure: { value: number | null; suffix?: string; label: string } | null;
  items: string[] | null;
}

export const EXTRAS: Extra[] = [
  { title: "Open source", figure: { value: null, label: "contributions" }, items: null },
  { title: "Collaborations", figure: null, items: null },
  { title: "Recherche", figure: null, items: null },
  { title: "Compétitions", figure: { value: null, label: "participations" }, items: null },
];
