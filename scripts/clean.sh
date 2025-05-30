#!/bin/bash

# 🧹 Script de Nettoyage GeneaIA
# Nettoie les fichiers temporaires et réinitialise certains éléments

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[CLEAN]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${BLUE}🧹 NETTOYAGE GENEAIA${NC}"
echo "==================="
echo ""

# Menu de sélection
echo "Que voulez-vous nettoyer ?"
echo ""
echo "1) 📦 node_modules uniquement"
echo "2) 🏗️ Builds et cache"
echo "3) 📋 Logs et temporaires"
echo "4) 🔄 Reset complet (tout sauf .env et .git)"
echo "5) 🚫 Annuler"
echo ""

read -p "Votre choix (1-5): " choice

case $choice in
    1)
        log "🧹 Nettoyage des node_modules..."
        rm -rf node_modules
        rm -rf backend/node_modules
        rm -rf frontend/node_modules
        success "✅ node_modules supprimés"
        ;;
    2)
        log "🧹 Nettoyage des builds et cache..."
        rm -rf frontend/dist
        rm -rf frontend/build
        rm -rf backend/dist
        rm -rf .next
        find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
        find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
        success "✅ Builds et cache nettoyés"
        ;;
    3)
        log "🧹 Nettoyage des logs et fichiers temporaires..."
        rm -rf deploy/logs/*
        rm -rf backend/uploads/*
        find . -name "*.log" -delete 2>/dev/null || true
        find . -name "*.tmp" -delete 2>/dev/null || true
        find . -name ".DS_Store" -delete 2>/dev/null || true
        success "✅ Logs et temporaires nettoyés"
        ;;
    4)
        warn "⚠️ Reset complet - Cette action va supprimer :"
        echo "   • Tous les node_modules"
        echo "   • Tous les builds"
        echo "   • Tous les logs"
        echo "   • Le cache"
        echo "   • Les uploads"
        echo ""
        echo "Les fichiers .env et .git seront conservés."
        echo ""
        read -p "Êtes-vous sûr ? (y/N): " confirm
        
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            log "🧹 Reset complet en cours..."
            
            # Node modules
            rm -rf node_modules
            rm -rf backend/node_modules
            rm -rf frontend/node_modules
            
            # Builds
            rm -rf frontend/dist
            rm -rf frontend/build
            rm -rf backend/dist
            
            # Logs et temporaires
            rm -rf deploy/logs/*
            rm -rf backend/uploads/*
            find . -name "*.log" -delete 2>/dev/null || true
            find . -name "*.tmp" -delete 2>/dev/null || true
            find . -name ".DS_Store" -delete 2>/dev/null || true
            find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
            
            # Cache divers
            rm -rf .npm
            rm -rf .yarn
            
            success "✅ Reset complet terminé"
            echo ""
            warn "📋 Pour redémarrer :"
            echo "   1. npm install"
            echo "   2. cd backend && npm install"
            echo "   3. cd ../frontend && npm install"
            echo "   4. make dev"
        else
            log "❌ Reset annulé"
        fi
        ;;
    5)
        log "❌ Nettoyage annulé"
        exit 0
        ;;
    *)
        error "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
success "🎉 Nettoyage terminé !"
echo ""

# Afficher la taille libérée (approximative)
log "💾 Espace potentiellement libéré"
echo ""

# Vérifier si les dossiers existent encore
if [ ! -d "node_modules" ]; then
    echo "   ✅ node_modules supprimés"
fi

if [ ! -d "backend/node_modules" ]; then
    echo "   ✅ backend/node_modules supprimés"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "   ✅ frontend/node_modules supprimés"
fi

if [ ! -d "frontend/dist" ]; then
    echo "   ✅ frontend/dist supprimé"
fi

echo ""
log "🔄 Pour réinstaller les dépendances :"
echo "   make install    # ou"
echo "   npm install && cd backend && npm install && cd ../frontend && npm install"