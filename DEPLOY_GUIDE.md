# 🚀 Guide de déploiement GeneaIA - Première version

## 📋 Prérequis

- ✅ Accès SSH au serveur `168.231.86.179`
- ✅ Droits admin sur le repository GitHub
- ✅ Docker installé sur le serveur

## 🎯 Plan de déploiement

### Phase 1 : Configuration (15-20 minutes)
1. **Configurer SSH et secrets GitHub**
2. **Tester le déploiement staging**
3. **Valider les fonctionnalités**

### Phase 2 : Production (10-15 minutes)
1. **Déployer en production**
2. **Tests finaux**
3. **Documentation des URLs**

---

## 🛠️ **ÉTAPE 1 : Configuration SSH et Secrets**

### 1.1 Générer la clé SSH dédiée

```bash
cd /Users/kader/Desktop/projet-en-cours/geneaIA

# Rendre exécutable et lancer
chmod +x setup-cicd.sh
./setup-cicd.sh

# Générer la clé SSH
chmod +x generate-ssh-key.sh
./generate-ssh-key.sh
```

### 1.2 Configurer la clé sur le serveur

```bash
# Copier la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/geneaia-deploy.pub root@168.231.86.179

# Tester la connexion
ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179
```

### 1.3 Configurer GitHub Secrets

1. **Aller sur GitHub** → Votre repo → **Settings** → **Secrets and variables** → **Actions**
2. **Ajouter tous les secrets** depuis le fichier `secrets-github.txt`
3. **Remplacer** `<VOTRE_CLÉ_SSH_PRIVÉE_COMPLÈTE>` par le contenu affiché par `generate-ssh-key.sh`

**Secrets requis :**
- `STAGING_HOST` = `168.231.86.179`
- `STAGING_USER` = `root`
- `STAGING_SSH_KEY` = *[contenu de ~/.ssh/geneaia-deploy]*
- `STAGING_PATH` = `/var/www/geneaia-staging`
- `STAGING_DB_PASSWORD` = *[généré automatiquement]*
- `STAGING_JWT_SECRET` = *[généré automatiquement]*
- `PROD_HOST` = `168.231.86.179`
- `PROD_USER` = `root`
- `PROD_SSH_KEY` = *[même clé que staging]*
- `PROD_PATH` = `/var/www/geneaia-production`
- `PROD_DB_PASSWORD` = *[généré automatiquement]*
- `PROD_JWT_SECRET` = *[généré automatiquement]*

---

## 🧪 **ÉTAPE 2 : Déploiement Staging (Test)**

### 2.1 Préparer et pousser

```bash
cd /Users/kader/Desktop/projet-en-cours/geneaIA

# Créer/basculer sur staging
git checkout -b staging || git checkout staging

# Ajouter les fichiers de configuration
git add .
git commit -m "🚀 Setup: Production-ready CI/CD configuration"

# Pousser vers staging (déclenche le déploiement automatique)
git push origin staging
```

### 2.2 Suivre le déploiement

1. **GitHub Actions** → Onglet "Actions" de votre repo
2. **Surveiller** le workflow "🚀 GeneaIA CI/CD - Production Ready"
3. **Attendre** que le job "🚀 Deploy to Staging" soit ✅

### 2.3 Tester le staging

```bash
# Frontend staging
curl http://168.231.86.179:3010

# Backend staging
curl http://168.231.86.179:3011/api/health

# Test de l'authentification
curl -X POST http://168.231.86.179:3011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**URLs de test :**
- 🌐 **Frontend Staging** : http://168.231.86.179:3010
- 🔌 **API Staging** : http://168.231.86.179:3011/api

---

## 🎯 **ÉTAPE 3 : Déploiement Production**

### 3.1 Merger vers main

```bash
# Basculer sur main
git checkout main

# Merger staging vers main
git merge staging

# Pousser vers main (déclenche le déploiement prod automatique)
git push origin main
```

### 3.2 Suivre le déploiement production

1. **GitHub Actions** → Workflow en cours
2. **Attendre** le job "🚀 Deploy to Production" ✅
3. **Vérifier** qu'aucune erreur n'apparaît

### 3.3 Tests de production

```bash
# Application complète
curl http://168.231.86.179:8080

# API via Nginx
curl http://168.231.86.179:8080/api/health

# Test d'authentification
curl -X POST http://168.231.86.179:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🎉 **ÉTAPE 4 : Validation finale**

### URLs de votre application déployée

| Environnement | URL | Usage |
|---------------|-----|--------|
| **🚀 Production** | http://168.231.86.179:8080 | Application live |
| **🧪 Staging** | http://168.231.86.179:3010 | Tests et prévisualisation |
| **🔌 API Staging** | http://168.231.86.179:3011/api | API de développement |

### Tests fonctionnels à effectuer

1. **Accéder à l'application** : http://168.231.86.179:8080
2. **Créer un compte utilisateur**
3. **Se connecter**
4. **Créer un nouvel arbre généalogique**
5. **Ajouter quelques personnes**
6. **Tester les relations familiales**
7. **Vérifier la sauvegarde des positions**

---

## 🆘 **Dépannage**

### En cas d'erreur de déploiement

```bash
# Se connecter au serveur
ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179

# Vérifier les logs staging
cd /var/www/geneaia-staging
docker-compose logs

# Vérifier les logs production
cd /var/www/geneaia-production
docker-compose logs

# Redémarrer les services si nécessaire
docker-compose restart
```

### Problèmes courants

1. **Erreur SSH** : Vérifier que la clé est correctement configurée
2. **Erreur GitHub Secrets** : Vérifier que tous les secrets sont présents
3. **Erreur Docker** : Se connecter au serveur et vérifier les logs
4. **Base de données** : Les migrations Prisma peuvent prendre du temps

### Reset complet (si nécessaire)

```bash
# Sur le serveur, reset du staging
ssh root@168.231.86.179
cd /var/www/geneaia-staging
docker-compose down
docker volume rm geneaia-staging_postgres_staging_data
docker-compose up -d
```

---

## 📈 **Après le déploiement**

### Workflow de développement recommandé

1. **Développement** → Branche `develop` ou `feature/*`
2. **Tests** → Merge vers `staging` → Déploiement automatique
3. **Validation** → Test sur http://168.231.86.179:3010
4. **Production** → Merge `staging` vers `main` → Déploiement automatique

### Surveillance

- **GitHub Actions** pour les déploiements
- **URLs de santé** pour surveiller la disponibilité
- **Logs Docker** pour le debug

### Sauvegardes

- ✅ **Base de données** : Backup automatique avant chaque déploiement production
- ✅ **Configuration** : Backup des docker-compose.yml
- ✅ **Rollback** : Possible en cas de problème

---

## ✅ **Checklist de déploiement**

- [ ] ✅ Configuration SSH terminée
- [ ] ✅ Secrets GitHub configurés  
- [ ] ✅ Déploiement staging réussi
- [ ] ✅ Tests staging OK
- [ ] ✅ Déploiement production réussi
- [ ] ✅ Tests production OK
- [ ] ✅ Application accessible
- [ ] ✅ Fonctionnalités testées

**🎉 Félicitations ! Votre application GeneaIA est maintenant déployée !**

**🌐 Accès public :** http://168.231.86.179:8080
