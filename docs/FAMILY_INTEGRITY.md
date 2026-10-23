# Familles recomposées : saisie, intégrité et affichage

22 octobre 2026 — PR #5, branche `fix/tree-displays-2026-10-22`.
Cette note décrit le code proposé, pas un déploiement en production.

## Règles de saisie

Le bouton général d'ajout d'enfant ne choisit plus le premier conjoint.
Le formulaire exige un autre parent explicite, ou l'option inconnu/non renseigné.
Un raccourci sur une union précise présélectionne ce parent et affiche son nom.
Le choix n'est limité ni par le genre ni par l'existence d'un mariage.
La même règle s'applique au rattachement d'un enfant existant.

Les noms des parents sont visibles avant confirmation. Les fratries du panneau
sont classées selon les liens renseignés : mêmes deux parents, un seul parent
commun avec deux parents connus de chaque côté, ou filiation incomplète.
Ce classement ne prétend pas distinguer automatiquement filiation biologique,
adoption et liens sociaux : le modèle actuel ne code pas cette distinction.

## API et transactions

- `POST /api/persons/tree/:treeId/family-member` crée la personne et ses liens
  parent/enfant ou conjoint dans une transaction Prisma/PostgreSQL.
- `POST /api/persons/tree/:treeId/link-child` ajoute les parents sélectionnés
  d'un enfant existant dans une seule transaction. Il ne remplace pas une mère
  existante et refuse une troisième filiation accidentelle via ce formulaire.
- L'ancien endpoint de création de personne reste compatible. Les routes
  relationnelles utilisent aussi le service transactionnel pour les deux sens.
- Un verrou de ligne sur l'arbre sérialise les vérifications et les mutations
  utilisant ce service. Le verrou de quota du propriétaire partage la connexion
  de transaction, pour ne pas bloquer le pool avec des lectures externes.
- Les auto-relations, cycles d'ascendance et personnes d'autres arbres sont
  refusés. Les autorisations existantes restent appliquées aux routes.
- `clientRequestId` est un UUID v4 utilisé comme identifiant de personne pour
  rendre une répétition identique idempotente. Un contenu différent utilisant
  le même identifiant est refusé, sans modifier la première création.
- Les quotas de personnes et de photos sont contrôlés pour la nouvelle création.
  Une copie personnelle de démonstration résout les identifiants des parents
  vers la même copie avant l'écriture ; elle ne modifie pas les parents canoniques.

Le formulaire conserve ses valeurs et affiche une erreur en cas d'échec.
Une réponse de succès n'est affichée qu'après validation de toute la transaction.
L'envoi de la photo vers le stockage objet reste une opération séparée : la
transaction PostgreSQL n'est pas une transaction distribuée avec S3/R2.

## Affichage

Les enfants sont regroupés par l'ensemble exact de leurs parents, pas seulement
par leur père commun. Des couloirs distincts séparent les unions et les barres
de fratrie en vertical/horizontal. Les actions d'une union sont placées sur son
tracé et hors des cartes dans les configurations testées. Les vues radiales
conservent les bonnes filiations et regroupent les fratries dans l'ordre angulaire.
Le cadrage inclut les tracés en dehors des cartes.

Toutes les fratries d'un niveau utilisent un même corridor de référence : une
filiation avec un seul parent connu ne fait plus presque coïncider deux barres.
L'espacement supplémentaire dépend du nombre maximal de familles sur un niveau,
pas du total cumulé sur toutes les générations.

Les coordonnées manuelles valides ne sont pas effacées. Le bouton Réorganiser
applique le nouvel ordre automatique à un arbre dont les positions sont déjà
sauvegardées. Des croisements restent possibles sur des graphes complexes ou
des placements manuels ; aucun algorithme de croisement nul universel n'est promis.

## Vérification reproductible

Le workflow `family-integrity-checks.yml` utilise un PostgreSQL 16 jetable,
les vraies routes Express et Prisma, puis Chromium et le frontend compilé.
Aucun secret, compte, arbre ni base de production n'est utilisé.

```sh
node --test scripts/test-half-siblings.cjs
node --test scripts/test-tree-displays.cjs
npm test --prefix frontend
node --test scripts/test-family-integrity.cjs
npm run build --prefix frontend
npx playwright test --config=playwright.families.config.ts
```

Les scripts d'intégration refusent de fonctionner sans `FAMILY_TEST_DATABASE_URL`
pointant explicitement sur `localhost/family_test` ou `127.0.0.1/family_test`.
Voir le workflow pour la préparation de cette base jetable.

La suite ajoute 163 tests de géométrie/classification, 11 tests API/base et
12 scénarios navigateur. Les 16 cas supplémentaires combinent un parent inconnu
avec 2, 3, 6 ou 12 unions, en vertical/horizontal, par le père ou par la mère.
Ces nombres décrivent les suites, pas une affirmation qu'une exécution en cours
a déjà réussi. Consulter les résultats du dernier commit de la PR ; les 65 tests
géométriques, 46 assertions historiques et 60 scénarios d'affichage existants
restent exécutés séparément.

## Avant promotion

Déployer le backend et le frontend ensemble : le nouveau formulaire utilise
les nouveaux endpoints. Aucune migration du schéma n'est requise.
Valider sur staging les photos réelles, les copies de démonstration, les
familles représentatives et les gestes sur Safari/mobile physique.
Les chemins d'import GEDCOM/collage de sous-arbre ne sont pas refondus ici.

Les filiations historiques potentiellement fausses ne sont jamais devinées ni
réécrites automatiquement. Une mère mal saisie auparavant doit être vérifiée,
puis son lien corrigé explicitement depuis la fiche de l'enfant. La correction
ne permet pas de reconstituer une information absente de la base.
