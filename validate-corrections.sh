#!/bin/bash

# 🔧 Script de Validation Post-Correction - GeneaIA
# Vérifie que toutes les corrections ont été appliquées correctement

echo "🚀 Validation des corrections GeneaIA..."
echo "=================================================="

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
test_check() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -n "Vérification: $test_name... "
    
    if eval "$test_command" &>/dev/null; then
        if [ "$expected_result" = "success" ]; then
            echo "✅ PASS"
            ((TESTS_PASSED++))
        else
            echo "❌ FAIL (attendu: échec)"
            ((TESTS_FAILED++))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo "✅ PASS (échec attendu)"
            ((TESTS_PASSED++))
        else
            echo "❌ FAIL"
            ((TESTS_FAILED++))
        fi
    fi
}

# Fonction de vérification de contenu
check_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    echo -n "Vérification: $description... "
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo "✅ PASS"
        ((TESTS_PASSED++))
    else
        echo "❌ FAIL"
        ((TESTS_FAILED++))
    fi
}

echo "📁 Vérification des fichiers de configuration..."
echo "--------------------------------------------------"

# Test 1: URL Backend corrigée
check_content "frontend/.env" "VITE_API_URL=\"http://localhost:3001/api\"" "URL Backend corrigée"

# Test 2: Dockerfile.dev existe
test_check "Dockerfile.dev existe" "[ -f 'frontend/Dockerfile.dev' ]" "success"

# Test 3: Variables ENV nettoyées
check_content "frontend/.env" "# Variables commentées pour usage futur" "Variables ENV nettoyées"

# Test 4: Documentation mise à jour
check_content "README.md" "Backend API accessible sur" "Documentation mise à jour"

# Test 5: Base de données clarifiée
check_content "backend/.env" "# En développement Docker" "Base de données clarifiée"

echo ""
echo "🔍 Vérification du code source..."
echo "--------------------------------------------------"

# Test 6: Prop onAddParent ajoutée
check_content "frontend/src/pages/FamilyTreePage.jsx" "onAddParent={openAddModal}" "Prop onAddParent ajoutée"

# Test 7: Gestion d'erreurs améliorée
check_content "frontend/src/pages/FamilyTreePage.jsx" "}).catch((error) =>" "Gestion d'erreurs améliorée"

# Test 8: Commentaires mis à jour
check_content "frontend/src/components/FamilyTree/PersonNode.jsx" "Handles transparents" "Commentaires mis à jour"

# Test 9: Styles CSS optimisés
check_content "frontend/src/styles/FamilyTree.css" "/* .marriage-pulse" "Styles CSS optimisés"

echo ""
echo "📋 Vérification de la structure du projet..."
echo "--------------------------------------------------"

# Test 10: Guide de résolution créé
test_check "Guide de résolution existe" "[ -f 'RESOLUTION_INCOHERENCES.md' ]" "success"

# Test 11: Modifications documentées
check_content "MODIFICATIONS_GENEAIA.md" "Résolution des incohérences" "Modifications documentées"

echo ""
echo "🏗️ Tests de construction (simulation)..."
echo "--------------------------------------------------"

# Test 12: Package.json frontend valide
test_check "Package.json frontend valide" "[ -f 'frontend/package.json' ] && node -e 'JSON.parse(require(\"fs\").readFileSync(\"frontend/package.json\"))'" "success"

# Test 13: Package.json backend valide
test_check "Package.json backend valide" "[ -f 'backend/package.json' ] && node -e 'JSON.parse(require(\"fs\").readFileSync(\"backend/package.json\"))'" "success"

# Test 14: Docker-compose valide
test_check "Docker-compose syntaxe valide" "docker-compose config" "success"

echo ""
echo "📊 RÉSULTATS FINAUX"
echo "=================================================="
echo "Tests réussis: $TESTS_PASSED"
echo "Tests échoués: $TESTS_FAILED"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo "🎉 SUCCÈS COMPLET !"
    echo "Toutes les corrections ont été appliquées correctement."
    echo ""
    echo "🚀 Prochaines étapes recommandées :"
    echo "1. Tester le démarrage des services"
    echo "2. Valider les fonctionnalités en mode dev"
    echo "3. Vérifier Docker compose"
    echo ""
    echo "Commandes de test :"
    echo "cd frontend && npm run dev"
    echo "cd backend && npm run dev"
    echo "docker-compose up -d"
    
    exit 0
else
    echo ""
    echo "⚠️ ATTENTION !"
    echo "Certaines vérifications ont échoué."
    echo "Veuillez réviser les corrections."
    
    exit 1
fi
