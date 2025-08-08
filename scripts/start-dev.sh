#!/bin/bash

# Script de démarrage pour le développement avec Docker Compose
set -e

echo "🚀 Démarrage de l'environnement de développement GeneaIA..."

# Vérifier que Docker et Docker Compose sont installés
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire et démarrer les services
echo "🔨 Construction et démarrage des services..."
docker-compose up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 10

# Vérifier l'état des services
echo "📊 État des services:"
docker-compose ps

echo ""
echo "✅ Environnement de développement démarré!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "📚 API Documentation: http://localhost:3001/docs"
echo "🗄️ Base de données: localhost:5432"
echo ""
echo "Pour voir les logs:"
echo "  docker-compose logs -f"
echo ""
echo "Pour arrêter:"
echo "  docker-compose down"
