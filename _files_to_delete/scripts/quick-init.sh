#!/bin/bash

# 🚀 Script d'initialisation rapide GeneaIA
# Configure le projet pour un premier déploiement

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[INIT]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               🚀 INITIALISATION GENEAIA 🚀                   ║${NC}"
echo -e "${BLUE}║              Configuration rapide du projet                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "❌ Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

step "1/6 🔧 Préparation des scripts"

# Rendre tous les scripts exécutables
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x Makefile 2>/dev/null || true

success "✅ Scripts rendus exécutables"

step "2/6 📁 Création des dossiers"

# Créer la structure de déploiement
mkdir -p deploy/logs
mkdir -p deploy/backups
mkdir -p deploy/configs
mkdir -p backend/uploads
mkdir -p frontend/public/uploads

success "✅ Structure de dossiers créée"

step "3/6 ⚙️ Configuration des environnements"

# Configuration backend
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        log "📄 backend/.env créé depuis .env.example"
    fi
    warn "⚠️ Configurez backend/.env avec vos paramètres"
else
    success "✅ backend/.env existe déjà"
fi

# Configuration frontend
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        log "📄 frontend/.env créé depuis .env.example"
    fi
    warn "⚠️ Configurez frontend/.env avec vos paramètres"
else
    success "✅ frontend/.env existe déjà"
fi

success "✅ Fichiers d'environnement configurés"

step "4/6 📦 Installation des dépendances"

# Installation racine
if [ ! -d "node_modules" ]; then
    log "📦 Installation des dépendances principales..."
    npm install
fi

# Installation backend
if [ ! -d "backend/node_modules" ]; then
    log "📦 Installation des dépendances backend..."
    cd backend && npm install
    
    # Génération Prisma si schéma existe
    if [ -f "prisma/schema.prisma" ]; then
        log "🗄️ Génération du client Prisma..."
        npx prisma generate
    fi
    cd ..
fi

# Installation frontend
if [ ! -d "frontend/node_modules" ]; then
    log "📦 Installation des dépendances frontend..."
    cd frontend && npm install
    cd ..
fi

success "✅ Toutes les dépendances installées"

step "5/6 🔗 Configuration Git"

# Initialiser Git si nécessaire
if [ ! -d ".git" ]; then
    log "📋 Initialisation du repository Git..."
    git init
    
    # Configurer l'utilisateur si pas déjà fait
    if ! git config user.name >/dev/null 2>&1; then
        read -p "Nom d'utilisateur Git: " git_name
        git config user.name "$git_name"
    fi
    
    if ! git config user.email >/dev/null 2>&1; then
        read -p "Email Git: " git_email
        git config user.email "$git_email"
    fi
fi

# Configurer le remote si nécessaire
if ! git remote get-url origin >/dev/null 2>&1; then
    echo ""
    log "🔗 Configuration du repository GitHub..."
    echo "Exemples d'URLs GitHub :"
    echo "  HTTPS: https://github.com/username/geneaia.git"
    echo "  SSH:   git@github.com:username/geneaia.git"
    echo ""
    read -p "URL de votre repository GitHub (optionnel): " repo_url
    
    if [ -n "$repo_url" ]; then
        git remote add origin "$repo_url"
        success "✅ Remote GitHub configuré"
    else
        warn "⚠️ Repository non configuré (vous pourrez le faire plus tard)"
    fi
fi

success "✅ Git configuré"

step "6/6 🔍 Validation finale"

# Lancer la validation
log "🔍 Validation de la configuration..."
if ./scripts/validate-deploy.sh; then
    success "✅ Configuration valide"
else
    warn "⚠️ Des problèmes ont été détectés, voir ci-dessus"
fi

# Résumé final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                ✅ INITIALISATION TERMINÉE !                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

success "🎉 GeneaIA initialisé avec succès !"

echo ""
log "📋 Prochaines étapes :"
echo ""
echo "   1. 📝 Configurez vos fichiers .env :"
echo "      • backend/.env  (base de données, JWT, etc.)"
echo "      • frontend/.env (URL API, configuration UI)"
echo ""
echo "   2. 🗄️ Configurez votre base de données :"
echo "      • Créez une base PostgreSQL"
echo "      • Mettez à jour DATABASE_URL dans backend/.env"
echo "      • Lancez: cd backend && npx prisma migrate dev"
echo ""
echo "   3. 🚀 Premier déploiement :"
echo "      • make dev          # Test en local"
echo "      • make push         # Push vers GitHub"
echo ""
echo "   4. 🌐 Configuration VPS (après push) :"
echo "      • Clonez sur votre VPS: git clone <votre-repo>"
echo "      • Configurez les .env sur le VPS"
echo "      • Lancez: make vps-setup"
echo ""

log "🔧 Commandes disponibles :"
echo "   make help            # Voir toutes les commandes"
echo "   make dev             # Développement local"
echo "   make test            # Tests"
echo "   make push            # Push vers GitHub"
echo "   make vps-update      # Mise à jour VPS"
echo "   make status          # Statut des services"
echo ""

log "📚 Documentation :"
echo "   deploy/README.md     # Guide de déploiement"
echo "   deploy/VPS-SETUP.md  # Configuration VPS détaillée"
echo ""

warn "⚠️ N'oubliez pas de :"
echo "   • Configurer vos fichiers .env avec vos vraies données"
echo "   • Tester en local avant de déployer"
echo "   • Configurer les secrets GitHub pour le CI/CD automatique"

echo ""
success "🎯 Votre projet GeneaIA est maintenant prêt pour le développement et le déploiement !"

echo ""
log "💡 Aide supplémentaire :"
echo "   • Documentation: https://github.com/votre-username/geneaia/wiki"
echo "   • Issues: https://github.com/votre-username/geneaia/issues"
echo "   • Discussions: https://github.com/votre-username/geneaia/discussions"

echo ""
success "🎊 Bon développement avec GeneaIA !"