# RELEVÉ — Direction de création

> *Relevé* : 1. opération d'arpentage qui mesure un territoire. 2. ce qui est en relief.
> 3. état chiffré, compte rendu. Les trois sens sont le site.

---

## 0. Le parti pris

Le concept hybride **n'additionne pas** les quatre pistes de l'étape 1. Il part d'un objet
scientifique réel, rarement vu sur le web : le **bloc-diagramme**, ce morceau de territoire
découpé en volume qu'on trouve dans les atlas de géographie. Son dessus est une carte
(courbes de niveau), ses flancs sont une coupe géologique (strates).

Il absorbe ce qui était fort dans chaque piste, au service d'une seule idée :

| Piste d'origine | Ce qu'on garde | Rôle dans RELEVÉ |
|---|---|---|
| Cadastre | Rendu 100 % au trait (isolignes calculées en shader), papier, encre | **Le langage graphique** de tout le site |
| Strates | Coupe, couches, profondeur, motifs de légende géologique | **La navigation** : la coupe *est* le sommaire |
| Réfraction | Lumière du jour, focale, « voir sous la surface » | **L'interaction centrale** : la loupe d'arpenteur |
| Mercure | Une seule matière qui change d'état | **Le climax** : le terrain fond en métal liquide (04 — Expériences) |

**Une seule géométrie, un seul shader, mille états.** Tout le site est *un* territoire qui
se déforme, se coupe, s'inonde, se fortifie, puis fond. Les transitions ne sont pas des
fondus entre pages : ce sont des **métamorphoses de terrain** calculées sur le GPU.

### Ce que ce n'est pas
- Pas de fond noir. Pas de néon. Pas de dégradé violet. Pas de glassmorphism.
- Pas de cards. Les projets sont des **points géodésiques** posés sur le relief.
- Pas de « hero = titre + sous-titre + 2 boutons ». Le nom YANIS **est le relief** : il
  est sculpté dans le terrain et ne se lit que depuis le bon point de vue.

---

## 1. Direction artistique

### 1.1 Métaphore
Le visiteur est un **arpenteur**. Il arrive devant un territoire inconnu posé sur une
table de travail. Il le lit, le coupe, y descend, mesure chaque point. Le métier
d'ingénieur (construire, protéger, faire circuler) devient un travail de relevé :
**rendre lisible ce qui est sous la surface**. C'est exactement la posture d'un
ingénieur sécurité.

### 1.2 Palette — « table d'arpentage »
Tirée du matériel réel : papier calque vieilli, encre ferro-gallique, crayon rouge de géomètre, lavis hydrographique.

| Rôle | Nom | Valeur |
|---|---|---|
| Fond / papier | Vélin | `#ECE5D5` |
| Papier ombré | Vélin ombre | `#DCD3BF` |
| Trait principal / texte | Encre | `#1C2430` |
| Trait secondaire | Graphite | `#6E6A60` |
| Accent unique (sélection, actif) | Rouge géomètre | `#C2412D` |
| Eau (03 — Cloud) | Lavis | `#557EA0` |
| Strates | Ocre · Argile · Schiste · Oxyde · Socle | `#C9A36A` `#B98A6A` `#7D7B74` `#8E4A32` `#3A3A3C` |

Règle : **le rouge ne sert jamais à décorer.** Il signale ce qui est actif, mesuré, sélectionné.

### 1.3 Typographie
- **Archivo** (variable, axe de chasse 62→125). Capitales **très étendues** et espacées pour
  les toponymes et les titres de chapitre, comme les cartes d'état-major. Version condensée pour les données denses.
- **Instrument Serif** italique pour la voix : phrases d'introduction et hydronymes (l'italique est la convention cartographique de l'eau).
- **IBM Plex Mono** pour les cotes, coordonnées, numéros de relevé et la stack technique.

L'échelle typographique est extrême : du 10 px mono (cotes) au 22 vw (numéro de chapitre en
filigrane). Elle ne passe jamais par le « titre H1 centré ».

### 1.4 Matières (toutes procédurales, zéro texture téléchargée)
1. **Papier** : grain FBM, fibres, très léger vignetage chaud.
2. **Encre** : isolignes à épaisseur constante à l'écran (via `fwidth`). Une courbe maîtresse
   toutes les cinq, plus épaisse. Le trait est légèrement *bavé* par du bruit pour éviter la perfection vectorielle.
