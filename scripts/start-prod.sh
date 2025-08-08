#!/bin/bash

# Script de démarrage pour la production avec Docker Compose
set -e

echo "🚀 Démarrage de l'environnement de production GeneaIA..."

# Vérifier que Docker et Docker Compose sont installés
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Vérifier que les variables d'environnement critiques sont définies
if [ -z "$JWT_SECRET_KEY" ] || [ "$JWT_SECRET_KEY" = "production-secret-change-me" ]; then
    echo "⚠️  ATTENTION: JWT_SECRET_KEY n'est pas défini ou utilise la valeur par défaut!"
    echo "Définissez une clé secrète sécurisée dans votre fichier .env"
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

# Construire et démarrer les services
echo "🔨 Construction et démarrage des services de production..."
docker-compose -f docker-compose.prod.yml up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 15

# Exécuter les migrations de base de données
echo "🗄️ Exécution des migrations de base de données..."
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Vérifier l'état des services
echo "📊 État des services:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Environnement de production démarré!"
echo "🌐 Application: http://localhost"
echo "🔧 Backend API: http://localhost:3001"
echo "📚 API Documentation: http://localhost:3001/docs"
echo ""
echo "Pour voir les logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Pour arrêter:"
echo "  docker-compose -f docker-compose.prod.yml down"
