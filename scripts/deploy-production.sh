#!/bin/bash

# 🚀 Script de Déploiement Production GeneaIA
# Déploiement complet avec vérifications et rollback

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Variables
DEPLOY_DIR="/var/www/geneaia"
BACKUP_DIR="/var/backups/geneaia"
DATE=$(date +%Y%m%d_%H%M%S)

log "🚀 Déploiement Production GeneaIA - $DATE"

# 1. Vérifications pré-déploiement
log "🔍 Vérifications pré-déploiement..."

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "$DEPLOY_DIR/package.json" ]; then
    error "❌ Pas dans le bon dossier de déploiement"
    exit 1
fi

cd $DEPLOY_DIR

# Vérifier Git
if [ ! -d ".git" ]; then
    error "❌ Repository Git non trouvé"
    exit 1
fi

# 2. Sauvegarde pré-déploiement
log "💾 Sauvegarde pré-déploiement..."

# Sauvegarde base de données
if command -v pg_dump >/dev/null 2>&1; then
    mkdir -p $BACKUP_DIR
    pg_dump -h localhost -U geneaia_user -d geneaia > "$BACKUP_DIR/pre_deploy_$DATE.sql"
    gzip "$BACKUP_DIR/pre_deploy_$DATE.sql"
    success "✅ Base de données sauvegardée"
fi

# Sauvegarde code actuel
git stash push -m "Pre-deploy backup $DATE" || true

# 3. Récupération du nouveau code
log "📥 Récupération du nouveau code..."
git pull origin main

# 4. Installation des dépendances
log "📦 Installation des dépendances..."

# Backend
cd backend
npm ci --production
npx prisma generate
cd ..

# Frontend
cd frontend
npm ci
npm run build
cd ..

# 5. Migrations base de données
log "🗄️ Migrations base de données..."
cd backend
npx prisma migrate deploy
cd ..

# 6. Tests rapides
log "🧪 Tests de validation..."

# Test build frontend
if [ ! -d "frontend/dist" ]; then
    error "❌ Build frontend échoué"
    exit 1
fi

# Test syntaxe backend
cd backend
node -c src/index.js || {
    error "❌ Erreur syntaxe backend"
    exit 1
}
cd ..

# 7. Arrêt des services
log "🛑 Arrêt des services..."
pm2 stop all

# 8. Démarrage des nouveaux services
log "🚀 Démarrage des services..."
pm2 start ecosystem.config.js --env production
pm2 save

# 9. Tests post-déploiement
log "🔍 Tests post-déploiement..."

sleep 5

# Test API
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    success "✅ API opérationnelle"
else
    error "❌ API ne répond pas"
    
    # Rollback automatique
    warn "🔄 Rollback automatique..."
    git reset --hard HEAD~1
    pm2 restart all
    exit 1
fi

# Test Frontend
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    success "✅ Frontend opérationnel"
else
    warn "⚠️ Frontend ne répond pas"
fi

# 10. Tests complets
log "🧪 Tests de validation complets..."

# Test des routes principales
ROUTES=("/health" "/api/health" "/")
for route in "${ROUTES[@]}"; do
    if curl -f "http://localhost:3001$route" >/dev/null 2>&1; then
        success "✅ Route $route OK"
    else
        warn "⚠️ Route $route ne répond pas"
    fi
done

# 11. Nettoyage
log "🧹 Nettoyage..."

# Nettoyer les anciens node_modules si besoin
find . -name "node_modules" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true

# 12. Monitoring post-déploiement
log "📊 Monitoring post-déploiement..."

echo ""
success "🎉 Déploiement terminé avec succès !"
echo ""

log "📊 Statut des services :"
pm2 status

echo ""
log "🌐 URLs de l'application :"
echo "   API Health   : http://localhost:3001/health"
echo "   Frontend     : http://localhost:8080"
if [ -n "${DOMAIN:-}" ]; then
    echo "   Production   : https://$DOMAIN"
fi

echo ""
log "📋 Informations de déploiement :"
echo "   Date         : $DATE"
echo "   Commit       : $(git rev-parse --short HEAD)"
echo "   Branche      : $(git rev-parse --abbrev-ref HEAD)"
echo "   Sauvegarde   : $BACKUP_DIR/pre_deploy_$DATE.sql.gz"

echo ""
log "📊 Surveillance recommandée :"
echo "   pm2 logs     # Logs en temps réel"
echo "   pm2 monit    # Monitoring interface"
echo "   make status  # Statut général"

echo ""
success "🎯 Production GeneaIA opérationnelle !"