3. **Ombrage de relief** (hillshade), lavis gris chaud calculé depuis les normales. C'est ce qui donne le volume cinématographique.
4. **Coupe** : bandes de strates **hachurées selon les vraies conventions de légende géologique**
   (points = sable, tirets = schiste, croix = granite, briques = calcaire…).
5. **Eau** : plan translucide lavis bleu, avec des isobathes en italique.
6. **Mercure** : chrome liquide qui reflète la table d'arpentage. C'est le seul moment où le papier disparaît.

### 1.5 Langage de mouvement
- **Tracé** : rien n'apparaît, tout se *dessine* (lignes qui avancent, textes masqués ligne à ligne).
- **Masse** : caméra amortie, avec inertie de travelling. Rien ne rebondit.
- **Métamorphose** : les changements de scène sont des interpolations de fonction de hauteur
  (le terrain *devient* autre chose), jamais des coupes au noir.
- Easing maison unique : `cubic-bezier(.7,0,.2,1)` (« plume ») pour l'UI, amortissement exponentiel pour la 3D.

---

## 2. L'expérience, de la première seconde à la sortie

**0 s — Le trait.** Écran vélin vide. Un seul trait d'encre traverse l'écran de gauche à droite :
c'est la barre de chargement (progression réelle de la compilation des shaders). En bas, en mono :
`RELEVÉ N°01 — CALAGE DE L'INSTRUMENT`.

**~1,5 s — L'horizon.** Le trait devient l'arête avant du bloc-diagramme. Le territoire
« pousse » de la ligne : les courbes de niveau apparaissent de la plus basse à la plus haute.

**Hero.** Le bloc flotte en trois-quarts, avec ombre portée douce sur la table. Le relief central forme
cinq massifs : **Y A N I S**, lisibles mais déformés par la perspective, comme une anamorphose.
- Le **curseur est une loupe d'arpenteur** : sous elle, le terrain se soulève légèrement, l'équidistance
  des courbes est divisée par 4 (plus de détail) et les **teintes hypsométriques** apparaissent.
  *On voit sous la surface.* C'est la première chose que la main découvre.
- Le bloc s'oriente avec le curseur (parallaxe amortie), assez pour sentir le volume.
- Un **clic** sur le terrain lance un *sondage* : une onde rouge se propage en suivant le relief, comme un balayage réseau.
- Cartouche typographique en bas à gauche (comme sur une carte) : discipline, échelle, coordonnées du curseur en temps réel.
- Indication de défilement : une graduation verticale `0 m` et le mot *descendre*.

**Défilement 1 → La coupe (sommaire).** La caméra tourne vers le flanc. Un plan de coupe
traverse le bloc et révèle **cinq strates hachurées, numérotées 01 à 05**, avec des lignes de rappel vers
leurs intitulés. La coupe *est* le sommaire. Survoler une strate la met en rouge géomètre, cliquer y descend.

**Défilement 2 → 01 Software Engineering — « Les terrasses ».** Le terrain se **quantifie** : il
devient un paysage de terrasses nettes, des couches d'abstraction empilées. Les projets sont des **bornes
géodésiques** (triangle + numéro) posées sur les terrasses.

**Défilement 3 → 02 Cybersecurity — « La caldeira ».** Le relief se referme en anneau : un cratère
fortifié avec un rempart continu. La loupe devient un **scanner** : sous elle, une hachure rouge
révèle une **faille** cachée dans le rempart. C'est une découverte, pas un bouton.

**Défilement 4 → 03 Cloud & Infrastructure — « L'archipel ».** L'eau monte (plan lavis). Le
territoire se divise en **plateaux-îles** reliés par des tracés pointillés : systèmes distribués, régions, liens.

**Défilement 5 → 04 Experiments — « La fonte ».** Climax matériel. L'encre se dilue, le papier
recule et le terrain devient **mercure liquide**. Il reflète la pièce et réagit au curseur avec viscosité. Le seul chapitre sans règle.

