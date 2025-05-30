
## 2025-05-30 10:50:56 - Commit 52435ae

- Auto-deploy: 2025-05-30 10:50:52

### Fichiers modifiés:
- CHANGELOG.md
- deploy/deploy-status.json


## 2025-05-30 10:37:34 - Commit d383a5a

- Auto-deploy: 2025-05-30 10:37:19

### Fichiers modifiés:
- .github/workflows/deploy.yml
- .gitignore
- CHANGELOG.md
- Makefile
- README-DEPLOY.md
- SETUP-COMPLETE.md
- backend/.env.example
- deploy/README.md
- ecosystem.config.js
- frontend/.env.example
- scripts/auto-push.sh
- scripts/clean.sh
- scripts/demo.sh
- scripts/post-push.sh
- scripts/quick-init.sh
- scripts/setup-deploy.sh
- scripts/validate-deploy.sh
- scripts/vps-update.sh

# 📋 Changelog GeneaIA

Historique des versions et déploiements automatiques.

## Format

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet suit [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Non publié]

### À venir
- Intégration IA avancée
- Application mobile
- Export PDF amélioré

## [1.0.0] - 2025-05-30

### ✨ Ajouté
- 🚀 Déploiement automatique complet
- 📦 Scripts d'installation et de mise à jour
- 🔧 Configuration PM2 pour VPS
- 🤖 GitHub Actions pour CI/CD
- 📋 Validation automatique avant déploiement
- 🧹 Scripts de nettoyage
- 📚 Documentation complète
- ⚙️ Fichiers .env.example détaillés
- 🔍 Monitoring et logs centralisés

### 🛠️ Structure de déploiement
- **scripts/auto-push.sh** - Push automatique vers GitHub
- **scripts/vps-update.sh** - Mise à jour VPS
- **scripts/validate-deploy.sh** - Validation pré-déploiement
- **scripts/quick-init.sh** - Initialisation rapide
- **scripts/clean.sh** - Nettoyage projet
- **Makefile** - Commandes unifiées
- **ecosystem.config.js** - Configuration PM2
- **.github/workflows/deploy.yml** - CI/CD GitHub Actions

### 📁 Organisation
- `/deploy` - Scripts et documentation déploiement
- `/scripts` - Scripts d'automatisation
- `/backend` - API Node.js + Prisma
- `/frontend` - Interface React + Vite

### 🔧 Commandes Makefile
- `make dev` - Développement local
- `make push` - Push vers GitHub
- `make vps-update` - Mise à jour VPS
- `make status` - Statut services
- `make help` - Aide complète

### 📖 Documentation
- Guide de déploiement automatique
- Configuration VPS step-by-step
- Troubleshooting guide
- Variables d'environnement documentées

---

**Légende des symboles :**
- ✨ Nouvelle fonctionnalité
- 🛠️ Amélioration
- 🐛 Correction de bug
- 🔒 Sécurité
- 📚 Documentation
- 🗑️ Suppression