# 🔐 TEMPLATE DES SECRETS GITHUB - GENEAIA

## 📋 Repository Secrets (Communs à tous les environnements)

### 🐳 GitHub Container Registry
```
GITHUB_TOKEN = [Automatique - déjà configuré par GitHub]
```

### 📧 Configuration Email (Optionnel)
```
SMTP_HOST = smtp.your-provider.com
SMTP_USER = noreply@geneaia.com  
SMTP_PASSWORD = your-smtp-password
```

### 📊 Monitoring (Optionnel)
```
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SENTRY_DSN = https://your-sentry-dsn@sentry.io/project-id
```

## 🎭 Environment Secrets : STAGING

### 🌐 Serveur Staging
```
STAGING_HOST = [IP de votre serveur staging ou staging.votre-domaine.com]
STAGING_USER = [utilisateur SSH, ex: deploy ou ubuntu]
STAGING_SSH_KEY = [clé privée SSH générée par le script]
STAGING_PORT = 22
STAGING_PATH = /var/www/geneaia-staging
```

### 🗄️ Base de Données Staging
```
STAGING_DB_HOST = localhost
STAGING_DB_USER = geneaia_staging
STAGING_DB_PASSWORD = [mot de passe sécurisé pour staging]
STAGING_DB_NAME = geneaia_staging
```

### 🔑 Application Staging
```
STAGING_JWT_SECRET = [chaîne aléatoire de 32+ caractères pour staging]
STAGING_API_URL = https://api-staging.votre-domaine.com
STAGING_CORS_ORIGIN = https://staging.votre-domaine.com
```

## 🏭 Environment Secrets : PRODUCTION

### 🌐 Serveur Production
```
PROD_HOST = [IP de votre serveur production ou votre-domaine.com]
PROD_USER = [utilisateur SSH, ex: deploy ou ubuntu]  
PROD_SSH_KEY = [clé privée SSH générée par le script]
PROD_PORT = 22
PROD_PATH = /var/www/geneaia
```

### 🗄️ Base de Données Production
```
PROD_DB_HOST = localhost
PROD_DB_USER = geneaia_prod
PROD_DB_PASSWORD = [mot de passe très sécurisé pour production]
PROD_DB_NAME = geneaia_production
```

### 🔑 Application Production
```
PROD_JWT_SECRET = [chaîne aléatoire de 32+ caractères DIFFÉRENTE de staging]
PROD_API_URL = https://api.votre-domaine.com
PROD_CORS_ORIGIN = https://votre-domaine.com
```

### 💾 Cache Production (Optionnel)
```
PROD_REDIS_URL = redis://localhost:6379
```

## 🛠️ EXEMPLES DE VALEURS

### 🔑 Génération JWT Secret
```bash
# Générer un JWT secret sécurisé
openssl rand -base64 32
# Exemple de sortie: K7gD5fJ8mN2pQ9rS6vW9yB2eF5hJ8kL3nP6qT9uX2zA5c=
```

### 🔐 Mot de passe base de données
```bash
# Générer un mot de passe sécurisé
openssl rand -base64 24
# Exemple de sortie: xR9mK2nP5qT8vY1bE4gH7jL0oS3w
```

## 📝 ÉTAPES DE CONFIGURATION

### 1. 🔑 Générer les clés SSH
```bash
./scripts/generate-ssh-keys.sh
```

### 2. 🌐 Configurer GitHub Secrets
- Repository Settings > Secrets and variables > Actions
- Créer les environments `staging` et `production`
- Ajouter tous les secrets ci-dessus

### 3. 🖥️ Préparer le VPS
```bash
# Sur votre VPS
sudo mkdir -p /var/www/geneaia
sudo mkdir -p /var/www/geneaia-staging
sudo chown $USER:$USER /var/www/geneaia*

# Ajouter la clé publique
echo 'VOTRE_CLE_PUBLIQUE' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 4. 🐳 Installer Docker sur le VPS
```bash
# Installation Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 5. ✅ Tester la connexion
```bash
# Test depuis votre machine locale
ssh -i ~/.ssh/geneaia_deploy USER@YOUR_VPS_IP
```

## 🎯 VALIDATION

Une fois configuré, vous pouvez tester le déploiement :

```bash
# 1. Commit et push vers staging
git checkout -b staging
git push origin staging

# 2. Vérifier dans GitHub Actions que le déploiement fonctionne

# 3. Si OK, merger vers main pour la production
git checkout main
git merge staging  
git push origin main
```

## ⚠️ SÉCURITÉ

- ❌ Ne jamais commiter les clés privées
- ✅ Utiliser des mots de passe différents par environnement
- ✅ Activer 2FA sur GitHub
- ✅ Limiter les permissions SSH sur le VPS
- ✅ Rotation régulière des secrets (90 jours)
