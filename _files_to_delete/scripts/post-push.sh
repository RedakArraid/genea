#!/bin/bash

# 🔗 Script Post-Push GeneaIA
# Exécuté automatiquement après chaque push réussi

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[POST-PUSH]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[INFO]${NC} $1"; }

log "🔗 Exécution du hook post-push..."

# Créer un fichier de log du déploiement
DEPLOY_LOG="deploy/logs/deploy-$(date '+%Y%m%d_%H%M%S').log"
mkdir -p deploy/logs

{
    echo "=== DÉPLOIEMENT GENEAIA ==="
    echo "Date: $(date)"
    echo "Commit: $(git rev-parse HEAD)"
    echo "Branche: $(git rev-parse --abbrev-ref HEAD)"
    echo "Utilisateur: $(git config user.name)"
    echo "Message: $(git log -1 --pretty=%B)"
    echo "=========================="
} > "$DEPLOY_LOG"

# Créer un résumé des changements
if [ -f "CHANGELOG.md" ]; then
    log "📝 Mise à jour du changelog..."
    {
        echo ""
        echo "## $(date '+%Y-%m-%d %H:%M:%S') - Commit $(git rev-parse --short HEAD)"
        echo ""
        git log -1 --pretty="- %s"
        echo ""
        echo "### Fichiers modifiés:"
        git diff --name-only HEAD~1 | sed 's/^/- /'
        echo ""
        cat CHANGELOG.md
    } > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
else
    log "📝 Création du changelog initial..."
    {
        echo "# 📋 Changelog GeneaIA"
        echo ""
        echo "## $(date '+%Y-%m-%d %H:%M:%S') - Commit $(git rev-parse --short HEAD)"
        echo ""
        git log -1 --pretty="- %s"
        echo ""
    } > CHANGELOG.md
fi

# Créer/mettre à jour le fichier de statut du déploiement
cat > deploy/deploy-status.json << EOF
{
  "last_deploy": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "commit_hash": "$(git rev-parse HEAD)",
  "commit_short": "$(git rev-parse --short HEAD)",
  "branch": "$(git rev-parse --abbrev-ref HEAD)",
  "author": "$(git config user.name)",
  "message": "$(git log -1 --pretty=%B | head -1)",
  "status": "pushed",
  "files_changed": $(git diff --name-only HEAD~1 | wc -l | xargs),
  "environment": "development"
}
EOF

# Afficher les informations de déploiement
echo ""
warn "📊 Informations de déploiement :"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Branche: $(git rev-parse --abbrev-ref HEAD)"
echo "   Fichiers modifiés: $(git diff --name-only HEAD~1 | wc -l | xargs)"
echo "   Log sauvegardé: $DEPLOY_LOG"
echo ""

# Suggestions d'actions VPS
warn "🌐 Prochaines étapes sur votre VPS :"
echo "   1. Connexion SSH à votre VPS"
echo "   2. cd /chemin/vers/geneaia"
echo "   3. git pull"
echo "   4. make vps-update"
echo ""

# Optionnel : Notification Slack/Discord si configuré
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    log "📢 Envoi de notification Slack..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 GeneaIA déployé: \`$(git rev-parse --short HEAD)\` sur \`$(git rev-parse --abbrev-ref HEAD)\`\"}" \
        "$SLACK_WEBHOOK_URL" || warn "⚠️ Échec notification Slack"
fi

success "✅ Hook post-push terminé"