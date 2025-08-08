# 🚀 GeneaIA - Projet généalogique intelligent

Application web moderne pour créer et gérer des arbres généalogiques avec des fonctionnalités avancées d'analyse familiale.

## ⚡ Démarrage rapide

### Développement local (recommandé)
```bash
# Cloner le projet
git clone https://github.com/RedakArraid/genea.git
cd genea

# Démarrage automatique (recommandé)
./start-dev.sh

# OU manuellement
docker-compose up -d
# Puis initialiser la base de données
docker exec geneaia-backend-local npx prisma migrate deploy

# URLs locales
Frontend: http://localhost:5173
Backend:  http://localhost:3001/api
Health:   http://localhost:3001/health
```

### Arrêt de l'environnement
```bash
# Arrêt automatique avec options
./stop-dev.sh

# OU manuellement
docker-compose down
```

### Configuration CI/CD
```bash
# Configuration automatique
./setup-cicd.sh

# Générer les clés SSH
./generate-ssh-key.sh

# Voir README-CICD.md pour les détails complets
```

## 🏗️ Architecture

- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Node.js + Express + Prisma
- **Base de données** : PostgreSQL
- **CI/CD** : GitHub Actions + Docker

## 🌐 Environnements

| Environnement | URL | Description |
|---------------|-----|-------------|
| **Développement** | http://localhost:5173 | Local avec hot reload |
| **Staging** | http://168.231.86.179:3010 | Tests et preview |
| **Production** | http://168.231.86.179:8080 | Application live |

## 📖 Documentation

- **[Guide de développement détaillé](README-DEV.md)** - Instructions complètes pour les développeurs
- **[Guide CI/CD complet](README-CICD.md)** - Configuration et déploiement
- **Frontend** : `frontend/README.md`
- **Backend** : `backend/README.md`

## 🚀 Déploiement

```bash
# Staging
git push origin staging

# Production
git push origin main
```

## 🛠️ Développement

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- Git

### Structure du projet
```
├── frontend/          # Application React
├── backend/           # API Node.js
├── .github/workflows/ # CI/CD GitHub Actions
├── docker-compose.yml # Développement local
└── README-CICD.md     # Guide de déploiement
```

### Commandes utiles
```bash
# Logs en développement
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend

# Reset de la base de données
docker-compose down -v
docker-compose up -d
docker exec geneaia-backend-local npx prisma migrate deploy

# Tests
docker exec geneaia-backend-local npm test
docker exec geneaia-frontend-local npm test

# Reconstruire les images
docker-compose build --no-cache
docker-compose up -d
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/RedakArraid/genea/issues)
- **Documentation** : [README-CICD.md](README-CICD.md)
- **Email** : support@geneaia.com
