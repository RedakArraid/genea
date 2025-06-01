#!/bin/bash

# 🚀 SCRIPT DE DÉMARRAGE RAPIDE GENEAIA
# Lance l'application après vérification de l'environnement

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet GeneaIA"
    exit 1
fi

print_header "🧬 DÉMARRAGE GENEAIA"

# Vérifications préalables
ERROR_COUNT=0

print_step "Vérification de Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installé"
else
    print_error "Node.js non installé"
    ((ERROR_COUNT++))
fi

print_step "Vérification de npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION installé"
else
    print_error "npm non installé"
    ((ERROR_COUNT++))
fi

print_step "Vérification de PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    if pg_isready >/dev/null 2>&1; then
        print_success "PostgreSQL installé et en cours d'exécution"
    else
        print_warning "PostgreSQL installé mais arrêté - tentative de démarrage..."
        # Essayer de démarrer PostgreSQL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql >/dev/null 2>&1
        else
            sudo systemctl start postgresql >/dev/null 2>&1
        fi
        
        sleep 2
        if pg_isready >/dev/null 2>&1; then
            print_success "PostgreSQL démarré avec succès"
        else
            print_error "Impossible de démarrer PostgreSQL"
            echo "  Essayez manuellement :"
            echo "  macOS: brew services start postgresql"
            echo "  Linux: sudo systemctl start postgresql"
            ((ERROR_COUNT++))
        fi
    fi
else
    print_error "PostgreSQL non installé"
    echo "  Installez PostgreSQL :"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt install postgresql postgresql-contrib"
    ((ERROR_COUNT++))
fi

print_step "Vérification des dépendances..."
if [ -d "node_modules" ] && [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
    print_success "Dépendances installées"
else
    print_warning "Dépendances manquantes - installation..."
    npm run setup
    if [ $? -eq 0 ]; then
        print_success "Dépendances installées avec succès"
    else
        print_error "Erreur lors de l'installation des dépendances"
        ((ERROR_COUNT++))
    fi
fi

print_step "Vérification de la configuration..."
if [ -f "backend/.env" ] && [ -f "frontend/.env" ]; then
    print_success "Fichiers de configuration présents"
else
    print_error "Fichiers de configuration manquants"
    echo "  Exécutez d'abord: ./auto-setup.sh"
    ((ERROR_COUNT++))
fi

print_step "Vérification de la base de données..."
if psql -U kader -d genea -c "\q" 2>/dev/null; then
    print_success "Base de données accessible"
else
    print_warning "Base de données non accessible - initialisation..."
    npm run db:init
    if [ $? -eq 0 ]; then
        print_success "Base de données initialisée avec succès"
    else
        print_error "Erreur lors de l'initialisation de la base de données"
        ((ERROR_COUNT++))
    fi
fi

print_step "Génération du client Prisma..."
cd backend
npx prisma generate >/dev/null 2>&1
cd ..
print_success "Client Prisma généré"

# Vérifier s'il y a des erreurs
if [ $ERROR_COUNT -gt 0 ]; then
    print_error "⚠️ $ERROR_COUNT erreur(s) détectée(s). Corrigez-les avant de continuer."
    exit 1
fi

print_header "🚀 DÉMARRAGE DE L'APPLICATION"

echo -e "${GREEN}🎉 Toutes les vérifications sont passées !${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de l'application :${NC}"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:3001"
echo "   API      : http://localhost:3001/api"
echo ""
echo -e "${BLUE}👤 Compte de test :${NC}"
echo "   Email    : test@example.com"
echo "   Password : password123"
echo ""
echo -e "${YELLOW}⚠️  Appuyez sur Ctrl+C pour arrêter l'application${NC}"
echo ""

# Démarrer l'application
npm run dev
