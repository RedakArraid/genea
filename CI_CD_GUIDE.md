# 🚀 Guide CI/CD Complete - GeneaIA

## 🏗️ **Architecture CI/CD**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging      │───▶│   Production    │
│   (localhost)   │    │ (staging.domain) │    │ (geneaia.com)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Docker Compose  │    │ Docker + CI/CD   │    │ Docker + CI/CD  │
│ Local Dev       │    │ Auto Deploy      │    │ Manual Approval │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🌍 **Gestion des Environnements**

### ✅ **Oui, vous avez besoin de différents .env !**

**Pourquoi ?**
- 🔐 **Sécurité** : Secrets différents par environnement
- 🎯 **Configuration** : Comportements adaptés à chaque env
- 🚀 **Performance** : Optimisations spécifiques
- 🔍 **Debugging** : Logs adaptés au contexte

### 📁 **Structure Recommandée**
```
environments/
├── .env.development     # Local uniquement
├── .env.staging        # Environnement de test
├── .env.production     # Production (secrets via CI/CD)
└── .env.example        # Template public
```

## 🔄 **Workflow CI/CD Détaillé**

### 🏗️ **Phase 1 : Tests & Validation**
```yaml
# Déclenché sur : Push vers develop, staging, main
1. 🧪 Tests unitaires (Backend + Frontend)
2. 🔍 Analyse de code (ESLint, SonarQube)
3. 🛡️ Scan sécurité (Trivy, Snyk)
4. 🏗️ Build test (Vérification compilation)
5. 📊 Couverture de tests (Codecov)
```

### 🐳 **Phase 2 : Build Images**
```yaml
# Déclenché sur : Push vers staging, main
1. 🐳 Build image Docker Backend
2. 🎨 Build image Docker Frontend 
3. 📦 Push vers GitHub Container Registry
4. 🏷️ Tag automatique (branch-sha, latest)
```

### 🚀 **Phase 3 : Déploiement**
```yaml
# Staging (Auto)
Branch: staging → Deploy automatique

# Production (Manuel) 
Branch: main → Approbation requise → Deploy
```

## 🛠️ **Commandes Utiles**

### 🏠 **Développement Local**
```bash
# Démarrage rapide
./scripts/deploy.sh development deploy

# Voir les logs
./scripts/deploy.sh development logs

# Migration BDD
./scripts/deploy.sh development migrate

# Health check
./scripts/deploy.sh development health
```

### 🎭 **Staging**
```bash
# Déploiement staging
./scripts/deploy.sh staging deploy

# Backup avant tests
./scripts/deploy.sh staging backup

# Restauration si problème
./scripts/deploy.sh staging restore backup_20241201_143022.sql
```

### 🏭 **Production**
```bash
# Déploiement production (après approbation CI/CD)
./scripts/deploy.sh production deploy

# Backup automatique avant deploy
./scripts/deploy.sh production backup

# Surveillance
./scripts/deploy.sh production health
./scripts/deploy.sh production logs
```

## 🔐 **Gestion des Secrets**

### 🎯 **Stratégie par Environnement**

#### 🏠 Development
```bash
# Fichier local : environments/.env.development
JWT_SECRET="dev-secret-key"
DATABASE_URL="postgresql://user:pass@localhost:5432/genea"
CORS_ORIGIN="http://localhost:5173"
```

#### 🎭 Staging  
```bash
# Variables CI/CD + fichier base
JWT_SECRET="${{ secrets.STAGING_JWT_SECRET }}"
DATABASE_URL="${{ secrets.STAGING_DATABASE_URL }}"
CORS_ORIGIN="https://staging.geneaia.com"
```

#### 🏭 Production
```bash
# 100% via secrets CI/CD
JWT_SECRET="${{ secrets.PROD_JWT_SECRET }}"
DATABASE_URL="${{ secrets.PROD_DATABASE_URL }}"
CORS_ORIGIN="https://geneaia.com"
```

## 📊 **Monitoring & Alertes**

### 🎯 **Métriques Surveillées**
- 📈 **Performance** : Temps de réponse API
- 🔍 **Erreurs** : Taux d'erreur 5xx
- 💾 **Ressources** : CPU, RAM, Disque
- 🌐 **Réseau** : Latence, disponibilité
- 👥 **Utilisateurs** : Sessions actives

### 🚨 **Alertes Configurées**
- ❌ **Erreur critique** → Slack immédiat
- ⚠️ **Performance dégradée** → Email équipe
- 📉 **Ressources faibles** → Dashboard
- 🔒 **Sécurité** → Notification urgente

## 🔧 **Optimisations CI/CD**

### ⚡ **Performance**
```yaml
# Cache des dépendances
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Build parallèle
jobs:
  test-backend:
    runs-on: ubuntu-latest
  test-frontend:
    runs-on: ubuntu-latest
```

### 🛡️ **Sécurité**
```yaml
# Scan des vulnérabilités
- name: Security Scan
  uses: aquasecurity/trivy-action@master
  
# Analyse des secrets
- name: Secret Scan  
  uses: trufflesecurity/trufflehog@main
```

## 📋 **Checklist de Mise en Production**

### ✅ **Avant le Premier Déploiement**
- [ ] Secrets configurés dans GitHub
- [ ] DNS pointé vers le serveur
- [ ] Certificats SSL installés
- [ ] Base de données de production créée
- [ ] Backup strategy en place
- [ ] Monitoring configuré
- [ ] Tests de charge effectués

### ✅ **Avant Chaque Déploiement**
- [ ] Tests passent en vert
- [ ] Code review approuvé
- [ ] Changelog mis à jour
- [ ] Backup de la BDD effectué
- [ ] Équipe prévenue
- [ ] Plan de rollback prêt

## 🆘 **Procédures d'Urgence**

### 🔄 **Rollback Rapide**
```bash
# Revenir à la version précédente
git revert HEAD
git push origin main

# Ou déployer une version spécifique
docker pull ghcr.io/your-repo/backend:v1.2.3
docker-compose up -d
```

### 🚨 **Incident Production**
1. 🛑 **Stop** : Couper le trafic si nécessaire
2. 📋 **Assess** : Identifier le problème
3. 🔧 **Fix** : Correction rapide ou rollback
4. 📊 **Monitor** : Vérifier le retour à la normale
5. 📝 **Document** : Post-mortem et amélioration

## 🎓 **Formation Équipe**

### 👨‍💻 **Développeurs**
- Comprendre les environnements
- Maîtriser les commandes de base
- Savoir lire les logs CI/CD

### 🔧 **DevOps/SRE**
- Maintenance des pipelines
- Gestion des secrets
- Optimisation des performances
- Réponse aux incidents

Cette approche CI/CD vous donne un déploiement professionnel, sécurisé et automatisé ! 🚀
