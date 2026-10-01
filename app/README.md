# DataOracle — Dashboard

Front-end temps réel de DataOracle : page d'accueil simple, puis le tableau de
bord (prix, prédiction, dérive, réentraînements, versions, activité, AutoML,
anomalies, santé de l'IA, Oracle AI).

```bash
npm install
npm run dev     # développement
npm run build   # build de production dans dist/
```

## Mode démo et branchement au backend

Toutes les données passent par `src/hooks/useOracle.ts`. Aujourd'hui, ce hook
fait tourner `src/data/simulation.ts`, qui reproduit la logique de la
plateforme (seuil dynamique + Page-Hinkley, champion/challenger, versions,
rollback) sur des prix fictifs.

Pour brancher le vrai backend, il suffit de remplacer dans ce hook :

- la boucle `setInterval` par le flux Socket.io du serveur ;
- les actions `shock`, `rollback` et `refresh` par des appels à
  `POST /shock`, `POST /rollback`, `GET /leaderboard` et `GET /models`.

Les composants n'ont pas à changer : ils lisent un `OracleState`
(`src/data/types.ts`).
