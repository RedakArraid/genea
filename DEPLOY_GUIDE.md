# Guide de déploiement geneamap — VPS Contabo

Application déployée sur le **VPS Contabo** (`178.238.229.159`, alias SSH `vps-contabo`) derrière **Traefik + Let's Encrypt**, avec le domaine **geneamap.com**. Le stockage fichiers utilise **Cloudflare R2** (voir [docs/CLOUDFLARE_R2.md](docs/CLOUDFLARE_R2.md)).

> Le VPS est géré par l'agent Souley (architecture Traefik, réseaux Docker, apps dans `/root/<projet>/`).

## Environnements et branches

| Env | Branche | Frontend | API | Bucket R2 | Dossier VPS |
|---|---|---|---|---|---|
| Local | `dev` | http://localhost:5173 | http://localhost:3001/api | MinIO local | — |
| Staging | `staging` | https://staging.geneamap.com | https://api-staging.geneamap.com/api | `geneamap-staging` | `/root/geneamap-staging/` |
| Production | `main` | https://geneamap.com | https://api.geneamap.com/api | `geneamap-prod` | `/root/geneamap/` |

Flux : développement sur `dev` → merge dans `staging` (déploiement auto + tests) → merge dans `main` (déploiement prod auto).

## Étape 1 — DNS (registrar de geneamap.com)

Créer les enregistrements **A** vers `178.238.229.159` :

| Nom | Type | Valeur |
|---|---|---|
| `@` (geneamap.com) | A | 178.238.229.159 |
| `www` | A | 178.238.229.159 |
| `api` | A | 178.238.229.159 |
| `staging` | A | 178.238.229.159 |
| `api-staging` | A | 178.238.229.159 |

Traefik obtiendra automatiquement les certificats Let's Encrypt au premier accès.

## Étape 2 — Cloudflare R2

Suivre [docs/CLOUDFLARE_R2.md](docs/CLOUDFLARE_R2.md) :
1. Créer les buckets `geneamap-staging` et `geneamap-prod`.
2. Créer le token API (Object Read & Write).
3. Vérifier avec `bash scripts/check-r2.sh`.

## Étape 3 — Secrets GitHub

**Settings → Secrets and variables → Actions** du repo :

| Secret | Valeur |
|---|---|
| `STAGING_HOST` / `PROD_HOST` | `178.238.229.159` |
| `STAGING_USER` / `PROD_USER` | `root` |
| `STAGING_SSH_KEY` / `PROD_SSH_KEY` | clé privée SSH de déploiement (`~/.ssh/id_ed25519` ou clé dédiée) |
| `STAGING_PATH` | `/root/geneamap-staging` |
| `PROD_PATH` | `/root/geneamap` |

Les secrets applicatifs (DB, JWT, R2, SMTP, Paystack) ne sont **pas** dans GitHub : ils vivent dans le fichier `.env` de chaque dossier sur le VPS (étape 4).

## Étape 4 — Préparer le VPS (avec Souley)

```bash
ssh vps-contabo

# Production
mkdir -p /root/geneamap/backups
cd /root/geneamap
# Créer .env à partir de .env.production.example (PROD_*, R2_*, SMTP_*, PAYSTACK_*)
nano .env

# Staging
mkdir -p /root/geneamap-staging
cd /root/geneamap-staging
# Créer .env avec STAGING_DB_PASSWORD, STAGING_JWT_SECRET, R2_*, SMTP_*
nano .env
```

Vérifier que le réseau `traefik_network` existe : `docker network ls | grep traefik_network`.

## Étape 5 — Déployer

```bash
# Staging : pousser sur la branche staging
git checkout staging && git merge dev && git push origin staging
# → GitHub Actions : tests → build GHCR → scp compose → docker compose up → migrations → health checks

# Production : après validation staging
git checkout main && git merge staging && git push origin main
```

Suivre l'exécution dans l'onglet **Actions** du repo GitHub.

## Étape 6 — Vérifications post-déploiement

```bash
# API
curl https://api.geneamap.com/api/health
# Stockage R2
curl https://api.geneamap.com/api/uploads/status
# Connexion test (téléphone)
curl -X POST https://api.geneamap.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0700000001","password":"password123"}'
```

Dans le navigateur : https://geneamap.com — créer un compte, créer un arbre, ajouter une personne, uploader une photo (vérifie R2 de bout en bout).

## Stockage fichiers

- **Local** : MinIO (`docker-compose.yml`), bucket auto-créé (`STORAGE_AUTO_INIT=true`).
- **VPS** : Cloudflare R2, bucket pré-créé (`STORAGE_AUTO_INIT=false`), fichiers servis via le proxy API (`STORAGE_USE_PROXY=true` → `https://api.geneamap.com/api/uploads/file/...`).
- Aucun port MinIO n'est ouvert sur le VPS ; il n'y a plus de service MinIO dans les compose staging/prod.

## Protection des branches (GitHub)

**Settings → Branches → Add branch protection rule** :
- `main` : Require a pull request before merging + Require status checks (job **Tests et qualité**).
- `staging` (optionnel) : Require status checks.

## Dépannage

```bash
ssh vps-contabo

# Logs
cd /root/geneamap && docker compose -f docker-compose.prod.yml logs --tail 100
cd /root/geneamap-staging && docker compose -f docker-compose.staging.yml logs --tail 100

# Redémarrer
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Backups base (créés automatiquement avant chaque deploy prod)
ls -lh /root/geneamap/backups/
```

Problèmes fréquents :
1. **`.env` manquant** : le workflow échoue explicitement — créer le fichier (étape 4).
2. **Certificat non émis** : vérifier le DNS et les logs Traefik (`docker logs traefik`).
3. **Stockage KO** : `bash scripts/check-r2.sh` avec les credentials du `.env` ; vérifier que le bucket existe.
4. **502** : conteneur pas sur `traefik_network` ou healthcheck en échec.
