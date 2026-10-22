# Arbre complet par unions

22 octobre 2026. Correctif propose dans la PR #5, non deploye.

## Lecture

Le parent commun reste une seule carte. Chaque partenaire occupe un couloir
avec ses enfants communs dessous. Les lignes des parents et des enfants se
rejoignent en un point geometrique : aucune carte intermediaire "Union
renseignee" n'est affichee et aucun espace ne lui est reserve.
Une couleur et un fond leger renforcent le regroupement ; la couleur seule
n'est jamais la cle de lecture. Les cartes des personnes ouvrent leurs fiches.
La description accessible de chaque groupe conserve les noms des parents et
des enfants. Une coparentalite n'est pas transformee en mariage.
Les personnes isolees sont hors des couloirs et restent accessibles.

Le modele Relationship ne porte pas de dates de debut/fin d'union. L'ordre est
spatial, non chronologique : aucun libelle premiere/deuxieme epouse ni statut
actuel n'est invente. Les dates de creation en base ne sont pas des dates d'union.

## Positions et navigation

computeUnionOverview produit une projection temporaire verticale/horizontale,
avec raccords de lignes continus. Aucun appel setPositions ni mutation API n'est fait.
Placement libre restitue les positions sauvegardees ; le radial reste un choix
libre explicite. Les organigrammes ne changent pas. Un cycle empechant la
projection renvoie vers le moteur existant, sans perdre de personne.

Sur ecran etroit, l'ouverture conserve une taille lisible. Les boutons des
unions deplacent le meme graphe : les autres unions restent presentes. Vue
d'ensemble cadre tout l'arbre, ce qui reduit necessairement la taille des noms.
Recherche/generation maintiennent le contexte et attenuent les non-correspondances.

Les deplacements manuels se font en Placement libre. La projection complete
n'efface ni ne remplace les coordonnees sauvegardees et respecte les permissions.

## Verification

- node --test scripts/test-union-overview.cjs : 71 cas (2/3/6/12 unions,
  parent commun pere ou mere, deux orientations et quatre styles, multi-generation,
  coparents sans mariage, unions sans enfant, cycle, ordre des donnees).
  Les points terminaux des parents et initiaux des enfants doivent coincider.
  Les anciens emplacements de cartes ne doivent pas laisser un espace vide.
- npx playwright test --config=playwright.unions.config.ts : 17 scenarios
  avec API interceptee, 375/768/1600 px, clair/sombre, navigation sans filtrage,
  parents exacts, sauvegarde manuelle preservee, lecture seule, absence de ligne
  a l'interieur d'une carte, absence de carte d'union et continuite du SVG rendu.
- Les suites anterieures et l'integration API/PostgreSQL restent executees.

Consulter les workflows du dernier commit pour les resultats effectifs. La
presence de tests ne vaut pas execution reussie. Le navigateur local est bloque
par la politique de l'environnement ; la validation visuelle utilise les captures
produites par GitHub Actions, sur des donnees fictives uniquement.

## Limites

Pas de migration ni correction automatique des filiations historiques. Pas de
chronologie d'unions en l'absence des donnees correspondantes. Les familles
avec ancetres communs complexes peuvent garder des croisements ; les chemins
impossibles sont signales. Les tests ne certifient pas tous les graphes importes,
ni Safari/appareils physiques. Une tres grande famille ne peut pas avoir tous
ses noms lisibles simultanement sur un petit ecran ; pan/zoom restent necessaires.
