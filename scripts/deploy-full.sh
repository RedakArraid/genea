#!/bin/bash

set -e

echo "🚀 Déploiement GeneaIA avec Mode Nuit"
echo "====================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Vérifications préalables
log_step "Vérification des prérequis..."

if ! command -v git &> /dev/null; then
    log_error "Git n'est pas installé"
    exit 1
fi

if ! git remote -v | grep -q origin; then
    log_error "Repository Git non configuré"
    exit 1
fi

# Vérifier si on est dans le bon dossier
if [[ ! -f "package.json" ]]; then
    log_error "Vous devez être dans le dossier racine du projet"
    exit 1
fi

# Mode de déploiement
DEPLOY_MODE=${1:-"staging"}

if [[ "$DEPLOY_MODE" != "staging" && "$DEPLOY_MODE" != "production" ]]; then
    log_error "Mode invalide: $DEPLOY_MODE (utilisez 'staging' ou 'production')"
    echo "Usage: $0 [staging|production] [message-commit]"
    exit 1
fi

log_info "Mode de déploiement: $DEPLOY_MODE"

# Statut Git
log_step "Vérification du statut Git..."
if [[ -n $(git status --porcelain) ]]; then
    log_info "Fichiers modifiés détectés, préparation du commit..."
    
    # Ajouter tous les fichiers modifiés
    git add .
    
    # Commit avec message automatique ou fourni
    COMMIT_MSG="🌙 Add dark mode toggle: $(date '+%Y-%m-%d %H:%M:%S')"
    if [[ -n "$2" ]]; then
        COMMIT_MSG="$2"
    fi
    
    git commit -m "$COMMIT_MSG" || log_warning "Rien à commiter"
    log_info "Commit créé: $COMMIT_MSG"
else
    log_info "Aucune modification détectée"
fi

# Déploiement selon le mode
if [[ "$DEPLOY_MODE" == "staging" ]]; then
    log_step "Préparation du déploiement staging..."
    
    # Créer ou basculer vers la branche staging
    if git rev-parse --verify staging >/dev/null 2>&1; then
        log_info "Branche staging existante, basculement..."
        git checkout staging
        git merge main
    else
        log_info "Création de la branche staging..."
        git checkout -b staging
    fi
    
    log_step "Push vers staging..."
    git push origin staging
    
    log_info "✅ Déploiement staging lancé!"
    
elif [[ "$DEPLOY_MODE" == "production" ]]; then
    log_step "Préparation du déploiement production..."
    
    # Vérifier que staging existe
    if ! git rev-parse --verify origin/staging >/dev/null 2>&1; then
        log_error "La branche staging n'existe pas. Déployez d'abord en staging."
        exit 1
    fi
    
    # Merger staging dans main
    git checkout main
    git merge staging
    
    log_step "Push vers production..."
    git push origin main
    
    log_info "✅ Déploiement production lancé!"
fi

# Informations utiles
echo ""
log_info "📊 Consultez GitHub Actions pour suivre le progrès:"
REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')
log_info "   $REPO_URL/actions"

echo ""
log_info "🌙 Fonctionnalités ajoutées:"
log_info "   ✅ Mode nuit (toggle simple)"
log_info "   ✅ Bouton toggle dans la navbar"
log_info "   ✅ Transitions fluides"
log_info "   ✅ Persistance des préférences"

echo ""
log_info "🎉 Déploiement terminé avec succès!"

# Ouvrir GitHub Actions si possible
sleep 2
if command -v open &> /dev/null; then
    open "$REPO_URL/actions"
elif command -v xdg-open &> /dev/null; then
    xdg-open "$REPO_URL/actions"
fi