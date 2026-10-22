# Mémoire projet — geneamap

Dernière mise à jour : **22 octobre 2026**. Cette entrée concerne les branches de travail, **pas la production**.

## Règles de travail

- Flux : `dev` → `staging` → `main`. Pas de push direct sur `main`. Les deux dernières branches déclenchent un déploiement ; un push sur la branche de correction n'est pas une promotion.
- Frontend React/TypeScript/Vite ; API Express/Prisma/PostgreSQL. MinIO local et R2 via proxy authentifié. Ports locaux de référence : 5173/3001.
- Réponses en français. Conserver les choix explicites des parents, les permissions et les positions manuelles. Ne jamais deviner une filiation ou une chronologie d'union.
- Lire aussi [AGENTS.md](../AGENTS.md). Les détails produit, exploitation et l'historique intégral sont conservés, sans modification, dans [la mémoire historique](MEMOIRE_HISTORIQUE_2026-10-22.md).

## État des branches

- **PR #4**, `fix/audit-2026-10-22` : autorisations des arêtes, corps brut Paystack, cache privé des médias, commande build backend. Correctifs distincts de la PR #5 ; validation des services réels encore nécessaire avant production.
- **PR #5**, `fix/tree-displays-2026-10-22` : affichages, transactions des filiations, choix de l'autre parent, demi-fratries, projection Par unions. PR ouverte vers `dev`, non fusionnée. Voir les derniers checks GitHub, pas les anciens compteurs du journal.

## Journal du 22 octobre : reprise du cas quatre compagnes / sept enfants

- Jeu exact : un père, quatre compagnes, 28 enfants, soit 33 personnes. Les grandes fratries terminales sont disposées sur deux colonnes de cartes compactes ; elles restent dans la même génération. Les enfants ayant leur propre descendance conservent le placement multigénération.
- Une seule carte pour le parent commun. **Aucune carte intermédiaire Union renseignée**. Sur mobile, changer de branche déplace ce parent dans la projection temporaire, sans duplication ni sauvegarde des coordonnées.
- Reprise après interruption : le placement compact et le test 4×7 avec API/PostgreSQL existaient déjà, mais une barre d'outils plus haute déclenchait un cadrage limité aux parents. `unionReadingView` tente maintenant une marge plus petite avant ce repli ; le seuil de lecture reste 85 % et 60 pixels sont réservés aux commandes inférieures.
- `scripts/test-union-viewport.cjs` reproduit le défaut : deux échecs avant, cinq cas réussis après correction locale. La suite géométrique des unions reste exécutée. Les assertions navigateur existantes ne sont pas assouplies.
- Le workflow temporaire de récupération des sources est supprimé. Aucun changement de secret, schéma, donnée réelle ou déploiement.

## Validation et limites

Voir [COMPACT_SIBLINGS.md](COMPACT_SIBLINGS.md), les tests et les checks du dernier commit de la PR pour les résultats effectivement terminés. Les tests d'affichage utilisent Chromium et une API interceptée ; la suite familiale utilise Express, Prisma et PostgreSQL jetable, y compris le cas 4×7.

La vue verticale est la lecture compacte de référence. Une vue horizontale, un écran moins haut ou un graphe multigénération peuvent toujours nécessiter un déplacement. Vue d'ensemble est une action explicite, pas une garantie que tous les noms soient lisibles sur mobile.

Avant promotion : examiner le diff combiné des PR, vérifier en staging les vraies photos, permissions, imports/collages, Paystack test, Safari et appareils physiques. Les filiations historiques ne sont pas réattribuées automatiquement ; le PDF reste textuel. Les alertes de dépendances et la taille du bundle sont des chantiers distincts.
