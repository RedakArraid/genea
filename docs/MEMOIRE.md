# Mémoire projet — GeneaIA

> Source de vérité partagée entre toutes les IA et développeurs.
> À lire en début de session, à mettre à jour en fin de tâche (voir [AGENTS.md](../AGENTS.md)).

Dernière mise à jour : **2026-07-05**

---

## 1. Vue d'ensemble

**GeneaIA** est une application de généalogie : création d'arbres familiaux, fiches personnes (photos, documents), collaboration, plans payants internationaux (USD via Paystack, affichage EUR/USD).

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
- Billing **100 % international** : Paystack USD uniquement (carte). Codes promo par marché/campagne via l'admin.
- **Internationalisation fr/en** : i18next (namespaces `common`, `auth`, `marketing`, `tree`, `dashboard`, `billing`, `errors`), sélecteur FR/EN (header marketing, app connectée, profil), champ `User.locale` synchronisé au login.
- **Landing page dynamique** : hero split avec aperçu arbre animé (layout engine + données statiques Famille Dupont), sections marketing (stats, features bento, how-it-works, CTA), scroll-reveal CSS, header sticky avec ancres `#fonctionnalites` / `#prix`.
- **Responsive mobile/tablette** : SidePanel en Sheet overlay (<768px), toolbar canvas compacte (menu ⋮), header marketing hamburger, pages app/admin adaptées, pinch-to-zoom canvas.
- **Téléphone international** : `libphonenumber-js` (back + front), indicatif par défaut +225, sélecteur à l'inscription/connexion/profil.
- Erreurs API avec **codes stables** (`INVALID_PHONE`, `PLAN_LIMIT_REACHED`, …) traduits côté frontend ; templates email OTP fr/en selon `user.locale`.

