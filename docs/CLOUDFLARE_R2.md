# Cloudflare R2 — configuration du stockage VPS

geneamap utilise MinIO en local et **Cloudflare R2** sur le VPS (staging + production).
Le backend parle S3 via `@aws-sdk/client-s3` — seuls des variables d'environnement changent.

## 1. Créer les buckets (dashboard Cloudflare)

1. Ouvre [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**.
2. Si R2 n'est pas encore activé : **Purchase R2** (le plan gratuit couvre 10 Go + 1M opérations/mois, aucune carte requise pour rester dans le gratuit).
3. **Create bucket** deux fois :
   - `geneamap-staging`
   - `geneamap-prod`
   - Location : **Automatic** (ou EEUR/WEUR pour l'Europe).
4. Ne configure **pas** d'accès public (Public Access = désactivé) : l'application sert les fichiers via son proxy API authentifié (`STORAGE_USE_PROXY=true`).

## 2. Créer le token API R2

1. Dans R2 → **Manage R2 API Tokens** → **Create API Token**.
2. Nom : `geneamap-app`.
3. Permissions : **Object Read & Write**.
4. Specify bucket(s) : sélectionner `geneamap-staging` **et** `geneamap-prod` (pas « all buckets »).
5. TTL : Forever (ou selon ta politique).
6. **Create API Token** puis note immédiatement (affiché une seule fois) :
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint S3** : `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (l'Account ID est visible sur la page R2, à droite).

> Ne jamais committer ces valeurs. Elles vont dans le `.env` du VPS et dans les secrets GitHub.

## 3. Variables d'environnement backend (VPS)

```bash
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<ACCESS_KEY_ID>
S3_SECRET_KEY=<SECRET_ACCESS_KEY>
S3_BUCKET=geneamap-prod            # geneamap-staging en staging
S3_REGION=auto
STORAGE_AUTO_INIT=false            # le bucket existe déjà, pas de CreateBucket
STORAGE_USE_PROXY=true             # fichiers servis par l'API (JWT)
API_PUBLIC_URL=https://api.geneamap.com   # api-staging.geneamap.com en staging
```

`S3_PUBLIC_URL` est inutile avec le proxy actif.

## 4. Vérifier la connexion

Depuis ta machine (ou le VPS), avec les variables exportées :

```bash
export S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
export S3_ACCESS_KEY=...
export S3_SECRET_KEY=...
export S3_BUCKET=geneamap-staging
bash scripts/check-r2.sh
```

Le script teste : accès bucket (HeadBucket), écriture (PutObject), lecture (GetObject), suppression (DeleteObject). Tout doit être vert avant de déployer.

## 5. Secrets GitHub (CI/CD)

À ajouter dans **Settings → Secrets and variables → Actions** du repo :

| Secret | Valeur |
|---|---|
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` | Access Key ID du token |
| `R2_SECRET_KEY` | Secret Access Key du token |

Les noms de buckets (`geneamap-staging` / `geneamap-prod`) sont dans les fichiers compose, pas en secret.

## 6. Optionnel — MCP Cloudflare dans Cursor

Pour gérer R2 depuis le chat Cursor (lister les buckets, objets...), ajoute dans la config MCP de Cursor (`~/.cursor/mcp.json` ou réglages Cursor → MCP) :

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server-cloudflare", "run"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "<TON_TOKEN_API_CLOUDFLARE>",
        "CLOUDFLARE_ACCOUNT_ID": "<TON_ACCOUNT_ID>"
      }
    }
  }
}
```

Le token pour le MCP est un **token API Cloudflare classique** (My Profile → API Tokens) avec la permission `Account.Workers R2 Storage:Edit` — différent du token S3 de l'étape 2. Ce n'est pas requis pour que l'application fonctionne.

## 7. Migration de données MinIO → R2 (si nécessaire)

Si des fichiers existent déjà dans MinIO et doivent être conservés :

```bash
# Avec le client MinIO (mc)
mc alias set local http://localhost:9000 geneamap_minio geneamap_minio_password
mc alias set r2 https://<ACCOUNT_ID>.r2.cloudflarestorage.com <ACCESS_KEY> <SECRET_KEY>
mc mirror local/geneamap r2/geneamap-prod
```

Les URLs en base pointent vers le proxy API (`/api/uploads/file/...`), donc **aucune mise à jour de la base** n'est nécessaire tant que `API_PUBLIC_URL` reste cohérent.