**Défilement 6 → 05 About — « Le socle ».** Le métal refroidit et redevient papier. La caméra
monte au zénith : vu du dessus, le relief se lit enfin parfaitement, **YANIS en courbes de niveau**.
L'anamorphose du hero se résout à la fin du parcours : on comprend qu'on a parcouru *le nom*.
Texte de présentation et coordonnées de contact sous forme de cartouche.

**Sortie.** Le bloc s'aplatit en un seul trait, la ligne de la toute première seconde. La boucle est fermée.

### Ouvrir un projet
Clic sur une borne → la caméra plonge vers elle, le terrain se coupe **exactement à travers la borne**,
et une **fiche de relevé** (HTML pur, très lisible) monte comme une feuille posée sur la table. Elle a
une URL propre (`/releves/[slug]`), fonctionne avec le bouton retour et se lit sans WebGL.

Sections de la fiche : Problème · Concept · Solution · Architecture · Stack · Décisions
d'ingénierie · Défis · Résultats · Limites · Liens (GitHub, démo).
**Aucune information inventée** : un champ vide s'affiche comme une zone hachurée
« *non relevé* », visiblement en attente, élégante et sans faux contenu.

---

## 3. Storyboard

| # | Scène | Caméra | État du terrain (`morph`) | Interaction | Transition sortante |
|---|---|---|---|---|---|
| S0 | Calage | fixe, frontale basse | plat (h=0) | — | le trait devient l'arête du bloc |
| S1 | Hero | ¾ haute, parallaxe curseur | `base + YANIS` | loupe, sondage | rotation vers le flanc, plan de coupe |
| S2 | Coupe / sommaire | latérale, face à la coupe | idem + `cut` 1→0,35 | survol/clic strates | la coupe se referme, plongée |
| S3 | 01 Terrasses | ¾ rasante | `terrace` | bornes | quantification → anneau |
| S4 | 02 Caldeira | plongée 60° | `caldera` | loupe-scanner, faille | effondrement des remparts, l'eau monte |
| S5 | 03 Archipel | ¾ haute, large | `archipelago + water` | bornes, liens | l'eau se retire, l'encre se dilue |
| S6 | 04 Fonte | proche, basse | `liquid` (temps) | viscosité curseur | refroidissement |
| S7 | 05 Socle | zénith | `base + YANIS` | — | aplatissement → trait |
| P | Fiche projet | plongée sur la borne | `cut` au droit de la borne | lecture | remontée vers le chapitre |

Le défilement pilote un **index de scène continu** `s ∈ [0, 7]`. Le terrain et la caméra sont des
fonctions de `s`, interpolées entre états voisins. Revenir en arrière rejoue tout à l'envers, sans état caché.

La navigation fixe propose une **colonne stratigraphique miniature** à droite : position actuelle et accès direct
à chaque chapitre (clavier compris). Elle donne aussi une jauge de « profondeur ».

---

## 4. Architecture technique

### 4.1 Stack retenue (et pourquoi)
| Outil | Usage | Justification |
|---|---|---|
| Next.js 16 (App Router) + TS | Routes, SSG des fiches, layout persistant | Le **canvas vit dans le layout** et ne se recrée pas quand on ouvre une fiche, ce qui permet une transition continue |
| React Three Fiber | Boucle de rendu, cycle de vie | Intégration React, sans magie visuelle |
| three.js + **GLSL maison** | Terrain, coupe, eau, mercure | Tout l'aspect visuel est écrit à la main. Aucun effet préfabriqué |
| Lenis | Défilement amorti | Nécessaire pour que la caméra n'ait pas de saccades |
| GSAP | Timelines UI (fiche, révélations de texte) | Précision des séquences DOM |
| Zustand | Pont DOM ↔ 3D sans re-render | Le scroll et le curseur sont écrits hors de React |
| Tailwind CSS 4 | Mise en page des couches DOM | Avec tokens CSS de la palette |
| @fontsource | Polices auto-hébergées | Pas de dépendance réseau, pas de FOUT |

