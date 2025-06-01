#!/bin/bash

# 🚀 Script de Mise à Jour VPS GeneaIA
# À exécuter sur le VPS après un git pull

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[VPS-UPDATE]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                🚀 GENEAIA VPS UPDATE SCRIPT 🚀               ║"
echo "║              Mise à jour automatique sur VPS                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

# Vérifier l'environnement
step "1/7 🔍 Vérification de l'environnement..."

if ! command -v node >/dev/null 2>&1; then
    error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    error "npm n'est pas installé"  
    exit 1
fi

success "✅ Node.js $(node --version) et npm $(npm --version) disponibles"

# Vérifier PostgreSQL
if command -v psql >/dev/null 2>&1; then
    success "✅ PostgreSQL CLI disponible"
else
    warn "⚠️ PostgreSQL CLI non trouvé, vérifiez que PostgreSQL est installé"
fi

# Arrêter les services en cours si PM2 est disponible
step "2/7 🛑 Arrêt des services..."

if command -v pm2 >/dev/null 2>&1; then
    log "Arrêt des processus PM2..."
    pm2 stop geneaia-backend 2>/dev/null || true
    pm2 stop geneaia-frontend 2>/dev/null || true
    success "✅ Services PM2 arrêtés"
else
    warn "⚠️ PM2 non disponible, arrêt manuel requis"
fi

# Sauvegarde de la configuration actuelle
step "3/7 💾 Sauvegarde de la configuration..."

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "backend/.env" ]; then
    cp backend/.env "$BACKUP_DIR/backend.env.backup"
    success "✅ Configuration backend sauvegardée"
fi

if [ -f "frontend/.env" ]; then
    cp frontend/.env "$BACKUP_DIR/frontend.env.backup"
    success "✅ Configuration frontend sauvegardée"
fi

# Installation/Mise à jour des dépendances backend
step "4/7 📦 Mise à jour du backend..."

cd backend

log "Installation des dépendances backend..."
npm install --production

log "Génération du client Prisma..."
npx prisma generate

success "✅ Backend mis à jour"
cd ..

# Installation/Mise à jour des dépendances frontend  
step "5/7 🎨 Mise à jour du frontend..."

cd frontend

log "Installation des dépendances frontend..."
npm install

# Vérifier si les fichiers de configuration existent
if [ ! -f ".env" ]; then
    warn "⚠️ Fichier .env frontend manquant"
    if [ -f ".env.example" ]; then
        log "Copie du fichier .env.example..."
        cp .env.example .env
        warn "⚠️ Configurez frontend/.env avec vos paramètres"
    fi
fi

log "Build du frontend pour la production..."
npm run build

success "✅ Frontend builé"
cd ..

# Migrations de base de données
step "6/7 🗄️ Mise à jour de la base de données..."

cd backend

# Vérifier la configuration de la base
if [ ! -f ".env" ]; then
    error "Fichier backend/.env manquant"
    error "Copiez backend/.env.example et configurez-le"
    exit 1
fi

# Vérifier la connexion à la base
log "Vérification de la connexion à la base de données..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
    success "✅ Connexion à la base de données OK"
else
    warn "⚠️ Problème de connexion à la base, tentative avec migrate deploy..."
fi

log "Application des migrations..."
npx prisma migrate deploy || {
    warn "⚠️ Échec des migrations, tentative de reset..."
    read -p "Voulez-vous réinitialiser la base de données ? (y/N): " reset_db
    if [[ "$reset_db" =~ ^[Yy]$ ]]; then
        npx prisma migrate reset --force
        npx prisma db seed
        success "✅ Base de données réinitialisée"
    else
        error "❌ Migrations échouées, intervention manuelle requise"
        exit 1
    fi
}

success "✅ Base de données mise à jour"
cd ..

# Redémarrage des services
step "7/7 🚀 Redémarrage des services..."

if command -v pm2 >/dev/null 2>&1; then
    log "Redémarrage avec PM2..."
    
    # Démarrer le backend
    pm2 start backend/src/index.js --name "geneaia-backend" --watch false
    
    # Servir le frontend statique
    pm2 serve frontend/dist 8080 --name "geneaia-frontend"
    
    # Sauvegarder la configuration PM2
    pm2 save
    
    log "Vérification du statut des services..."
    pm2 status
    
    success "✅ Services redémarrés avec PM2"
    
else
    warn "⚠️ PM2 non disponible"
    log "💡 Pour démarrer manuellement :"
    echo "   cd backend && npm start &"
    echo "   # Servir frontend/dist avec votre serveur web (nginx, apache, etc.)"
fi

# Test de santé
log "🔍 Test de santé de l'application..."

sleep 3

# Tester le backend
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    success "✅ Backend répond sur le port 3001"
else
    warn "⚠️ Backend ne répond pas, vérifiez les logs"
    if command -v pm2 >/dev/null 2>&1; then
        echo "   pm2 logs geneaia-backend"
    fi
fi

# Nettoyer les anciennes sauvegardes (garder les 5 dernières)
log "🧹 Nettoyage des anciennes sauvegardes..."
if [ -d "backups" ]; then
    cd backups
    ls -t | tail -n +6 | xargs -r rm -rf
    cd ..
    success "✅ Nettoyage terminé"
fi

# Résumé final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ MISE À JOUR TERMINÉE !                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

success "🎉 GeneaIA mis à jour avec succès !"
echo ""

log "📊 Statut des services :"
if command -v pm2 >/dev/null 2>&1; then
    pm2 status 2>/dev/null || echo "   Aucun processus PM2 en cours"
else
    echo "   PM2 non disponible - services à vérifier manuellement"
fi

echo ""
log "🌐 Points d'accès :"
echo "   Backend API : http://localhost:3001"
echo "   Health check: http://localhost:3001/health"
if command -v pm2 >/dev/null 2>&1; then
    echo "   Frontend    : http://localhost:8080 (si PM2 serve actif)"
fi

echo ""
log "📋 Commandes utiles :"
echo "   pm2 logs geneaia-backend  # Voir les logs backend"
echo "   pm2 logs geneaia-frontend # Voir les logs frontend"
echo "   pm2 restart all          # Redémarrer tous les services"
echo "   pm2 monit                # Monitoring en temps réel"

echo ""
warn "⚠️ N'oubliez pas de :"
echo "   - Configurer Nginx si nécessaire"
echo "   - Vérifier les certificats SSL"
echo "   - Tester l'application complètement"

echo ""
success "🎯 Mise à jour VPS terminée avec succès !"