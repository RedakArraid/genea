# Audit et corrections des affichages d'arbres

Date : 22 octobre 2026. Branche : `fix/tree-displays-2026-10-22`, issue de `dev` (`ffe91e4`). Aucun changement de production, de base de données, de secrets ou de dépendances. Cette branche est indépendante de la PR backend #4.

## Périmètre

Revue du moteur de placement et de normalisation, des connexions SVG, des cartes, du canvas, du chargement/sauvegarde des positions, des aperçus marketing et de l'accès aux exports. Les vues verticales, horizontales et radiales sont couvertes pour GENEALOGY et ORGANIZATION, avec cartes carrées, rondes, horizontales et minimales, et densités compacte/espacée.

Il s'agit d'une correction substantielle du frontend, pas seulement de CSS. Une revue en staging avec des arbres représentatifs reste nécessaire avant fusion vers production.

## Incohérences corrigées

| Constat dans les sources initiales | Correction |
|---|---|
| Dimensions divergentes entre carte affichée, placement, connecteurs et cadrage | Module commun `frontend/src/lib/tree-geometry.ts`, utilisé par les cartes, le canvas, les aperçus et la page |
| Le style horizontal n'avait pas de rendu distinct ; conteneur rond trop petit pour les métadonnées | Quatre rendus cohérents et dimensions propres à chaque style |
| Les cartes organisation avec poste long pouvaient chevaucher les rangées et les liaisons | Hauteurs dépendant du texte et réparation des intersections réelles après modification |
| Vue horizontale : bus de fratrie incomplet | Tronc, bus et branches couvrant tous les enfants, indépendamment de leur ordre |
| Les choix de lignes droites/courbes étaient ignorés pour certaines fratries | Style appliqué à chaque connexion |
| Conjoints éloignés manuellement : liaison supprimée par un seuil de distance | Le lien n'est plus supprimé à cause de la distance |
| Vues radiales utilisant une géométrie fixe inadaptée aux organigrammes | Rayons calculés selon le nombre de cartes et leur diagonale, avec séparation entre anneaux |
| Parent absent ou relations dupliquées : branches manquantes | Fusion des relations embarquées et API ; retrait des doublons et autoréférences ; conservation de tous les parents connus |
| Cycles de parenté : risque de boucle de normalisation | Composantes fortement connexes puis calcul des générations sur un graphe acyclique |
| Cadrage limité à certaines générations, zoom minimal empêchant de voir l'ensemble | Cadrage sur tout le graphe visible, sans seuil minimal imposant une coupure |
| Largeur du panneau latéral déduite une seconde fois ; décalage toolbar compté deux fois | Mesure du viewport réel et origine commune pour cartes, SVG, zoom, focus et collage |
| Recherche/génération filtrait les personnes sans filtrer toutes leurs liaisons | Un seul graphe visible partagé par les cartes, connexions, actions et cadrage |
| Libellé `all` brut dans le sélecteur | Options et libellés fournis explicitement au composant Select |
| Positions manuelles considérées comme obsolètes par comparaison à l'auto-layout | Conservation des coordonnées finies non superposées ; ajout/retrait de personnes réconcilié séparément |
| Préférences d'affichage perdues au rechargement | Préférences locales par arbre et recomposition explicite lors d'un changement de vue/style/densité |
| Effets de sauvegarde/recomposition dans un updater React | Effets déclenchés depuis les événements ; sauvegarde temporisée et fin de drag consolidée |
| Annulation du geste assimilée à une sélection ; listeners persistants | Nettoyage des listeners et animation frames, suivi des pointer IDs, annulation distincte du clic |
| PDF organisation masqué avec GEDCOM | Conditions PDF et GEDCOM séparées sur desktop et mobile |
| Aperçus marketing avec géométrie/cadrage divergents | Réutilisation des cartes, hauteurs, connexions et calcul de cadrage communs |

Le placement organisation vertical avec cartes carrées conserve le moteur `org-layout.ts` existant, notamment ses règles Challenge Family/promotion. Les autres orientations/styles utilisent le moteur typé dans `tree-layout.ts`. L'ancien `layout-engine.ts` n'est plus importé par cet adaptateur, mais n'est pas supprimé dans cette correction.

## Vérification reproductible

```bash
npm ci --prefix frontend
npm ci
node --test scripts/test-tree-displays.cjs
npm test --prefix frontend
npm run build --prefix frontend
npx playwright install --with-deps chromium
npx playwright test --config=playwright.displays.config.ts
```