### Arbre généalogique
- Canvas interactif : drag des cartes, zoom, layouts vertical/horizontal/radial, densité, styles de connexions.
- **Édition inline dans le panneau latéral** (plus de dialogue modal) : prénom, nom, dates, lieu, genre, biographie ; bouton Enregistrer.
- Dates de naissance futures bloquées (frontend `max` + validation backend express-validator).
- Photos et documents par personne (upload via proxy API authentifié `/api/uploads/file/...` ; composant `AuthenticatedImage` pour le JWT).
- Bouton **Réorganiser** : recalcul du layout avec confirmation si positions manuelles ; layout spécial « clusters conjugaux » pour les arbres sans liens parent-enfant (`computeSpouseOnlyLayout`).
- **Lier enfant existant** : menu « Nouvel enfant / Lier existant » pour rattacher une personne déjà dans l'arbre à un parent ou un couple (2 liens parent créés).
- Partage : visibilité PRIVATE/SHARED/PUBLIC, invitations collaborateurs (VIEWER/EDITOR) avec **email d'invitation** (lien `/invite/:token` ou accès direct), lien public lecture seule.
- Arbre démo public « Famille Dupont » (10 personnes), **auto-provisionné** au démarrage API si absent, réinitialisable par l'admin.
- **Admin SMTP** : configuration email depuis `/admin/smtp` (table `SmtpSetting`, prioritaire sur les variables d'env).
- **Admin OpenWA** : configuration WhatsApp OTP depuis `/admin/openwa` (table `OpenWaSetting`) — URL API, clé API, ID session, statut session, test d'envoi. Canal principal OTP WhatsApp, email SMTP en secours.
- Compte admin prod auto-créé au démarrage via `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`ensure-admin.js`).

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
| 0700000010 | admin@geneamap.com | Admin production (`admin123`) |
| 0700000010 | admin@geneaia.app | Admin local seed (`password123`) |

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
- [x] **Production déployée** (2026-07-05 soir) : ancienne app `/root/genea` arrêtée (backup `backups/legacy-genea-*.sql`), nouvelle stack `geneaia-*-prod` sur https://geneamap.com / https://api.geneamap.com (R2 `geneamap-prod` ready).
- [ ] Finaliser Paystack sur le compte marchand (canaux internationaux/USD) — clés test renseignées sur staging (2026-07-05).
- [ ] Déployer le service OpenWA sur le VPS (Docker séparé) et connecter la session WhatsApp prod.
- [ ] Choisir le fournisseur SMTP de production pour l'OTP email (secours ; Mailpit en local).
- [ ] Protection de branche `main` sur GitHub (PR obligatoire).
- [ ] Routes SEO `/fr` `/en` + hreflang (hors périmètre i18n phase 1).

## 8. Journal

- **2026-07-05 (nuit, fix menu ajouter enfant v2)** — Panneau latéral : `modal={false}` sur le dropdown (évite le blocage pointer-events / scroll lock dans le aside scrollable), état `open` contrôlé, callbacks stabilisés (`useCallback`/`useMemo`), z-index positioner `z-[300]`, menu ouvert vers la gauche.
- **2026-07-05 (nuit, fix menu ajouter enfant)** — Fix menu « + Ajouter » (nouvel enfant / lier existant) : extraction `ChildAddMenu`, `RelSection` et `RelChip` hors du render de `SidePanelContent` (évite remontage React qui fermait le dropdown) ; `queueMicrotask` sur les actions menu ; arête mariage canvas wrappée en `absolute` + z-index.
- **2026-07-05 (soir, lier enfant existant)** — Menu « Nouvel enfant / Lier existant » (panneau latéral, icône bébé conjoint, arête mariage) ; dialogue `LinkExistingChildDialog` ; fix direction parent/enfant dans « Lier ».
- **2026-07-05 (soir, OpenWA admin)** — Page admin `/admin/openwa` : table `OpenWaSetting`, API GET/PATCH + statut session + test WhatsApp. OTP : WhatsApp prioritaire (OpenWA), email SMTP secours.
- **2026-07-05 (soir, responsive)** — Refonte responsive complète : SidePanel Sheet mobile, toolbar arbre compacte, menu hamburger marketing, dashboard/timeline/matches touch-friendly, admin tables colonnes adaptatives, pinch-to-zoom canvas, spec E2E viewport 375px. Build frontend vert.
- **2026-07-05 (soir, layout réorganiser)** — Fix « Réorganiser » : parents placés au-dessus de la personne racine (générations top-down, vraies racines sans parents in-tree, directChildren assoupli si un seul parent référencé). 14 tests layout.
- **2026-07-05 (soir, landing)** — Refonte page d'accueil : composants `marketing/*` (hero animé avec `AnimatedTreeHero`, stats strip, features bento, how-it-works, CTA final, footer), hooks `use-reveal` / `use-prefers-reduced-motion`, données statiques `marketing-tree-demo.ts`, ancres header sticky, i18n `marketing.json` étendu fr/en. Build frontend vert.
- **2026-07-05 (soir, billing preview)** — Fix `POST /api/billing/preview` 400 en boucle sur `/pricing` : cause = code promo invalide (ex. `GENEA2026`) renvoyait 400 à chaque frappe × 4 forfaits. Preview renvoie désormais 200 + `promoError` ; frontend affiche les prix localement et n'appelle l'API qu'avec un code promo (debounce 400 ms).
- **2026-07-05 (soir, pricing intl)** — Billing 100 % international : Paystack USD seul, CinetPay retiré ; codes promo par marché (description admin). Tarifs $5 / $30/an / $50/an ou $5/mois.
- **2026-07-05 (soir, i18n)** — **Internationalisation fr/en** : i18next + 7 namespaces, `User.locale` (Prisma + API profil), `lib/format.ts` (dates dynamiques), `translateApiError` + codes backend (auth, person, billing, OTP), templates OTP email fr/en, `PhoneInput` + `libphonenumber-js`, sélecteur langue (marketing, app-shell, profil). Pages publiques et app connectée traduites ; build frontend + tests layout/backend verts.
- **2026-07-05 (soir, prod)** — **Production live sur geneamap.com** : backup ancienne base (`/root/geneaia/backups/legacy-genea-20260705_184808.sql`), arrêt `/root/genea` (genea-*), push `dev`→`main`, pipeline vert, conteneurs `geneaia-*-prod` healthy, API + frontend HTTP 200, R2 `geneamap-prod` ready. Base prod vierge (migrations appliquées, pas de seed — inscription utilisateur requise).
- **2026-07-05 (soir)** — **Staging déployé sur geneamap.com** : `.env` créés sur le VPS (`/root/geneaia{,-staging}`), secrets GitHub via API (les anciens secrets d'environnement `staging`/`production` de juin 2025 écrasaient les secrets repo — corrigé), pipeline vert. Incidents CI corrigés : TS `AuthenticatedImage` (Omit src), 5 erreurs ESLint, Node 18→22 (Tailwind v4 oxide), actions appleboy remplacées par ssh/scp natifs (auth qui échouait silencieusement), healthcheck frontend `localhost`→`127.0.0.1` (IPv6). R2 : le token utilisé était le token DNS filtré par IP → 403 depuis le VPS ; nouveau token `geneamap-r2-vps` (R2 Storage Read+Write, sans filtre IP) créé, credentials dans `~/.config/paul/.env` (`PAUL_CLOUDFLARE_R2_VPS_*`) et dans les `.env` du VPS.
- **2026-07-05** — R2 opérationnel : buckets `geneamap-staging` et `geneamap-prod` créés via l'API S3 avec les credentials de Paul (`~/.config/paul/.env`), check-r2.sh vert sur les deux. Account ID Cloudflare : `eeea3b33d3e36656a9adaecbf6990424`.
- **2026-07-05** — Préparation lancement : mémoire projet, compat R2 (`STORAGE_AUTO_INIT`), compose VPS Traefik (geneamap.com), branches dev/staging/main, CI aligné (compose du repo via scp), guide Cloudflare R2, docs déploiement à jour.
- **2026-07-05** — Édition inline panneau latéral, blocage dates naissance futures (front + back), compte test famille 40 personnes (Famille Traoré, 5 générations), seed 0700000003.
- **2026-07-05** — Amélioration « Réorganiser » : layout multi-conjoints (`computeSpouseOnlyLayout`), confirmation avant écrasement des positions manuelles, tooltip, 12 tests layout.
- **2026-07-05** — Fixes édition fiche/photo : `AuthenticatedImage` (JWT), listeners pointerup, SVG liaisons dynamique, layout plein écran. Tests E2E `person-edit.spec.ts` et `buttons.spec.ts`.
- **Avant** — Billing Côte d'Ivoire (Paystack + CinetPay + promos), OTP téléphone, migration phone-primary/email-optionnel, arbre démo, collaboration, admin.
