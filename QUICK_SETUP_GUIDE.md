# 🚀 GUIDE RAPIDE - Configuration CI/CD VPS

## 📋 CHECKLIST COMPLÈTE

### ✅ **1. Sur votre machine locale**
```bash
cd /Users/kader/Desktop/projet-en-cours/geneaIA

# Générer les clés SSH
chmod +x scripts/generate-ssh-keys.sh
./scripts/generate-ssh-keys.sh
```

### ✅ **2. Sur votre VPS**
```bash
# Copier et exécuter le script de préparation
wget https://raw.githubusercontent.com/VOTRE-USERNAME/VOTRE-REPO/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh

# Ajouter la clé publique (remplacez par votre vraie clé)
echo 'VOTRE_CLE_PUBLIQUE_GENEREE' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### ✅ **3. Configuration GitHub Secrets**

#### 🏭 Production Environment
```
Nom: production
Secrets:
- PROD_HOST = IP_DE_VOTRE_VPS
- PROD_USER = ubuntu (ou votre utilisateur)
- PROD_SSH_KEY = [clé privée générée par le script]
- PROD_PATH = /var/www/geneaia
- PROD_DB_PASSWORD = [mot de passe sécurisé]
- PROD_JWT_SECRET = [32+ caractères aléatoires]
- PROD_API_URL = https://api.votre-domaine.com
- PROD_CORS_ORIGIN = https://votre-domaine.com
```

#### 🎭 Staging Environment
```
Nom: staging  
Secrets:
- STAGING_HOST = IP_DE_VOTRE_VPS
- STAGING_USER = ubuntu (ou votre utilisateur)
- STAGING_SSH_KEY = [même clé privée]
- STAGING_PATH = /var/www/geneaia-staging
- STAGING_DB_PASSWORD = [mot de passe différent]
- STAGING_JWT_SECRET = [différent de prod]
- STAGING_API_URL = https://api-staging.votre-domaine.com
- STAGING_CORS_ORIGIN = https://staging.votre-domaine.com
```

### ✅ **4. Test de connexion**
```bash
# Depuis votre machine
ssh -i ~/.ssh/geneaia_deploy ubuntu@IP_DE_VOTRE_VPS

# Si ça marche, la connexion est OK !
```

### ✅ **5. Premier déploiement**
```bash
# Créer la branche staging
git checkout -b staging
git push origin staging

# Vérifier dans GitHub Actions > Actions tab
# Le déploiement staging devrait se lancer automatiquement

# Si OK, déployer en production
git checkout main
git merge staging
git push origin main
```

## 🔧 **Configuration des Variables d'Environnement**

### 📝 **Template pour vos secrets** (remplacez les valeurs)

```bash
# 🔑 Génération des valeurs
JWT_SECRET_PROD=$(openssl rand -base64 32)
JWT_SECRET_STAGING=$(openssl rand -base64 32)
DB_PASSWORD_PROD=$(openssl rand -base64 24)
DB_PASSWORD_STAGING=$(openssl rand -base64 24)

echo "JWT_SECRET_PROD: $JWT_SECRET_PROD"
echo "JWT_SECRET_STAGING: $JWT_SECRET_STAGING"  
echo "DB_PASSWORD_PROD: $DB_PASSWORD_PROD"
echo "DB_PASSWORD_STAGING: $DB_PASSWORD_STAGING"
```

## 🌐 **Configuration DNS (si vous avez un domaine)**

### A Records à créer :
```
geneaia.com → IP_DE_VOTRE_VPS
www.geneaia.com → IP_DE_VOTRE_VPS
api.geneaia.com → IP_DE_VOTRE_VPS
staging.geneaia.com → IP_DE_VOTRE_VPS
api-staging.geneaia.com → IP_DE_VOTRE_VPS
```

## 🆘 **En cas de problème**

### 🔍 **Debug SSH**
```bash
# Test de connexion verbose
ssh -v -i ~/.ssh/geneaia_deploy ubuntu@IP_VPS

# Vérifier les permissions
ls -la ~/.ssh/geneaia_deploy*
# Doit afficher : -rw------- (600)
```

### 🐳 **Vérifier Docker sur VPS**
```bash
# Sur le VPS
docker --version
docker-compose --version
docker ps
```

### 📋 **Logs GitHub Actions**
- Aller dans votre repo > Actions
- Cliquer sur le workflow qui a échoué
- Examiner les logs détaillés

## ✅ **Une fois tout configuré**

Votre workflow sera :
```
Code → Git Push → GitHub Actions → VPS → Application Live
```

**🎉 Félicitations ! Vous avez un pipeline CI/CD professionnel !**
