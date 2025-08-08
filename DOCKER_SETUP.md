# 🐳 Configuration Docker pour GeneaIA

Ce guide explique comment lancer le projet GeneaIA avec Docker Compose pour le développement et la production.

## 📋 Prérequis

- [Docker](https://docs.docker.com/get-docker/) installé
- [Docker Compose](https://docs.docker.com/compose/install/) installé
- Au moins 4GB de RAM disponible

## 🚀 Démarrage Rapide

### Développement

```bash
# Démarrage avec le script automatique
./scripts/start-dev.sh

# Ou manuellement
docker-compose up --build -d
```

### Production

```bash
# Démarrage avec le script automatique
./scripts/start-prod.sh

# Ou manuellement
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🏗️ Architecture des Services

### Services Docker Compose

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | Base de données PostgreSQL |
| `backend` | 3001 | API Python FastAPI |
| `frontend` | 5173 (dev) / 80 (prod) | Interface React/Vite |

### Volumes

- `postgres_data` : Données de la base PostgreSQL
- `backend_uploads` : Fichiers uploadés par le backend

## 🛠️ Commandes Utiles

### Gestion des Services

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Redémarrer un service
docker-compose restart backend

# Reconstruire un service
docker-compose up --build backend
```

### Gestion de la Base de Données

```bash
# Initialiser la base de données
./scripts/init-db.sh

# Accéder au conteneur PostgreSQL
docker-compose exec postgres psql -U kader -d genea

# Exécuter les migrations
docker-compose exec backend alembic upgrade head

# Créer une nouvelle migration
docker-compose exec backend alembic revision --autogenerate -m "Description"
```

### Debug et Développement

```bash
# Accéder au conteneur backend
docker-compose exec backend bash

# Accéder au conteneur frontend
docker-compose exec frontend sh

# Voir l'état des conteneurs
docker-compose ps

# Voir l'utilisation des ressources
docker stats
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données
POSTGRES_DB=genea
POSTGRES_USER=kader
POSTGRES_PASSWORD=votre_mot_de_passe_securise

# Backend
DATABASE_URL=postgresql://kader:votre_mot_de_passe_securise@postgres:5432/genea
JWT_SECRET_KEY=votre_cle_secrete_jwt_tres_securisee
ENVIRONMENT=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

⚠️ **Important** : En production, changez obligatoirement :
- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `ENVIRONMENT=production`

### Ports Personnalisés

Pour changer les ports, modifiez le `docker-compose.yml` :

```yaml
services:
  backend:
    ports:
      - "8001:3001"  # Port personnalisé
  frontend:
    ports:
      - "8080:5173"  # Port personnalisé
```

## 📱 Accès aux Services

Une fois démarré, accédez aux services :

### Développement
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **Documentation API** : http://localhost:3001/docs
- **Base de données** : localhost:5432

### Production
- **Application** : http://localhost
- **Backend API** : http://localhost:3001
- **Documentation API** : http://localhost:3001/docs

## 🐛 Dépannage

### Problèmes Courants

**Port déjà utilisé**
```bash
# Identifier le processus utilisant le port
sudo lsof -i :5173
# Ou changer le port dans docker-compose.yml
```

**Erreur de base de données**
```bash
# Vérifier que PostgreSQL est démarré
docker-compose logs postgres

# Redémarrer le service de base de données
docker-compose restart postgres
```

**Problème de permissions**
```bash
# Corriger les permissions des scripts
chmod +x scripts/*.sh
```

**Conteneur qui ne démarre pas**
```bash
# Voir les logs détaillés
docker-compose logs service_name

# Reconstruire complètement
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Nettoyage

```bash
# Arrêter et supprimer tous les conteneurs
docker-compose down

# Supprimer aussi les volumes (⚠️ perte de données)
docker-compose down -v

# Nettoyer les images inutilisées
docker system prune

# Nettoyage complet (⚠️ supprime tout)
docker system prune -a --volumes
```

## 🔄 Mise à Jour

```bash
# Arrêter les services
docker-compose down

# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose up --build -d

# Appliquer les migrations si nécessaire
docker-compose exec backend alembic upgrade head
```

## 📊 Monitoring

### Health Checks

Les services incluent des health checks automatiques :

```bash
# Vérifier l'état de santé
docker-compose ps
```

### Logs de Production

En production, configurez une rotation des logs :

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🚀 Déploiement

Pour déployer en production :

1. Clonez le repository sur le serveur
2. Configurez les variables d'environnement
3. Lancez `./scripts/start-prod.sh`
4. Configurez un reverse proxy (nginx) si nécessaire

Le projet est maintenant containerisé et prêt pour le déploiement ! 🎉
