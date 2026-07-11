#!/bin/bash

# 🛑 Script d'arrêt pour geneamap
# Usage: ./stop-dev.sh

set -e

echo "🛑 Arrêt de l'environnement de développement geneamap..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Demander le type d'arrêt
echo -e "${YELLOW}Options d'arrêt:${NC}"
echo "1. Arrêt simple (garde les données)"
echo "2. Arrêt avec nettoyage des volumes (supprime les données)"
echo "3. Arrêt complet avec nettoyage du système Docker"
echo

read -p "$(echo -e "${YELLOW}Choisissez une option (1-3, défaut: 1):${NC} ")" -n 1 -r
echo

option=${REPLY:-1}

case $option in
    1)
        print_status "Arrêt simple des containers..."
        docker-compose down
        print_success "Containers arrêtés (données conservées)"
        ;;
    2)
        print_warning "Arrêt avec suppression des volumes (données supprimées)..."
        read -p "$(echo -e "${RED}Êtes-vous sûr? Cela supprimera toutes les données! (y/N):${NC} ")" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            print_success "Containers et volumes supprimés"
        else
            print_status "Arrêt annulé"
            exit 0
        fi
        ;;
    3)
        print_warning "Arrêt complet avec nettoyage du système Docker..."
        read -p "$(echo -e "${RED}Êtes-vous sûr? Cela nettoiera tout le système Docker! (y/N):${NC} ")" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker system prune -f
            print_success "Nettoyage complet effectué"
        else
            print_status "Arrêt annulé"
            exit 0
        fi
        ;;
    *)
        print_warning "Option invalide, arrêt simple par défaut"
        docker-compose down
        print_success "Containers arrêtés (données conservées)"
        ;;
esac

echo
print_success "🎉 Arrêt terminé!"
echo
echo -e "${YELLOW}💡 Pour redémarrer:${NC}"
echo -e "   ${BLUE}./start-dev.sh${NC} ou ${BLUE}docker-compose up -d${NC}"
