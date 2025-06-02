#!/bin/bash

echo "🔍 Validation des corrections CI/CD"
echo "===================================="

cd "/Users/kader/Desktop/projet-en-cours/geneaIA"

# Fonction pour vérifier un fichier
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo "✅ $description : $file"
        return 0
    else
        echo "❌ $description : $file (MANQUANT)"
        return 1
    fi
}

# Fonction pour vérifier une ligne dans un fichier
check_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo "✅ $description"
        return 0
    else
        echo "❌ $description (MANQUANT dans $file)"
        return 1
    fi
}

echo ""
echo "📁 Vérification des fichiers principaux..."

# Vérifier les workflows
check_file ".github/workflows/deploy.yml" "Workflow principal"
check_file ".github/workflows/test-only.yml" "Workflow de tests (optionnel)"

# Vérifier les docker-compose
check_file "docker-compose.yml" "Docker-compose local"
check_file "docker-compose.staging.yml" "Docker-compose staging"
check_file "docker-compose.prod.yml" "Docker-compose production"

echo ""
echo "🔍 Vérification de la cohérence des noms d'images..."

# Vérifier les noms d'images dans les workflows
check_content ".github/workflows/deploy.yml" "ghcr.io/redakarraid/geneaia-backend" "Nom backend cohérent dans workflow"
check_content ".github/workflows/deploy.yml" "ghcr.io/redakarraid/geneaia-frontend" "Nom frontend cohérent dans workflow"

# Vérifier les noms d'images dans docker-compose
check_content "docker-compose.staging.yml" "ghcr.io/redakarraid/geneaia-backend:staging" "Nom backend cohérent en staging"
check_content "docker-compose.staging.yml" "ghcr.io/redakarraid/geneaia-frontend:staging" "Nom frontend cohérent en staging"

check_content "docker-compose.prod.yml" "ghcr.io/redakarraid/geneaia-backend:latest" "Nom backend cohérent en prod"
check_content "docker-compose.prod.yml" "ghcr.io/redakarraid/geneaia-frontend:latest" "Nom frontend cohérent en prod"

echo ""
echo "🌐 Vérification des URLs et ports..."

# Vérifier les ports staging
check_content "docker-compose.staging.yml" "3010:80" "Port frontend staging (3010)"
check_content "docker-compose.staging.yml" "3011:3001" "Port backend staging (3011)"

# Vérifier les URLs API
check_content "docker-compose.staging.yml" "http://168.231.86.179:3011/api" "URL API staging"
check_content "docker-compose.prod.yml" "http://168.231.86.179:8090/api" "URL API production"

# Vérifier les ports production
check_content "docker-compose.prod.yml" "8090:80" "Port production via Nginx (8090)"

echo ""
echo "🔐 Vérification de la sécurité..."

# Vérifier l'utilisation de variables d'environnement
check_content "docker-compose.staging.yml" "\${STAGING_DB_PASSWORD" "Variables sécurisées staging"
check_content "docker-compose.prod.yml" "\${PROD_DB_PASSWORD" "Variables sécurisées production"

# Vérifier les health checks
check_content "docker-compose.staging.yml" "healthcheck:" "Health checks staging"
check_content "docker-compose.prod.yml" "healthcheck:" "Health checks production"

echo ""
echo "🏗️ Vérification des workflows..."

# Vérifier les déclencheurs
check_content ".github/workflows/deploy.yml" "branches: \[ main, staging \]" "Déclencheurs corrects"

# Vérifier les jobs
check_content ".github/workflows/deploy.yml" "deploy-staging:" "Job staging"
check_content ".github/workflows/deploy.yml" "deploy-production:" "Job production"

# Vérifier les conditions
check_content ".github/workflows/deploy.yml" "if: github.ref == 'refs/heads/staging'" "Condition staging"
check_content ".github/workflows/deploy.yml" "if: github.ref == 'refs/heads/main'" "Condition production"

echo ""
echo "🗑️ Vérification de la suppression des fichiers obsolètes..."

# Vérifier que les anciens fichiers sont supprimés
if [ ! -f ".github/workflows/deploy-old.yml" ]; then
    echo "✅ deploy-old.yml supprimé"
else
    echo "❌ deploy-old.yml encore présent"
fi

if [ ! -f ".github/workflows/ci-cd.yml" ]; then
    echo "✅ ci-cd.yml supprimé (ou renommé)"
else
    echo "⚠️ ci-cd.yml encore présent (peut être gardé si voulu)"
fi

echo ""
echo "📊 Résumé de la validation..."

# Compter les succès et échecs
success_count=$(grep -c "✅" /tmp/validation_log 2>/dev/null || echo "0")
error_count=$(grep -c "❌" /tmp/validation_log 2>/dev/null || echo "0")

echo "✅ Vérifications réussies : À déterminer manuellement"
echo "❌ Problèmes détectés : À déterminer manuellement"

echo ""
echo "🎯 Recommandations finales :"
echo "   1. Configurer tous les secrets GitHub"
echo "   2. Tester un push sur staging pour valider le pipeline"
echo "   3. Vérifier que les images Docker se construisent"
echo "   4. Tester l'accès aux URLs de staging et production"

echo ""
echo "✨ Validation terminée !"

# Test rapide des images Docker si Docker est disponible
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Test rapide Docker (optionnel)..."
    docker images | grep geneaia | head -5 || echo "Aucune image geneaia locale trouvée"
fi
