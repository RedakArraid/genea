#!/bin/bash

# 🚀 Script de démarrage rapide pour geneamap
# Usage: ./start-dev.sh

set -e

echo "🚀 Démarrage de l'environnement de développement geneamap..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
print_status "Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez l'installer: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez l'installer."
    exit 1
fi

print_success "Prérequis vérifiés ✅"

# Vérifier les fichiers de configuration
print_status "Vérification des fichiers de configuration..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    print_warning "Fichier backend/.env manquant, création à partir de .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_success "Fichier backend/.env créé"
    else
        print_error "Fichier backend/.env.example introuvable"
        exit 1
    fi
else
    print_success "Fichier backend/.env existe"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    print_warning "Fichier frontend/.env manquant, création à partir de .env.example..."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        print_success "Fichier frontend/.env créé"
    else
        print_error "Fichier frontend/.env.example introuvable"
        exit 1
    fi
else
    print_success "Fichier frontend/.env existe"
fi

# Arrêter les containers existants
print_status "Arrêt des containers existants..."
docker-compose down > /dev/null 2>&1 || true

# Démarrer les services
print_status "Démarrage des services Docker..."
docker-compose up -d

# Attendre que PostgreSQL soit prêt
print_status "Attente de PostgreSQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec geneamap-db-local-v2 pg_isready -U geneamap_user -d geneamap_local &> /dev/null; then
        print_success "PostgreSQL est prêt!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL n'est pas prêt après $max_attempts tentatives"
        print_error "Vérifiez les logs: docker-compose logs postgres"
        exit 1
    fi
    
    echo -e "   Tentative $attempt/$max_attempts..."
    sleep 2
    ((attempt++))
done

# Initialiser la base de données
print_status "Initialisation de la base de données..."

print_status "Génération du client Prisma..."
docker exec geneamap-backend-local-v2 npx prisma generate

print_status "Exécution des migrations..."
docker exec geneamap-backend-local-v2 npx prisma migrate deploy

# Optionnel: Ajouter des données de test
read -p "$(echo -e "${YELLOW}Voulez-vous ajouter des données de test? (y/N):${NC} ")" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Ajout des données de test..."
    docker exec geneamap-backend-local-v2 npx prisma db seed || print_warning "Échec du seeding (pas de script seed ou données déjà présentes)"
fi

# Attendre que le backend soit prêt
print_status "Vérification de l'état des services..."
sleep 10

# Tests de santé
print_status "Tests de santé..."

# Test PostgreSQL
if docker exec geneamap-db-local-v2 psql -U geneamap_user -d geneamap_local -c "SELECT 1;" &> /dev/null; then
    print_success "✅ PostgreSQL: OK"
else
    print_error "❌ PostgreSQL: ÉCHEC"
fi

# Test Backend
if curl -s -f http://localhost:3001/health &> /dev/null; then
    print_success "✅ Backend API: OK"
else
    print_warning "⚠️ Backend API: En cours de démarrage..."
    sleep 5
    if curl -s -f http://localhost:3001/health &> /dev/null; then
        print_success "✅ Backend API: OK (après attente)"
    else
        print_warning "⚠️ Backend API: Vérifiez http://localhost:3001/health"
    fi
fi

# Test Frontend
if curl -s -f http://localhost:5173 &> /dev/null; then
    print_success "✅ Frontend: OK"
else
    print_warning "⚠️ Frontend: En cours de démarrage..."
    sleep 5
    if curl -s -f http://localhost:5173 &> /dev/null; then
        print_success "✅ Frontend: OK (après attente)"
    else
        print_warning "⚠️ Frontend: Vérifiez http://localhost:5173"
    fi
fi

echo
print_success "🎉 Environnement de développement démarré avec succès!"
echo
echo -e "${GREEN}📱 URLs disponibles:${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "   Backend:  ${BLUE}http://localhost:3001/api${NC}"
echo -e "   Health:   ${BLUE}http://localhost:3001/health${NC}"
echo
echo -e "${YELLOW}📚 Commandes utiles:${NC}"
echo -e "   Logs:           ${BLUE}docker-compose logs -f${NC}"
echo -e "   Arrêter:        ${BLUE}docker-compose down${NC}"
echo -e "   Redémarrer:     ${BLUE}docker-compose restart${NC}"
echo -e "   Reconstruire:   ${BLUE}docker-compose up --build${NC}"
echo
echo -e "${GREEN}✨ Bon développement!${NC}"
