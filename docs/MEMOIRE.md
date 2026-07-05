# Mémoire projet — GeneaIA

> Source de vérité partagée entre toutes les IA et développeurs.
> À lire en début de session, à mettre à jour en fin de tâche (voir [AGENTS.md](../AGENTS.md)).

Dernière mise à jour : **2026-07-05**

---

## 1. Vue d'ensemble

**GeneaIA** est une application de généalogie : création d'arbres familiaux, fiches personnes (photos, documents), collaboration, plans payants (Paystack/CinetPay, marché Côte d'Ivoire).

| Couche | Techno |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind, shadcn/ui, Zustand |
| Backend | Express + Prisma (PostgreSQL), JWT, OTP par téléphone |
| Stockage objet | MinIO (local) / Cloudflare R2 (VPS) via `@aws-sdk/client-s3` |
| Infra | Docker Compose ; VPS Contabo (Traefik + Let's Encrypt) géré par l'agent Souley |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) → images GHCR → deploy SSH |

**Domaine production : `geneamap.com`** (DNS → VPS Contabo `178.238.229.159`).

## 2. Environnements

| Env | Branche | Où | Stockage | URLs |
|---|---|---|---|---|
| Local | `dev` | Docker local | MinIO | front `:5174`, API `:3002` |
| Staging | `staging` | VPS Contabo | R2 `geneamap-staging` | `staging.geneamap.com` / `api-staging.geneamap.com` |
| Production | `main` | VPS Contabo | R2 `geneamap-prod` | `geneamap.com` / `api.geneamap.com` |

Flux Git : `dev` → merge dans `staging` (tests) → merge dans `main` (prod). Push sur `staging`/`main` déclenche build + déploiement automatique.

## 3. Fonctionnalités livrées (état au 2026-07-05)

### Authentification et comptes
- Connexion par **téléphone (identifiant principal) + mot de passe** ou **OTP par code** ; email optionnel.
- Rôles USER/ADMIN, plans SOLO/FAMILY/PATRIMONY avec expiration.
- Billing Paystack (+ fallback CinetPay), codes promo, page admin.

### Arbre généalogique
- Canvas interactif : drag des cartes, zoom, layouts vertical/horizontal/radial, densité, styles de connexions.
- **Édition inline dans le panneau latéral** (plus de dialogue modal) : prénom, nom, dates, lieu, genre, biographie ; bouton Enregistrer.
- Dates de naissance futures bloquées (frontend `max` + validation backend express-validator).
- Photos et documents par personne (upload via proxy API authentifié `/api/uploads/file/...` ; composant `AuthenticatedImage` pour le JWT).
- Bouton **Réorganiser** : recalcul du layout avec confirmation si positions manuelles ; layout spécial « clusters conjugaux » pour les arbres sans liens parent-enfant (`computeSpouseOnlyLayout`).
- Partage : visibilité PRIVATE/SHARED/PUBLIC, invitations collaborateurs (VIEWER/EDITOR), lien public lecture seule.
- Arbre démo public « Famille Dupont » (10 personnes), réinitialisable par l'admin.

### Corrections récentes notables
- Fix accumulation de listeners `pointerup` dans `person-card.tsx` (clics bloqués après drag).
- SVG des liaisons dimensionné dynamiquement (`computeConnectionBounds`) — plus de liaisons coupées.
- Layout page plein écran (`h-svh`, `min-h-0`) sans débordement.

## 4. Données de test (seed)

`npm run db:seed` crée :

| Téléphone | Compte | Contenu |
|---|---|---|
| 0700000001 | test@example.com | Arbre « Ma Famille » (1 personne racine) |
| 0700000002 | demo@geneaia.app | Arbre démo Famille Dupont (10 pers.) |
| 0700000003 | famille40@geneaia.app | **Famille Traoré : 40 personnes, 5 générations** (`backend/src/lib/largeFamilyTree.js`) |
| 0700000004 | testeur@geneaia.app | Compte paiement (plan inactif) |
| 0700000010 | admin@geneaia.app | Admin |

Mot de passe universel : `password123`.

## 5. Décisions d'architecture

- **Stockage** : `STORAGE_USE_PROXY=true` partout — les fichiers sont servis par l'API (contrôle d'accès JWT), jamais en direct depuis le bucket. Migration MinIO → R2 = uniquement des variables d'env (`S3_ENDPOINT`, `S3_REGION=auto`, `STORAGE_AUTO_INIT=false`).
- **`STORAGE_AUTO_INIT`** : `true` en local (MinIO crée le bucket + policy), `false` sur R2 (bucket créé manuellement dans le dashboard Cloudflare).
- **VPS** : pas de nginx dédié ni MinIO sur le VPS — Traefik route `geneamap.com` (labels Docker), R2 pour le stockage.
- **CI** : le compose déployé est **celui du repo** (`docker-compose.staging.yml` / `docker-compose.prod.yml` copiés par scp), plus de compose inline dans le workflow.

