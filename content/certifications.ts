/**
 * Certifications. Rien n'est inventé : chaque champ inconnu reste `null`.
 * Pour ajouter une certification, déposez son image dans
 * /public/certifications/ et renseignez `image` (ex. "/certifications/aws.png").
 * Sans image, une carte neutre « à renseigner » est générée.
 */
export interface Certification {
  slug: string;
  name: string | null;
  issuer: string | null;
  /** date d'obtention, texte libre (ex. "2025-03") */
  date: string | null;
  credentialId: string | null;
  /** lien de vérification */
  url: string | null;
  image: string | null;
}

const slot = (n: number): Certification => ({
  slug: `certification-${String(n).padStart(2, "0")}`,
  name: null,
  issuer: null,
  date: null,
  credentialId: null,
  url: null,
  image: null,
});

export const CERTIFICATIONS: Certification[] = [slot(1), slot(2), slot(3), slot(4), slot(5), slot(6)];
