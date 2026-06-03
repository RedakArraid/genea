#!/bin/bash

echo "🚀 Configuration CI/CD optimale pour GeneaIA"
echo "============================================="

# Variables de configuration
SERVER_IP="168.231.86.179"
STAGING_FRONTEND_PORT="3010"
STAGING_BACKEND_PORT="3011"
PROD_PORT="8080"

# Générer des mots de passe sécurisés
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

echo "🔐 Génération des secrets sécurisés..."

STAGING_DB_PASSWORD=$(generate_password)
STAGING_JWT_SECRET=$(generate_password)
PROD_DB_PASSWORD=$(generate_password)
PROD_JWT_SECRET=$(generate_password)

echo "✅ Secrets générés avec succès"

# Créer le fichier de secrets
cat > secrets-github.txt << EOF
# 🔐 Secrets à configurer dans GitHub
# GitHub → Settings → Secrets and variables → Actions → New repository secret

# ===================
# STAGING ENVIRONMENT  
# ===================
STAGING_HOST=${SERVER_IP}
STAGING_USER=root
STAGING_SSH_KEY=<VOTRE_CLÉ_SSH_PRIVÉE_COMPLÈTE>
STAGING_PATH=/var/www/geneaia-staging
STAGING_DB_PASSWORD=${STAGING_DB_PASSWORD}
STAGING_JWT_SECRET=${STAGING_JWT_SECRET}

# ===================
# PRODUCTION ENVIRONMENT
# ===================
PROD_HOST=${SERVER_IP}
PROD_USER=root
PROD_SSH_KEY=<VOTRE_CLÉ_SSH_PRIVÉE_COMPLÈTE>
PROD_PATH=/var/www/geneaia-production
PROD_DB_PASSWORD=${PROD_DB_PASSWORD}
PROD_JWT_SECRET=${PROD_JWT_SECRET}

# ===================
# CONFIGURATION URLS
# ===================
# Staging Frontend: http://${SERVER_IP}:${STAGING_FRONTEND_PORT}
# Staging Backend:  http://${SERVER_IP}:${STAGING_BACKEND_PORT}/api
# Production:       http://${SERVER_IP}:${PROD_PORT}

EOF

echo "📝 Fichier secrets-github.txt créé"

# Créer le script de génération de clé SSH
cat > generate-ssh-key.sh << 'EOF'
#!/bin/bash
echo "🔑 Génération d'une clé SSH dédiée pour les déploiements..."

# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "geneaia-deploy-$(date +%Y%m%d)" -f ~/.ssh/geneaia-deploy -N ""

echo "✅ Clé SSH générée:"
echo "📁 Clé privée: ~/.ssh/geneaia-deploy"
echo "📁 Clé publique: ~/.ssh/geneaia-deploy.pub"

echo ""
echo "🔐 Contenu de la clé privée (à copier dans GitHub Secrets):"
echo "=========================================================="
cat ~/.ssh/geneaia-deploy

echo ""
echo "📋 Prochaines étapes:"
echo "1. Copier la clé privée ci-dessus dans GitHub Secrets (STAGING_SSH_KEY et PROD_SSH_KEY)"
echo "2. Ajouter la clé publique sur le serveur:"
echo "   ssh-copy-id -i ~/.ssh/geneaia-deploy.pub root@168.231.86.179"
echo "3. Tester la connexion:"
echo "   ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179"
EOF

chmod +x generate-ssh-key.sh

echo "🔑 Script generate-ssh-key.sh créé"

# Instructions finales
cat > INSTRUCTIONS.md << 'EOF'
# 🚀 Instructions de configuration CI/CD GeneaIA

## 📋 Étapes à suivre

### 1. 🔑 Configurer SSH
```bash
# Générer la clé SSH dédiée
./generate-ssh-key.sh

# Copier la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/geneaia-deploy.pub root@168.231.86.179

# Tester la connexion
ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179
```

### 2. 🔐 Configurer GitHub Secrets
1. Aller sur GitHub → Settings → Secrets and variables → Actions
2. Copier tous les secrets depuis `secrets-github.txt`
3. Remplacer `<VOTRE_CLÉ_SSH_PRIVÉE_COMPLÈTE>` par le contenu de `~/.ssh/geneaia-deploy`

### 3. 🚀 Tester le déploiement
```bash
# Pousser sur staging
git checkout staging
git add .
git commit -m "🔧 Setup: new optimized CI/CD"
git push origin staging

# Vérifier le résultat
curl http://168.231.86.179:3010  # Frontend staging
curl http://168.231.86.179:3011/api/health  # Backend staging
```

### 4. 🎯 Déployer en production
```bash
# Merger vers main pour déployer en production
git checkout main
git merge staging
git push origin main

# Vérifier la production
curl http://168.231.86.179:8080  # App production complète
```

## 🔍 URLs de test

| Environnement | URL | Description |
|---------------|-----|-------------|
| **Staging Frontend** | http://168.231.86.179:3010 | Interface de test |
| **Staging Backend** | http://168.231.86.179:3011/api | API de test |
| **Production** | http://168.231.86.179:8080 | Application live |

## 🆘 Dépannage

### Erreur SSH
```bash
# Vérifier la clé
ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179

# Permissions correctes
chmod 600 ~/.ssh/geneaia-deploy
chmod 644 ~/.ssh/geneaia-deploy.pub
```

### Erreur de déploiement
```bash
# Sur le serveur, voir les logs
ssh root@168.231.86.179
cd /var/www/geneaia-staging
docker-compose logs
```

### Reset complet
```bash
# Sur le serveur, reset complet
docker-compose down
docker volume rm geneaia-staging_postgres_staging_data
docker-compose up -d
```
EOF

echo ""
echo "✅ Configuration CI/CD créée avec succès !"
echo ""
echo "📁 Fichiers générés :"
echo "   - secrets-github.txt     (secrets pour GitHub)"
echo "   - generate-ssh-key.sh    (génération clé SSH)"  
echo "   - INSTRUCTIONS.md        (guide complet)"
echo ""
echo "🚀 Prochaines étapes :"
echo "   1. Exécuter: ./generate-ssh-key.sh"
echo "   2. Configurer les secrets GitHub"
echo "   3. Tester: git push origin staging"
echo ""
echo "📖 Voir INSTRUCTIONS.md pour le guide détaillé"