## 6. Tests

| Commande | Contenu |
|---|---|
| `npm run test:frontend` | Layout engine (12 tests, dont multi-conjoints) |
| `npm run test:backend` | Jest backend |
| `npm run test:e2e` | Playwright : admin, boutons, collaboration, édition personne |
| `bash scripts/test-storage.sh` | Smoke test stockage (upload + lecture proxy) |
| `bash scripts/check-r2.sh` | Vérification credentials Cloudflare R2 |

E2E adaptés à l'édition inline : testids `edit-first-name`, `save-person-btn`.

## 7. À faire / prochaines étapes

- [x] Buckets R2 `geneamap-staging` et `geneamap-prod` créés et validés (lecture/écriture OK, credentials gérés par Paul dans `~/.config/paul/.env`).
- [x] Secrets GitHub configurés (environnements `staging`/`production`, clé SSH dédiée `~/.ssh/deploy-keys/geneaia_deploy`).
- [x] DNS geneamap.com : A `@`, `www`, `api`, `staging`, `api-staging` → `178.238.229.159` (attention : proxy Cloudflare orange actif, fonctionne mais recommandé de passer en DNS only).
- [x] Déploiement staging opérationnel : https://staging.geneamap.com + https://api-staging.geneamap.com (R2 ready).
- [ ] **Déploiement prod bloqué** : l'ancienne app `/root/genea` (conteneurs `genea-*`) route déjà `geneamap.com` dans Traefik — la stopper avant de pousser `main` (1 seul user dans son ancienne base `geneaia_production`).
- [ ] Renseigner SMTP et Paystack dans les `.env` du VPS (`/root/geneaia/.env`, `/root/geneaia-staging/.env`) — champs vides actuellement.
- [ ] Choisir le fournisseur SMTP/SMS de production pour l'OTP (actuellement Mailpit en local).
- [ ] Protection de branche `main` sur GitHub (PR obligatoire).

## 8. Journal

- **2026-07-05 (soir)** — **Staging déployé sur geneamap.com** : `.env` créés sur le VPS (`/root/geneaia{,-staging}`), secrets GitHub via API (les anciens secrets d'environnement `staging`/`production` de juin 2025 écrasaient les secrets repo — corrigé), pipeline vert. Incidents CI corrigés : TS `AuthenticatedImage` (Omit src), 5 erreurs ESLint, Node 18→22 (Tailwind v4 oxide), actions appleboy remplacées par ssh/scp natifs (auth qui échouait silencieusement), healthcheck frontend `localhost`→`127.0.0.1` (IPv6). R2 : le token utilisé était le token DNS filtré par IP → 403 depuis le VPS ; nouveau token `geneamap-r2-vps` (R2 Storage Read+Write, sans filtre IP) créé, credentials dans `~/.config/paul/.env` (`PAUL_CLOUDFLARE_R2_VPS_*`) et dans les `.env` du VPS.
- **2026-07-05** — R2 opérationnel : buckets `geneamap-staging` et `geneamap-prod` créés via l'API S3 avec les credentials de Paul (`~/.config/paul/.env`), check-r2.sh vert sur les deux. Account ID Cloudflare : `eeea3b33d3e36656a9adaecbf6990424`.
- **2026-07-05** — Préparation lancement : mémoire projet, compat R2 (`STORAGE_AUTO_INIT`), compose VPS Traefik (geneamap.com), branches dev/staging/main, CI aligné (compose du repo via scp), guide Cloudflare R2, docs déploiement à jour.
- **2026-07-05** — Édition inline panneau latéral, blocage dates naissance futures (front + back), compte test famille 40 personnes (Famille Traoré, 5 générations), seed 0700000003.
- **2026-07-05** — Amélioration « Réorganiser » : layout multi-conjoints (`computeSpouseOnlyLayout`), confirmation avant écrasement des positions manuelles, tooltip, 12 tests layout.
- **2026-07-05** — Fixes édition fiche/photo : `AuthenticatedImage` (JWT), listeners pointerup, SVG liaisons dynamique, layout plein écran. Tests E2E `person-edit.spec.ts` et `buttons.spec.ts`.
- **Avant** — Billing Côte d'Ivoire (Paystack + CinetPay + promos), OTP téléphone, migration phone-primary/email-optionnel, arbre démo, collaboration, admin.
