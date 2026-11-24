# RELEVÉ — portfolio de Yanis

Un territoire unique, procédural, qu'on lit, coupe, inonde puis fait fondre.
La direction de création complète (concept, storyboard, architecture) est dans
[`docs/DIRECTION.md`](docs/DIRECTION.md).

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
