# 🚀 GeneaIA - Projet généalogique intelligent

Application web moderne pour créer et gérer des arbres généalogiques avec des fonctionnalités avancées d'analyse familiale.

## ⚡ Démarrage rapide

### Développement local
```bash
# Cloner le projet
git clone https://github.com/RedakArraid/genea.git
cd genea

# Lancer l'environnement de développement
docker-compose up -d

# URLs locales
Frontend: http://localhost:5173
Backend:  http://localhost:3001/api
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

**Note**: Backend API accessible sur `http://localhost:3001/api` en développement

## 📖 Documentation

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

# Reset de la base de données
docker-compose down -v
docker-compose up -d

# Tests
cd backend && npm test
cd frontend && npm test
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
