/** Expériences professionnelles — texte uniquement. Champs inconnus : `null`. */
export interface Experience {
  period: string | null; // ex. "2024 — 2025"
  role: string | null;
  company: string | null;
  location: string | null;
  summary: string | null;
  points: string[] | null;
}

const slot = (): Experience => ({ period: null, role: null, company: null, location: null, summary: null, points: null });

export const EXPERIENCES: Experience[] = [slot(), slot(), slot()];
