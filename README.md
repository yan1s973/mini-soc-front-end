# Portfolio de Yanis

Deux expériences dans ce dépôt :

- **`/` — NOYAU** (principale) : un galet de verre et un noyau de métal liquide
  dans un studio noir & blanc. Le scroll change l'état de la matière (repos,
  cristal, coque, archipel, fonte) et fait basculer le studio du blanc au noir.
  Le mot imprimé sur le mur ne se lit qu'à travers le verre. Fiches : `/projets/<slug>`.
  Textes : [`content/noyau.ts`](content/noyau.ts). Storyboard : [`lib/noyau.ts`](lib/noyau.ts).
- **`/releve` — RELEVÉ** : la première direction (territoire en courbes de
  niveau). Direction de création : [`docs/DIRECTION.md`](docs/DIRECTION.md).

Les deux partagent le même contenu (`content/projects.ts`, `content/profile.ts`).

### Remplir le portfolio NOYAU

| Partie | Fichier | Ce qu'on y met |
|---|---|---|
| 01 Profil | `content/profile.ts`, `content/noyau.ts` | bio, localisation, contacts ; texte du manifeste |
| 02 Projets | `content/projects.ts` | `featured: true` (4 max) ; `thumbnail: "/projets/xxx.jpg"` (image dans `public/projets/`) |
| 03 Certifications | `content/certifications.ts` | nom, organisme, date, lien ; `image: "/certifications/xxx.png"` → devient la face de la carte 3D |
| 04 Expériences | `content/experiences.ts` | période, poste, entreprise, lieu, description, points |
| 05 Autres | `content/extras.ts` | chiffres vérifiables (compteurs animés) et listes |

Tout champ `null` s'affiche comme placeholder : rien n'est inventé.
`?hq` fige la pleine résolution (captures).

## Lancer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production (toutes les fiches en SSG)
```

`/?static` force le repli sans WebGL (carte en courbes de niveau, canvas 2D).
En développement, `/?scene=2.5` fige l'index de scène (inspection d'une transition).

## Ajouter un projet

Tout se passe dans [`content/projects.ts`](content/projects.ts). Remplacez un
placeholder (ou ajoutez un objet), renseignez les champs connus, passez
`status` à `"published"`. **Ne remplissez jamais un champ par supposition** :
un champ `null` s'affiche volontairement comme une zone hachurée « non relevé ».

Le champ `diagram` décrit le schéma d'architecture : des nœuds posés sur une
grille (`x` 0-12, `y` 0-8, `kind` : `service` | `store` | `external` | `edge`) et
des liens (`async: true` pour un flux asynchrone). Il est rendu au trait, dans le
style de la carte, et se dessine à l'ouverture de la fiche.

La borne apparaît sur le terrain du bon chapitre, la fiche `/releves/<slug>`
est générée statiquement. Profil et contacts : [`content/profile.ts`](content/profile.ts).
Textes des chapitres : [`content/disciplines.ts`](content/disciplines.ts).

## Où est quoi

| Fichier | Rôle |
|---|---|
| `lib/field.ts` | Le champ de hauteur — GLSL **et** son miroir TS (à garder identiques) |
| `lib/scenes.ts` | Le storyboard en données : caméra, morphoses, coupe, eau, mercure |
| `components/shaders/` | Terrain (isolignes, loupe, sondage, mercure), coupe géologique, eau, table |
| `components/experience/Director.tsx` | La seule boucle : scroll → scène, caméra, loupe, bornes, cotes |
| `components/ui/` | Couches DOM : parcours, fiche, navigation stratigraphique, loader |

## Accessibilité & performance

- Tout le contenu est en HTML ; le canvas est décoratif (`aria-hidden`).
- `prefers-reduced-motion` : pas de travelling, pas d'onde, pas de défilement amorti.
- Paliers matériel (maillage 160² → 320², octaves, DPR) + DPR adaptatif à ~60 fps.
- Aucune texture ni modèle téléchargé ; une seule passe de rendu.
