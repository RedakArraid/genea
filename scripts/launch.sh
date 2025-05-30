#!/bin/bash

# 🚀 Script de Lancement GeneaIA
# Lance facilement le backend et le frontend en développement ou production

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[LAUNCH]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                🚀 LANCEMENT GENEAIA 🚀                      ║${NC}"
echo -e "${BLUE}║           Backend + Frontend en un clic                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "❌ Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

# Fonction pour tuer les processus existants
cleanup() {
    log "🛑 Arrêt des processus..."
    pkill -f "node.*backend" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    sleep 2
}

# Menu de sélection
echo "Choisissez le mode de lancement :"
echo ""
echo "1) 🔧 Développement (backend + frontend en parallèle)"
echo "2) 🎯 Production locale (simulation VPS)"
echo "3) 🌐 Production VPS (PM2)"
echo "4) 🧪 Tests + Lancement"
echo "5) 🔍 Monitoring uniquement"
echo "6) 🛑 Arrêter tous les services"
echo ""

read -p "Votre choix (1-6): " choice

case $choice in
    1)
        log "🔧 Mode Développement"
        echo ""
        
        # Vérifier les dépendances
        if [ ! -d "backend/node_modules" ]; then
            warn "📦 Installation des dépendances backend..."
            cd backend && npm install && cd ..
        fi
        
        if [ ! -d "frontend/node_modules" ]; then
            warn "📦 Installation des dépendances frontend..."
            cd frontend && npm install && cd ..
        fi
        
        # Nettoyer les processus existants
        cleanup
        
        log "🚀 Lancement du backend (port 3001)..."
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        sleep 3
        
        log "🎨 Lancement du frontend (port 5173)..."
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        
        sleep 3
        
        success "✅ Services démarrés !"
        echo ""
        info "🌐 URLs disponibles :"
        echo "   Backend API : http://localhost:3001"
        echo "   Frontend    : http://localhost:5173"
        echo "   Health Check: http://localhost:3001/health"
        echo ""
        info "📋 Commandes utiles :"
        echo "   Ctrl+C pour arrêter"
        echo "   make logs pour voir les logs"
        echo ""
        
        # Attendre et gérer l'arrêt propre
        trap "cleanup; exit 0" SIGINT SIGTERM
        
        log "⌨️ Appuyez sur Ctrl+C pour arrêter les services..."
        wait
        ;;
        
    2)
        log "🎯 Mode Production Locale"
        echo ""
        
        # Build du frontend
        warn "🏗️ Build du frontend..."
        cd frontend && npm install && npm run build && cd ..
        
        # Installation backend
        warn "📦 Installation backend production..."
        cd backend && npm install --production && cd ..
        
        cleanup
        
        # Démarrage en mode production
        log "🚀 Démarrage backend production..."
        cd backend
        NODE_ENV=production npm start &
        BACKEND_PID=$!
        cd ..
        
        log "🎨 Service du frontend buildt..."
        cd frontend
        npx serve dist -l 8080 &
        FRONTEND_PID=$!
        cd ..
        
        sleep 3
        
        success "✅ Mode production locale démarré !"
        echo ""
        info "🌐 URLs de production :"
        echo "   Backend API : http://localhost:3001"
        echo "   Frontend    : http://localhost:8080"
        echo "   Health Check: http://localhost:3001/health"
        echo ""
        
        # Tests de santé
        log "🔍 Tests de santé..."
        sleep 2
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            success "✅ Backend OK"
        else
            warn "⚠️ Backend ne répond pas"
        fi
        
        if curl -f http://localhost:8080 >/dev/null 2>&1; then
            success "✅ Frontend OK"
        else
            warn "⚠️ Frontend ne répond pas"
        fi
        
        trap "cleanup; exit 0" SIGINT SIGTERM
        log "⌨️ Appuyez sur Ctrl+C pour arrêter..."
        wait
        ;;
        
    3)
        log "🌐 Mode Production VPS (PM2)"
        echo ""
        
        if ! command -v pm2 >/dev/null 2>&1; then
            error "❌ PM2 non installé. Installez avec: npm install -g pm2"
            exit 1
        fi
        
        # Arrêter les anciens processus PM2
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
        
        # Build du frontend
        warn "🏗️ Build du frontend..."
        cd frontend && npm install && npm run build && cd ..
        
        # Installation backend
        warn "📦 Installation backend..."
        cd backend && npm install --production && cd ..
        
        log "🚀 Démarrage avec PM2..."
        pm2 start ecosystem.config.js --env production
        
        # Sauvegarder la configuration PM2
        pm2 save
        
        success "✅ Services PM2 démarrés !"
        echo ""
        info "📊 Statut PM2 :"
        pm2 status
        echo ""
        info "🌐 URLs de production :"
        echo "   Backend API : http://localhost:3001"
        echo "   Frontend    : http://localhost:8080"
        echo "   Health Check: http://localhost:3001/health"
        echo ""
        info "📋 Commandes PM2 utiles :"
        echo "   pm2 logs          # Voir les logs"
        echo "   pm2 monit         # Monitoring"
        echo "   pm2 restart all   # Redémarrer"
        echo "   pm2 stop all      # Arrêter"
        ;;
        
    4)
        log "🧪 Tests + Lancement"
        echo ""
        
        # Tests backend
        warn "🧪 Tests backend..."
        cd backend
        npm test || warn "⚠️ Certains tests backend ont échoué"
        cd ..
        
        # Tests frontend
        warn "🧪 Tests frontend..."
        cd frontend
        npm test -- --run || warn "⚠️ Certains tests frontend ont échoué"
        cd ..
        
        # Validation déploiement
        if [ -x "scripts/validate-deploy.sh" ]; then
            warn "🔍 Validation déploiement..."
            ./scripts/validate-deploy.sh || warn "⚠️ Problèmes de configuration détectés"
        fi
        
        # Lancement en mode dev après tests
        log "🚀 Lancement après tests..."
        exec $0 # Relancer le script pour choisir le mode
        ;;
        
    5)
        log "🔍 Mode Monitoring"
        echo ""
        
        if command -v pm2 >/dev/null 2>&1; then
            info "📊 Statut PM2 :"
            pm2 status
            echo ""
            log "🔍 Logs en temps réel (Ctrl+C pour arrêter) :"
            pm2 logs
        else
            info "🔍 Processus Node.js actifs :"
            ps aux | grep node | grep -v grep || echo "Aucun processus Node.js trouvé"
            echo ""
            info "🌐 Ports ouverts :"
            netstat -tlnp 2>/dev/null | grep -E ":(3001|5173|8080)" || echo "Aucun port GeneaIA ouvert"
        fi
        ;;
        
    6)
        log "🛑 Arrêt de tous les services"
        
        # Arrêt PM2
        if command -v pm2 >/dev/null 2>&1; then
            pm2 stop all 2>/dev/null || true
            pm2 delete all 2>/dev/null || true
            success "✅ Services PM2 arrêtés"
        fi
        
        # Arrêt processus classiques
        cleanup
        success "✅ Tous les services arrêtés"
        ;;
        
    *)
        error "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
success "🎉 Opération terminée !"