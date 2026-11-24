/**
 * Profil. Tout champ `null` s'affiche « non relevé ». Rien n'est inventé.
 */
export const PROFILE = {
  name: "Yanis",
  role: "Ingénieur logiciel",
  domains: ["Software Engineering", "Cybersecurity", "Cloud & Infrastructure"],
  /** paragraphe de présentation */
  bio: null as string | null,
  location: null as string | null,
  contact: [
    { label: "Courriel", href: null as string | null, value: null as string | null },
    { label: "GitHub", href: null as string | null, value: null as string | null },
    { label: "LinkedIn", href: null as string | null, value: null as string | null },
    { label: "CV", href: null as string | null, value: null as string | null },
  ],
};
