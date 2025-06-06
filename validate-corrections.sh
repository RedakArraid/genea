#!/bin/bash

# Script de validation automatique des corrections GeneaIA
# Ce script vérifie que les corrections appliquées fonctionnent correctement

set -e  # Arrête le script en cas d'erreur

echo "🚀 Validation des corrections GeneaIA"
echo "===================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Test 1: Vérification de la structure des fichiers
echo -e "\n${YELLOW}1. Vérification de la structure des fichiers${NC}"

# Vérifier que les fichiers critiques existent
test -f "backend/src/lib/prisma.js" && print_result 0 "Module Prisma central créé" || print_result 1 "Module Prisma central manquant"
test -f "backend/.env.example" && print_result 0 "Fichier .env.example backend créé" || print_result 1 "Fichier .env.example backend manquant"
test -f "frontend/.env.example" && print_result 0 "Fichier .env.example frontend créé" || print_result 1 "Fichier .env.example frontend manquant"
test -f "package.json" && print_result 0 "Package.json racine créé" || print_result 1 "Package.json racine manquant"
test -f "backend/src/middleware/person.middleware.js" && print_result 0 "Middleware de sécurité créé" || print_result 1 "Middleware de sécurité manquant"

# Test 2: Vérification des imports Prisma
echo -e "\n${YELLOW}2. Vérification des imports Prisma dans les contrôleurs${NC}"

check_prisma_import() {
    if grep -q "require('../lib/prisma')" "$1"; then
        print_result 0 "Import Prisma correct dans $(basename $1)"
    else
        print_result 1 "Import Prisma manquant dans $(basename $1)"
    fi
}

check_prisma_import "backend/src/controllers/auth.controller.js"
check_prisma_import "backend/src/controllers/familyTree.controller.js"
check_prisma_import "backend/src/controllers/person.controller.js"
check_prisma_import "backend/src/controllers/relationship.controller.js"

# Test 3: Vérification de la configuration Vite
echo -e "\n${YELLOW}3. Vérification de la configuration Vite${NC}"

if grep -q "rewrite.*replace" "frontend/vite.config.js"; then
    print_result 1 "Configuration proxy Vite incorrecte (rewrite présent)"
else
    print_result 0 "Configuration proxy Vite corrigée"
fi

# Test 4: Vérification du package.json backend
echo -e "\n${YELLOW}4. Vérification des scripts backend${NC}"

if grep -q '"dev": "nodemon' "backend/package.json"; then
    print_result 0 "Script dev backend utilise nodemon"
else
    print_result 1 "Script dev backend n'utilise pas nodemon"
fi

# Test 5: Vérification des middlewares de sécurité
echo -e "\n${YELLOW}5. Vérification des middlewares de sécurité${NC}"

if grep -q "canAccessPerson" "backend/src/routes/person.routes.js"; then
    print_result 0 "Middleware de sécurité appliqué aux routes person"
else
    print_result 1 "Middleware de sécurité manquant sur les routes person"
fi

if grep -q "canCreateRelationship" "backend/src/routes/relationship.routes.js"; then
    print_result 0 "Middleware de sécurité appliqué aux routes relationship"
else
    print_result 1 "Middleware de sécurité manquant sur les routes relationship"
fi

# Test 6: Vérification de la simplification du seed
echo -e "\n${YELLOW}6. Vérification de la simplification du fichier seed${NC}"

# Compter le nombre de relations dans le seed
relation_count=$(grep -c "prisma.relationship.create" "backend/prisma/seed.js" || echo "0")

if [ "$relation_count" -le 15 ]; then
    print_result 0 "Fichier seed simplifié (${relation_count} relations au lieu de >30)"
else
    print_result 1 "Fichier seed pas assez simplifié (${relation_count} relations)"
fi

# Test 7: Vérification des dépendances
echo -e "\n${YELLOW}7. Vérification des dépendances${NC}"

if [ -f "backend/node_modules/.package-lock.json" ] || [ -f "backend/package-lock.json" ]; then
    print_result 0 "Dépendances backend installées"
else
    print_result 1 "Dépendances backend non installées"
fi

if [ -f "frontend/node_modules/.package-lock.json" ] || [ -f "frontend/package-lock.json" ]; then
    print_result 0 "Dépendances frontend installées"
else
    print_result 1 "Dépendances frontend non installées"
fi

# Test 8: Test de démarrage rapide (si possible)
echo -e "\n${YELLOW}8. Test de syntaxe des fichiers principaux${NC}"

# Test de syntaxe JavaScript
if node -c "backend/src/index.js" 2>/dev/null; then
    print_result 0 "Syntaxe backend/src/index.js valide"
else
    print_result 1 "Erreur de syntaxe dans backend/src/index.js"
fi

if node -c "backend/src/lib/prisma.js" 2>/dev/null; then
    print_result 0 "Syntaxe backend/src/lib/prisma.js valide"
else
    print_result 1 "Erreur de syntaxe dans backend/src/lib/prisma.js"
fi

# Résumé
echo -e "\n${YELLOW}📊 Résumé de la validation${NC}"
echo "=================================="

# Compter les tests réussis vs échoués en relançant les vérifications
total_tests=0
passed_tests=0

# Fonction pour compter les tests
count_test() {
    total_tests=$((total_tests + 1))
    if [ $1 -eq 0 ]; then
        passed_tests=$((passed_tests + 1))
    fi
}

# Recompter rapidement (version silencieuse)
test -f "backend/src/lib/prisma.js" && count_test 0 || count_test 1
test -f "backend/.env.example" && count_test 0 || count_test 1
test -f "frontend/.env.example" && count_test 0 || count_test 1
test -f "package.json" && count_test 0 || count_test 1
test -f "backend/src/middleware/person.middleware.js" && count_test 0 || count_test 1

grep -q "require('../lib/prisma')" "backend/src/controllers/auth.controller.js" && count_test 0 || count_test 1
grep -q "require('../lib/prisma')" "backend/src/controllers/familyTree.controller.js" && count_test 0 || count_test 1
grep -q "require('../lib/prisma')" "backend/src/controllers/person.controller.js" && count_test 0 || count_test 1

grep -q "rewrite.*replace" "frontend/vite.config.js" && count_test 1 || count_test 0
grep -q '"dev": "nodemon' "backend/package.json" && count_test 0 || count_test 1

echo "Tests réussis: ${passed_tests}/${total_tests}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 Toutes les corrections ont été appliquées avec succès !${NC}"
    echo -e "${GREEN}Le projet GeneaIA est prêt pour le développement.${NC}"
    exit 0
else
    failed_tests=$((total_tests - passed_tests))
    echo -e "${RED}⚠️  ${failed_tests} test(s) ont échoué.${NC}"
    echo -e "${YELLOW}Veuillez vérifier les corrections ci-dessus.${NC}"
    exit 1
fi