**Écartés volontairement :** drei (seuls des helpers triviaux seraient utiles), postprocessing
(le grain et l'ombrage sont intégrés au shader, donc pas de passe plein écran), modèles GLTF (tout est procédural).

### 4.2 Systèmes 3D
1. **Terrain** : un `PlaneGeometry` (192² à 384² selon le niveau matériel) déplacé dans le
   vertex shader par `height(p, morph)`. Cette fonction est un mélange pondéré des états :
   - `base` : FBM doux, bords tombant vers 0 (masque du bloc) ;
   - `name` : **texture de hauteur générée au runtime** (YANIS dessiné sur un canvas 2D puis flouté
     à plusieurs rayons) → aucun asset ;
   - `terrace`, `caldera`, `archipelago`, `liquid` : fonctions analytiques et bruit.
2. **Flancs / coupe** : bandes verticales dont le bord haut suit `height()` (même chunk GLSL).
   Fragment : strates + hachures de légende. Le flanc +X sert de **plan de coupe mobile** (`uCut`).
3. **Eau** : plan translucide avec isobathes, visible quand `wWater > 0`.
4. **Mercure** : même maillage, branche du fragment shader : normale analytique, réflexion d'un
   environnement procédural (la table, le ciel), fresnel. Pas de cubemap téléchargée.
5. **Loupe** : l'intersection rayon/plan donne le point du curseur sur la table. Le shader reçoit
   `uLens` et y module équidistance, teintes et soulèvement.
6. **Sondage** : onde (`uPulse`, origine + temps), anneau rouge dans le shader.
7. **Bornes** : positions calculées sur CPU avec la **même** fonction de hauteur (port JS), pour
   qu'elles collent au relief. Elles sont rendues en DOM (boutons accessibles) et projetées chaque frame.

### 4.3 Animation
- `useScrollStore` : progression brute (Lenis) → `s` cible. Dans `useFrame`, `s` affiché est amorti
  (`damp`), ainsi que les poids de morph, la caméra et la coupe. Une seule source de vérité.
- Les keyframes caméra/morph sont des données (`scenes.ts`) et non du code dispersé.
- GSAP uniquement côté DOM.

### 4.4 Composants
```
app/
  layout.tsx            polices, <Experience/> persistant, <Navigation/>
  page.tsx              chapitres (DOM : textes, ancres de scroll)
  releves/[slug]/page   fiche de relevé (SSG)
components/
  experience/           Experience (Canvas), Terrain, Flanks, Water, Rig (caméra), Markers
  shaders/              height.glsl.ts, terrain.*, flank.*, water.*
  ui/                   Loader, Navigation (colonne stratigraphique), Chapter, Cartouche, CaseSheet, Placeholder
content/
  disciplines.ts        les 5 chapitres
  projects.ts           relevés typés (placeholders explicites)
lib/
  height.ts             port JS de la fonction de hauteur
  store.ts, scenes.ts, device.ts
```

### 4.5 Performance
- **Paliers matériel** (GPU, mémoire, `hardwareConcurrency`, écran) : résolution du maillage, DPR max
  (1,0 / 1,5 / 2,0), nombre d'octaves du bruit.
- **DPR adaptatif** : on mesure le temps de frame et on baisse le DPR sous 50 fps, par paliers, avec hystérésis.
- Pas de passe post-process, pas de texture externe, une seule texture (128 × 64 px de hauteur pour le nom).
- Rendu suspendu quand l'onglet est caché et ralenti quand la fiche couvre l'écran.
- Shaders compilés derrière le loader (`gl.compile`) pour éviter le saut à la première frame.

### 4.6 Replis
- **Pas de WebGL** : fond papier avec carte de courbes de niveau en SVG/canvas 2D générée à partir de
  la même fonction de hauteur, figée. Tout le contenu reste en DOM.
- **`prefers-reduced-motion`** : aucun travelling. Les changements de scène deviennent des fondus
  courts, il n'y a pas d'onde ni de respiration, et Lenis est désactivé. L'expérience reste complète.
- **Mobile** : maillage réduit, loupe remplacée par le toucher (le doigt *est* la loupe pendant
  qu'il touche), caméra recadrée pour le portrait.

### 4.7 Contenu
Les projets sont des objets typés `Releve`. Tout champ non documenté vaut `null` et s'affiche
« *non relevé* ». Ajouter un projet revient à remplir un objet dans `content/projects.ts` : la borne
apparaît sur le bon chapitre et la fiche est générée statiquement.