Le workflow `.github/workflows/tree-display-checks.yml` exécute ces étapes avec Node 22. Il ne déploie rien. Les captures PNG sont conservées sept jours dans l'artefact `tree-display-screenshots` ; aucun export du code ou des dépendances n'est effectué par ce workflow.

### Résultat établi sur le premier commit de code

Run GitHub Actions : https://github.com/RedakArraid/genea/actions/runs/39756071690
Commit : `bb32ad18747ec74eb4067fcbe29e6e405fd2fb12`.

- 65 nouveaux tests géométriques réussis, 0 échec.
- 46 tests de layout existants réussis sans modification de leur fichier, 0 échec.
- Build TypeScript/Vite complet réussi.
- 55 scénarios Chromium réussis, 0 échec.
- 13 captures produites et examinées, dont vues familiales/organisations desktop/mobile et thème sombre.

La revue des captures a révélé le libellé `all`. Le correctif suivant relie les options traduites au Select. Le test de thème utilise désormais la véritable clé `geneamap-theme` et vérifie la classe HTML : le premier passage utilisait par erreur la clé `theme`, donc les captures initiales étaient toutes sombres.

La suite enrichie comporte **60 scénarios navigateur** : 48 combinaisons type/vue/style/largeur, les interactions de recherche, export PDF, changement de vue, panneau latéral, thème, drag/sauvegarde/rechargement, un contrôle du filtre traduit et quatre aperçus marketing (accueil/organisation, 375/1440 px). Consulter le dernier run de la PR pour le résultat de cette version enrichie.

### Ce que les tests vérifient réellement

Les tests géométriques exécutent les modules TypeScript réels via transpilation, sans services. Ils vérifient le placement de toutes les personnes, les intersections de cartes, les dimensions du canvas, les connexions, les cycles, les filtres et les transformations coordonnées écran/arbre.

Les tests navigateur utilisent le frontend compilé réel, mais une API interceptée avec des données fictives. Ils vérifient les boîtes visibles sous la toolbar, les débordements, l'absence d'erreurs JavaScript, les actions d'export, les modifications de vue et la conservation de coordonnées après drag/sauvegarde/rechargement simulés. Ils ne prouvent pas le fonctionnement de PostgreSQL, du stockage protégé ou d'un service externe.

## Limites et suivi

- **PDF** : `backend/src/lib/treePdf.js` génère toujours une liste textuelle. Le bouton PDF des organigrammes est rétabli ; un export graphique identique au canvas n'est pas implémenté.
- **Lisibilité au zoom global** : un arbre très large tient désormais entièrement dans la fenêtre, mais ses cartes peuvent être petites. Le zoom et les filtres servent à lire les détails ; faire tenir toutes les cartes ne garantit pas que chaque texte soit lisible simultanément.
- **Graphe complexe** : des liens peuvent encore se croiser avec certaines configurations multi-conjoints ou des positions manuelles. Aucun routage universel évitant tous les obstacles n'est revendiqué.
- **Hauteurs de texte** : estimation commune alignée sur les styles CSS, pas mesure DOM de chaque ligne. Les longs postes des fixtures sont couverts ; des textes extrêmes ou des métriques de police différentes restent à vérifier.
- **Navigateurs** : exécution Chromium ; pas de validation réelle Safari/iOS/Android ni de couverture exhaustive des gestes multitouch sur appareil physique.
- **Données réelles** : validation staging à effectuer avec grands arbres, familles recomposées, photos et permissions réelles ; vérifier aussi ajout/import/collage et textes modifiés.
- **Dette hors périmètre** : l'installation npm signale des alertes de sécurité dans les dépendances et Vite un bundle supérieur à 500 kB. Ce travail ne les corrige pas et ne conclut pas sur leur exploitabilité. Les manifests/lockfiles restent inchangés.

## Avant promotion

1. Relire le diff, particulièrement la page et le canvas dont la mise en forme a été condensée.
2. Contrôler le dernier workflow `Tree display checks` de la PR.
3. Tester en staging un arbre privé, un arbre public et un organigramme avec photos ; vérifier les écritures et les autorisations réelles.
4. Préserver le circuit `dev` → `staging` → `main`. Ne pas confondre cette branche avec les corrections backend de la PR #4.
