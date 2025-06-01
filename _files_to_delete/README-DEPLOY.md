# 🧬 GeneaIA - Application de Généalogie Intelligente

[![Deploy Status](https://img.shields.io/github/actions/workflow/status/votre-username/geneaia/deploy.yml?branch=main&label=Deploy)](https://github.com/votre-username/geneaia/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)

> Application moderne de généalogie avec intelligence artificielle pour retracer et visualiser l'histoire familiale.

## ✨ Fonctionnalités

- 🌳 **Arbres généalogiques interactifs** - Visualisation dynamique des liens familiaux
- 🤖 **IA intégrée** - Suggestions automatiques et analyse des données
- 📸 **Gestion multimédia** - Photos, documents et souvenirs familiaux
- 🗺️ **Cartographie** - Localisation géographique des événements familiaux
- 📊 **Statistiques avancées** - Analyses démographiques et tendances
- 🔒 **Sécurité** - Authentification JWT et protection des données
- 📱 **Responsive** - Interface adaptée mobile et desktop
- 🌐 **Multi-langues** - Support français et anglais

## 🚀 Démarrage Ultra-Rapide

### Première installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/geneaia.git
cd geneaia

# 2. Initialisation automatique
chmod +x scripts/quick-init.sh
./scripts/quick-init.sh

# 3. Configuration
# Modifiez backend/.env et frontend/.env avec vos paramètres

# 4. Premier démarrage
make dev
```

### Workflow quotidien

```bash
# Développement local
make dev

# Tests
make test

# Déploiement
make push
```

## 📋 Prérequis

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **Git**
- **npm** ou **yarn**

## 🏗️ Architecture

```
geneaIA/
├── 📁 backend/          # API Node.js + Prisma
├── 📁 frontend/         # Interface React + Vite
├── 📁 deploy/           # Scripts et configuration déploiement
├── 📁 scripts/          # Scripts d'automatisation
├── 📁 docs/             # Documentation
├── 🔧 Makefile          # Commandes principales
└── ⚙️ ecosystem.config.js # Configuration PM2
```

### Stack Technique

**Backend:**
- **Node.js** + **Express** - API REST
- **Prisma** - ORM et gestion base de données
- **PostgreSQL** - Base de données principale
- **JWT** - Authentification
- **Multer** - Upload de fichiers

**Frontend:**
- **React** + **TypeScript** - Interface utilisateur
- **Vite** - Build tool moderne
- **Material-UI** ou **Tailwind** - Interface design
- **React Router** - Navigation
- **Axios** - API client

**DevOps:**
- **PM2** - Process management
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy (optionnel)
- **Docker** - Containerisation (optionnel)

## 🔧 Commandes Principales

| Commande | Description |
|----------|-------------|
| `make dev` | 🔧 Démarrer en développement |
| `make build` | 🏗️ Build de production |
| `make test` | 🧪 Lancer les tests |
| `make push` | 🚀 Push vers GitHub |
| `make deploy` | 🚀 Build + Push |
| `make vps-update` | 🌐 Mise à jour VPS |
| `make status` | 📊 Statut des services |
| `make clean` | 🧹 Nettoyer le projet |
| `make help` | 📖 Aide complète |

## ⚙️ Configuration

### Variables d'environnement

**Backend (backend/.env):**
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@localhost:5432/geneaia"
JWT_SECRET="votre-secret-32-caracteres-minimum"
PORT=3001
```

**Frontend (frontend/.env):**
```env
VITE_APP_NAME="GeneaIA"
VITE_API_URL="http://localhost:3001/api"
```

### Base de données

```bash
# Créer la base PostgreSQL
createdb geneaia

# Appliquer les migrations
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## 🌐 Déploiement

### Déploiement VPS

**1. Première installation sur VPS:**

```bash
# Sur votre VPS
git clone https://github.com/votre-username/geneaia.git
cd geneaia

# Configuration
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Configurez les fichiers .env

# Installation
make vps-setup
```

**2. Mises à jour:**

```bash
# Sur votre VPS
git pull
make vps-update
```

### GitHub Actions

Configuration automatique avec les secrets GitHub :

- `VPS_HOST` - IP de votre VPS
- `VPS_USER` - Utilisateur SSH
- `VPS_SSH_KEY` - Clé privée SSH
- `VPS_PATH` - Chemin sur le VPS
- `VITE_API_URL` - URL de l'API en production

## 🧪 Tests

```bash
# Tests backend
cd backend && npm test

# Tests frontend
cd frontend && npm test

# Tests complets
make test
```

## 📊 Monitoring

```bash
# Statut des services
make status

# Logs en temps réel
make logs

# Monitoring PM2
pm2 monit
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Scripts Disponibles

- **`scripts/quick-init.sh`** - Initialisation rapide du projet
- **`scripts/auto-push.sh`** - Push automatique vers GitHub
- **`scripts/vps-update.sh`** - Mise à jour VPS
- **`scripts/validate-deploy.sh`** - Validation avant déploiement
- **`scripts/clean.sh`** - Nettoyage du projet

## 🔍 Dépannage

### Problèmes courants

**Base de données :**
```bash
# Réinitialiser la base
make db-reset

# Vérifier la connexion
cd backend && npx prisma db push
```

**Services qui ne démarrent pas :**
```bash
# Vérifier les logs
make logs

# Redémarrer
make restart
```

**Permissions :**
```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh
```

## 📚 Documentation

- [Guide de déploiement](deploy/README.md)
- [Configuration VPS](deploy/VPS-SETUP.md)
- [API Documentation](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🛡️ Sécurité

- Authentification JWT
- Validation des données d'entrée
- Protection CORS
- Chiffrement des mots de passe
- Upload sécurisé des fichiers

## 📈 Roadmap

- [ ] 🤖 Intégration IA plus poussée
- [ ] 📱 Application mobile React Native
- [ ] 🌍 Plus de langues (espagnol, allemand)
- [ ] 📊 Analyses génétiques
- [ ] 🔗 Intégration réseaux sociaux
- [ ] 📄 Export PDF avancé

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développeur Principal** - [@votre-username](https://github.com/votre-username)

## 🙏 Remerciements

- [Prisma](https://prisma.io) - ORM fantastique
- [React](https://reactjs.org) - Bibliothèque UI
- [Node.js](https://nodejs.org) - Runtime JavaScript
- [PostgreSQL](https://postgresql.org) - Base de données

## 📞 Support

- 📧 Email: support@geneaia.com
- 💬 Discussions: [GitHub Discussions](https://github.com/votre-username/geneaia/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/geneaia/issues)

---

<div align="center">

**🌟 Si ce projet vous plaît, n'hésitez pas à lui donner une étoile ! 🌟**

[![Stars](https://img.shields.io/github/stars/votre-username/geneaia?style=social)](https://github.com/votre-username/geneaia/stargazers)

</div>