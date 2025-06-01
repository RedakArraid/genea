# 🔐 GESTION DES SECRETS CI/CD - GENEAIA

## 📋 Secrets à Configurer dans GitHub

### 🚀 **Secrets de Déploiement**

#### Production
```
PROD_HOST=your-production-server.com
PROD_USER=deploy
PROD_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
PROD_PORT=22
PROD_PATH=/var/www/geneaia
```

#### Staging
```
STAGING_HOST=staging.geneaia.com
STAGING_USER=deploy
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
STAGING_PORT=22
STAGING_PATH=/var/www/geneaia-staging
```

### 🗄️ **Secrets de Base de Données**

#### Production
```
PROD_DB_HOST=your-db-server.com
PROD_DB_USER=geneaia_prod
PROD_DB_PASSWORD=super-secure-password
PROD_DB_NAME=geneaia_production
```

#### Staging
```
STAGING_DB_HOST=staging-db.geneaia.com
STAGING_DB_USER=geneaia_staging
STAGING_DB_PASSWORD=staging-password
STAGING_DB_NAME=geneaia_staging
```

### 🔑 **Secrets d'Application**

#### Production
```
PROD_JWT_SECRET=production-jwt-secret-very-long-and-secure-minimum-32-characters
PROD_API_URL=https://api.geneaia.com
PROD_CORS_ORIGIN=https://geneaia.com
PROD_REDIS_URL=redis://redis.geneaia.com:6379
```

#### Staging
```
STAGING_JWT_SECRET=staging-jwt-secret-different-from-production
STAGING_API_URL=https://api-staging.geneaia.com
STAGING_CORS_ORIGIN=https://staging.geneaia.com
STAGING_REDIS_URL=redis://redis-staging.geneaia.com:6379
```

### 📧 **Secrets Email**

```
SMTP_HOST=smtp.your-provider.com
SMTP_USER=noreply@geneaia.com
SMTP_PASSWORD=smtp-password
```

### 📊 **Secrets Monitoring**

```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

### 🐳 **Secrets Docker Registry**

```
REGISTRY_USERNAME=your-registry-username
REGISTRY_PASSWORD=your-registry-password
```

## 🛠️ **Configuration dans GitHub**

### 1. Aller dans les Settings du Repository
`Repository Settings > Secrets and variables > Actions`

### 2. Ajouter les Environment Secrets

#### Environment: `production`
- Tous les secrets `PROD_*`
- Secrets de monitoring en production

#### Environment: `staging` 
- Tous les secrets `STAGING_*`
- Secrets de test

### 3. Repository Secrets (Communs)
- `SMTP_*` - Configuration email
- `REGISTRY_*` - Authentification Docker
- `SLACK_WEBHOOK_URL` - Notifications

## 🔄 **Rotation des Secrets**

### Checklist de Rotation (Tous les 90 jours)
- [ ] JWT_SECRET (Production et Staging)
- [ ] Database passwords
- [ ] SSH Keys
- [ ] API Keys externes
- [ ] SMTP passwords

### Script de Rotation
```bash
# Générer un nouveau JWT secret
openssl rand -base64 32

# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "deploy@geneaia.com"

# Générer un mot de passe sécurisé
openssl rand -base64 24
```

## ⚠️ **Sécurité**

### ❌ Ne JAMAIS commiter
- Mots de passe en clair
- Clés privées SSH
- JWT secrets
- Tokens d'API
- Chaînes de connexion complètes

### ✅ Bonnes Pratiques
- Utiliser des secrets différents par environnement
- Rotation régulière des secrets
- Principe du moindre privilège
- Audit régulier des accès
- Chiffrement des secrets au repos

## 🔍 **Validation des Secrets**

### Script de Validation
```bash
#!/bin/bash
# Vérifier que tous les secrets requis sont définis

required_secrets=(
    "PROD_HOST"
    "PROD_USER" 
    "PROD_SSH_KEY"
    "PROD_DB_PASSWORD"
    "PROD_JWT_SECRET"
)

for secret in "${required_secrets[@]}"; do
    if [ -z "${!secret}" ]; then
        echo "❌ Secret manquant: $secret"
        exit 1
    else
        echo "✅ Secret défini: $secret"
    fi
done
```

## 📝 **Documentation des Variables**

### Variables par Environnement

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| NODE_ENV | development | staging | production | Environnement Node.js |
| PORT | 3001 | 3001 | 3001 | Port du serveur |
| DATABASE_URL | Local PostgreSQL | Staging DB | Production DB | Connexion BDD |
| JWT_SECRET | Simple | Medium | Complex | Clé JWT |
| CORS_ORIGIN | localhost:5173 | staging.domain | production.domain | Origine CORS |
| LOG_LEVEL | debug | info | warn | Niveau de logs |
| REDIS_ENABLED | false | true | true | Cache Redis |
| EMAIL_VERIFICATION | false | true | true | Vérification email |

Cette documentation doit être mise à jour à chaque ajout de nouvelle variable d'environnement.
