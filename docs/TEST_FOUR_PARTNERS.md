# Test cible : un pere, quatre compagnes, sept enfants par couple

22 octobre 2026. PR #5, non deployee. Base applicative : f04bf017.

Jeu fictif de 33 personnes, sans enfant supplementaire, parent inconnu ou personne isolee : un pere, quatre compagnes, 28 enfants, 56 filiations et quatre liens conjugaux. Aucun ordre chronologique d'union n'est presume.

`e2e/tree-four-partners.spec.ts` ajoute huit controles geometriques (deux orientations, quatre styles) et dix parcours navigateur : exactitude de chaque paire parentale, six membres dans la fratrie complete et 21 demi-freres/soeurs par enfant, continuite des lignes, non-chevauchement, enfants contenus dans leur cadre, navigation mobile et mode Familles. Captures et metriques du zoom/du nombre de cartes effectivement visibles, pour distinguer integrite des liens et lisibilite visuelle.

Execution : `npx playwright test --config=playwright.unions.config.ts tree-four-partners.spec.ts` apres compilation du frontend avec `VITE_API_URL=http://127.0.0.1:5173/api`. La configuration existante inclut maintenant cette suite, sans desactiver les 17 scenarios precedents.

Toutes les API du navigateur sont interceptees : ce test cible le frontend compile et ses fonctions reelles, pas une nouvelle validation PostgreSQL. Les suites d'integration precedentes restent separees. Aucune donnee de production n'est creee ou modifiee. Aucun code applicatif n'est change par cet ajout.

Consulter les journaux et les captures du commit pour les resultats effectifs. La presence des tests ne signifie pas qu'ils ont reussi ; les metriques de cadrage ne sont pas une approbation automatique de la lisibilite.
