#!/bin/bash

# 🧪 SCRIPT DE TEST RAPIDE DE L'INSTALLATION GENEAIA

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}🔍 Test: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Structure du projet
print_test "Structure du projet"
if [ -f "package.json" ] && [ -d "backend" ] && [ -d "frontend" ]; then
    print_success "Structure du projet correcte"
else
    print_error "Structure du projet incorrecte"
    exit 1
fi

# Test 2: Node.js et npm
print_test "Node.js et npm"
if command -v npm >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installé"
else
    print_error "Node.js/npm non installé"
fi

# Test 3: PostgreSQL
print_test "PostgreSQL"
if command -v psql >/dev/null 2>&1; then
    if pg_isready >/dev/null 2>&1; then
        print_success "PostgreSQL installé et en cours d'exécution"
    else
        print_error "PostgreSQL installé mais arrêté - démarrez-le"
    fi
else
    print_error "PostgreSQL non installé"
fi

# Test 4: Fichiers de configuration
print_test "Fichiers de configuration"
if [ -f "backend/.env" ] && [ -f "frontend/.env" ]; then
    print_success "Fichiers de configuration présents"
else
    print_error "Fichiers de configuration manquants"
fi

# Test 5: Dépendances installées
print_test "Dépendances"
if [ -d "node_modules" ] && [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
    print_success "Dépendances installées"
else
    print_error "Dépendances manquantes - exécutez npm run setup"
fi

# Test 6: Base de données
print_test "Base de données"
if psql -U kader -d genea -c "\q" 2>/dev/null; then
    print_success "Base de données accessible"
else
    print_error "Base de données non accessible - exécutez npm run db:init"
fi

echo ""
echo "🎯 Résumé des tests terminé !"
echo "Si tous les tests sont verts, vous pouvez démarrer avec : npm run dev"
