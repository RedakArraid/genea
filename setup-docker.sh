#!/bin/bash

# Script de configuration rapide pour Docker
set -e

echo "🐳 Configuration Docker pour GeneaIA"
echo "======================================"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé."
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Vérifier Docker Compose
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé."
    echo "Installez Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << EOF
# Variables d'environnement pour Docker Compose
POSTGRES_DB=genea
POSTGRES_USER=kader
POSTGRES_PASSWORD=kader

# Backend Python
DATABASE_URL=postgresql://kader:kader@postgres:5432/genea
JWT_SECRET_KEY=dev-secret-key-for-local-development-only
ENVIRONMENT=development

# Frontend
VITE_API_URL=http://localhost:3001/api
EOF
    echo "✅ Fichier .env créé"
else
    echo "✅ Fichier .env existe déjà"
fi

echo ""
echo "🚀 Pour démarrer le projet:"
echo ""
echo "Développement:"
echo "  docker-compose up --build -d"
echo ""
echo "Production:"
echo "  docker-compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "📚 Consultez DOCKER_SETUP.md pour plus d'informations"
