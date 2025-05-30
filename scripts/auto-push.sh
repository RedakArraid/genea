#!/bin/bash

# 🚀 Script de Push Automatique vers GitHub
# Usage: ./scripts/auto-push.sh [message de commit]

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[PUSH]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

# Message de commit par défaut ou fourni en paramètre
COMMIT_MESSAGE="${1:-Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')}"

log "🔍 Vérification de l'état du repository..."

# Vérifier si c'est un repo git
if [ ! -d ".git" ]; then
    log "📦 Initialisation du repository Git..."
    git init
    
    # Demander l'URL du repository
    read -p "Entrez l'URL de votre repository GitHub (ex: https://github.com/user/geneaia.git): " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        success "✅ Repository configuré: $REPO_URL"
    else
        warn "⚠️ Aucune URL fournie, vous devrez configurer le remote manuellement"
    fi
fi

# Vérifier s'il y a des modifications
if git diff --quiet && git diff --staged --quiet; then
    warn "⚠️ Aucune modification détectée"
    read -p "Voulez-vous forcer le push ? (y/N): " force_push
    if [[ ! "$force_push" =~ ^[Yy]$ ]]; then
        log "❌ Push annulé"
        exit 0
    fi
fi

log "📝 Préparation du commit..."

# Créer/mettre à jour le .gitignore
cat > .gitignore << 'EOF'
# Dépendances
node_modules/
backend/node_modules/
frontend/node_modules/

# Fichiers de build
backend/dist/
frontend/dist/
frontend/build/

# Fichiers d'environnement (secrets)
.env
.env.local
.env.production
backend/.env
frontend/.env

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Système d'exploitation
.DS_Store
.DS_Store?
._*
Thumbs.db

# Cache
.cache/
.npm/
.eslintcache

# Base de données locale
backend/prisma/*.db
backend/prisma/dev.db
*.db-journal

# PM2
.pm2/

# IDE
.vscode/
.idea/

# Uploads temporaires
uploads/
temp/

# Archives de déploiement (générées dynamiquement)
*.tar.gz
*.zip
EOF

log "📋 Ajout des fichiers au commit..."

# Ajouter tous les fichiers sauf ceux ignorés
git add .

# Vérifier qu'il y a quelque chose à committer
if git diff --staged --quiet; then
    warn "⚠️ Aucun fichier à committer après application du .gitignore"
    exit 0
fi

log "💾 Création du commit..."
git commit -m "$COMMIT_MESSAGE"

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "📍 Branche actuelle: $CURRENT_BRANCH"

# Demander confirmation avant le push
echo ""
log "📊 Résumé du push:"
echo "   Branche: $CURRENT_BRANCH"
echo "   Message: $COMMIT_MESSAGE"
echo "   Fichiers modifiés: $(git diff --name-only HEAD~1 2>/dev/null | wc -l | xargs)"
echo ""

read -p "Confirmer le push vers GitHub ? (Y/n): " confirm_push

if [[ "$confirm_push" =~ ^[Nn]$ ]]; then
    warn "⚠️ Push annulé par l'utilisateur"
    exit 0
fi

log "🚀 Push vers GitHub..."

# Tenter le push
if git push origin "$CURRENT_BRANCH"; then
    success "✅ Push réussi vers origin/$CURRENT_BRANCH"
    
    # Afficher l'URL du commit si possible
    if git remote get-url origin >/dev/null 2>&1; then
        REPO_URL=$(git remote get-url origin)
        COMMIT_HASH=$(git rev-parse HEAD)
        
        # Convertir URL SSH en URL web si nécessaire
        if [[ "$REPO_URL" =~ ^git@github\.com:(.+)\.git$ ]]; then
            WEB_URL="https://github.com/${BASH_REMATCH[1]}/commit/$COMMIT_HASH"
            echo ""
            log "🌐 Voir le commit: $WEB_URL"
        fi
    fi
    
else
    error "❌ Échec du push"
    
    # Vérifier si c'est un problème de remote non configuré
    if ! git remote get-url origin >/dev/null 2>&1; then
        warn "💡 Configurez d'abord le remote:"
        echo "   git remote add origin <URL_DE_VOTRE_REPO>"
    fi
    
    # Vérifier si c'est un problème de branche
    if [[ "$CURRENT_BRANCH" == "master" ]] || [[ "$CURRENT_BRANCH" == "main" ]]; then
        warn "💡 Pour la première fois, utilisez:"
        echo "   git push -u origin $CURRENT_BRANCH"
    fi
    
    exit 1
fi

# Hook post-push personnalisé
if [ -f "scripts/post-push.sh" ]; then
    log "🔗 Exécution du hook post-push..."
    chmod +x scripts/post-push.sh
    ./scripts/post-push.sh
fi

success "🎉 Déploiement automatique terminé !"

# Afficher les prochaines étapes
echo ""
log "📋 Prochaines étapes sur votre VPS:"
echo "   1. git pull origin $CURRENT_BRANCH"
echo "   2. ./scripts/vps-update.sh"
echo ""