# 🛠️ Guide de développement - GeneaIA

## 📋 Prérequis

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** et **Docker Compose** ([Download](https://docs.docker.com/get-docker/))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Démarrage rapide

### 1. Cloner le projet
```bash
git clone https://github.com/RedakArraid/genea.git
cd genea
```

### 2. Configuration des environnements

#### Backend
```bash
cd backend
cp .env.example .env
# Modifier .env si nécessaire (les valeurs par défaut fonctionnent pour le développement local)
```

#### Frontend
```bash
cd frontend
cp .env.example .env
# Modifier .env si nécessaire (les valeurs par défaut fonctionnent pour le développement local)
```

### 3. Démarrer l'environnement complet
```bash
# Depuis la racine du projet
docker-compose up -d
```

### 4. Initialiser la base de données
```bash
# Attendre que PostgreSQL soit prêt (quelques secondes)
# Puis exécuter les migrations
docker exec geneaia-backend-local-v2 npx prisma migrate deploy
docker exec geneaia-backend-local-v2 npx prisma generate
```

### 5. Accéder à l'application
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001/api
- **Health Check** : http://localhost:3001/health

## 🔧 Développement avancé

### Commandes utiles

#### Docker
```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Reconstruire les images
docker-compose up --build

# Arrêter et nettoyer
docker-compose down
docker-compose down -v  # Supprime aussi les volumes
```

#### Base de données
```bash
# Réinitialiser la base de données
docker-compose down -v
docker-compose up -d postgres
# Attendre que PostgreSQL soit prêt
docker exec geneaia-backend-local-v2 npx prisma migrate deploy

# Ajouter des données de test
docker exec geneaia-backend-local-v2 npx prisma db seed
```

#### Backend
```bash
# Entrer dans le container
docker exec -it geneaia-backend-local-v2 sh

# Voir les logs du backend uniquement
docker-compose logs -f backend

# Tests
docker exec geneaia-backend-local-v2 npm test
```

#### Frontend
```bash
# Entrer dans le container
docker exec -it geneaia-frontend-local-v2 sh

# Voir les logs du frontend uniquement
docker-compose logs -f frontend

# Build de production local
docker exec geneaia-frontend-local-v2 npm run build
```

## 🗄️ Base de données

### Informations de connexion (développement)
- **Host** : localhost
- **Port** : 5432
- **Database** : geneaia_local
- **Username** : geneaia_user
- **Password** : geneaia_password

### Outils recommandés
- **pgAdmin** : Interface graphique pour PostgreSQL
- **DBeaver** : Client universel de base de données
- **VS Code** avec l'extension PostgreSQL

## 🔍 Débogage

### Problèmes courants

#### Le frontend ne se connecte pas au backend
1. Vérifier que le backend est démarré : `curl http://localhost:3001/health`
2. Vérifier la configuration CORS dans `backend/src/index.js`
3. Vérifier la variable `VITE_API_URL` dans `frontend/.env`

#### Erreurs de base de données
1. Vérifier que PostgreSQL est démarré : `docker ps | grep postgres`
2. Vérifier les migrations : `docker exec geneaia-backend-local-v2 npx prisma migrate status`
3. Réinitialiser si nécessaire : `docker-compose down -v && docker-compose up -d`

#### Erreurs Docker
1. Nettoyer les containers : `docker system prune -f`
2. Reconstruire : `docker-compose build --no-cache`
3. Vérifier l'espace disque disponible

### Logs de débogage
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Avec horodatage
docker-compose logs -f -t backend
```

## 🧪 Tests

### Backend
```bash
# Tests unitaires
docker exec geneaia-backend-local-v2 npm test

# Tests avec couverture
docker exec geneaia-backend-local-v2 npm run test:coverage
```

### Frontend
```bash
# Tests (si configurés)
docker exec geneaia-frontend-local-v2 npm test
```

## 📁 Structure du projet

```
genea/
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages de l'application
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── services/     # Services API
│   │   └── store/        # Gestion d'état (Zustand)
│   ├── .env              # Variables d'environnement
│   └── Dockerfile.dev    # Docker pour développement
├── backend/               # API Node.js
│   ├── src/
│   │   ├── controllers/  # Contrôleurs API
│   │   ├── routes/       # Routes Express
│   │   ├── middleware/   # Middlewares
│   │   └── lib/          # Utilitaires
│   ├── prisma/           # Base de données Prisma
│   ├── .env              # Variables d'environnement
│   └── Dockerfile        # Docker pour production
└── docker-compose.yml    # Configuration Docker
```

## 🤝 Contribution

1. Créer une branche depuis `develop`
2. Faire les modifications
3. Tester localement
4. Créer une Pull Request vers `develop`

## 📚 Documentation

- **API Documentation** : http://localhost:3001/api (après démarrage)
- **Prisma Studio** : `npx prisma studio` (dans le container backend)
- **React DevTools** : Extension navigateur pour React

## 🆘 Aide

- **Issues GitHub** : https://github.com/RedakArraid/genea/issues
- **Documentation complète** : README.md
- **CI/CD** : README-CICD.md
