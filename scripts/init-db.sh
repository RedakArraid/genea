#!/bin/bash

# Script d'initialisation de la base de données
set -e

echo "🗄️ Initialisation de la base de données GeneaIA..."

# Vérifier que Docker Compose est en cours d'exécution
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Docker Compose n'est pas en cours d'exécution."
    echo "Démarrez d'abord les services avec: ./scripts/start-dev.sh"
    exit 1
fi

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
docker-compose exec postgres pg_isready -U kader -d genea

# Exécuter les migrations Alembic
echo "🔄 Exécution des migrations de base de données..."
docker-compose exec backend alembic upgrade head

echo "✅ Base de données initialisée avec succès!"
echo ""
echo "Pour créer une nouvelle migration:"
echo "  docker-compose exec backend alembic revision --autogenerate -m 'Description'"
echo ""
echo "Pour appliquer les migrations:"
echo "  docker-compose exec backend alembic upgrade head"
