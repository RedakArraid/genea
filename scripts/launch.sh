#!/bin/bash

# 🚀 Script de Lancement GeneaIA avec Support IP Publique
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

# Détecter l'IP publique
get_public_ip() {
    # Essayer plusieurs méthodes pour obtenir l'IP publique
    PUBLIC_IP=$(curl -s http://ipv4.icanhazip.com 2>/dev/null || \
                curl -s https://api.ipify.org 2>/dev/null || \
                curl -s http://checkip.amazonaws.com 2>/dev/null || \
                echo "IP_NON_DETECTEE")
    echo "$PUBLIC_IP"
}

# Vérifier si on est sur un VPS (détection basique)
is_vps() {
    if [ -n "$SSH_CONNECTION" ] || [ -n "$SSH_CLIENT" ] || [ -f "/etc/ssh/sshd_config" ]; then
        return 0  # C'est un VPS
    else
        return 1  # Local
    fi
}

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                🚀 LANCEMENT GENEAIA 🚀                      ║${NC}"
echo -e "${BLUE}║         Backend + Frontend avec IP Publique                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "❌ Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

# Détecter l'environnement
if is_vps; then
    PUBLIC_IP=$(get_public_ip)
    info "🌐 VPS détecté - IP publique: $PUBLIC_IP"
    USE_PUBLIC_IP=true
else
    info "🏠 Environnement local détecté"
    USE_PUBLIC_IP=false
fi

# Fonction pour tuer les processus existants
cleanup() {
    log "🛑 Arrêt des processus..."
    pkill -f "node.*backend" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "serve.*dist" 2>/dev/null || true
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
        
        # Configuration backend pour accepter toutes les IPs
        log "🚀 Lancement du backend (port 3001)..."
        cd backend
        if [ "$USE_PUBLIC_IP" = true ]; then
            # Sur VPS, backend écoute sur toutes les interfaces
            HOST=0.0.0.0 npm run dev &
        else
            npm run dev &
        fi
        BACKEND_PID=$!
        cd ..
        
        sleep 3
        
        log "🎨 Lancement du frontend (port 5173)..."
        cd frontend
        if [ "$USE_PUBLIC_IP" = true ]; then
            # Vite avec host 0.0.0.0 pour accepter les connexions externes
            npm run dev -- --host 0.0.0.0 &
        else
            npm run dev &
        fi
        FRONTEND_PID=$!
        cd ..
        
        sleep 3
        
        success "✅ Services démarrés !"
        echo ""
        info "🌐 URLs disponibles :"
        if [ "$USE_PUBLIC_IP" = true ]; then
            echo "   Backend API : http://$PUBLIC_IP:3001"
            echo "   Frontend    : http://$PUBLIC_IP:5173"
            echo "   Health Check: http://$PUBLIC_IP:3001/health"
            echo ""
            echo "   Locales     : http://localhost:3001 | http://localhost:5173"
        else
            echo "   Backend API : http://localhost:3001"
            echo "   Frontend    : http://localhost:5173"
            echo "   Health Check: http://localhost:3001/health"
        fi
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
        if [ "$USE_PUBLIC_IP" = true ]; then
            HOST=0.0.0.0 NODE_ENV=production npm start &
        else
            NODE_ENV=production npm start &
        fi
        BACKEND_PID=$!
        cd ..
        
        log "🎨 Service du frontend buildt..."
        cd frontend
        if [ "$USE_PUBLIC_IP" = true ]; then
            npx serve dist -l 8080 --host 0.0.0.0 &
        else
            npx serve dist -l 8080 &
        fi
        FRONTEND_PID=$!
        cd ..
        
        sleep 3
        
        success "✅ Mode production locale démarré !"
        echo ""
        info "🌐 URLs de production :"
        if [ "$USE_PUBLIC_IP" = true ]; then
            echo "   Backend API : http://$PUBLIC_IP:3001"
            echo "   Frontend    : http://$PUBLIC_IP:8080"
            echo "   Health Check: http://$PUBLIC_IP:3001/health"
            echo ""
            echo "   Locales     : http://localhost:3001 | http://localhost:8080"
        else
            echo "   Backend API : http://localhost:3001"
            echo "   Frontend    : http://localhost:8080"
            echo "   Health Check: http://localhost:3001/health"
        fi
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
        
        if [ "$USE_PUBLIC_IP" = true ] && [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then
            info "🌐 Test accès public..."
            if curl -f "http://$PUBLIC_IP:3001/health" >/dev/null 2>&1; then
                success "✅ Accès public OK"
            else
                warn "⚠️ Accès public bloqué (pare-feu?)"
            fi
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
        if [ "$USE_PUBLIC_IP" = true ]; then
            echo "   Backend API : http://$PUBLIC_IP:3001"
            echo "   Frontend    : http://$PUBLIC_IP:8080"
            echo "   Health Check: http://$PUBLIC_IP:3001/health"
            echo ""
            echo "   Locales     : http://localhost:3001 | http://localhost:8080"
        else
            echo "   Backend API : http://localhost:3001"
            echo "   Frontend    : http://localhost:8080"
            echo "   Health Check: http://localhost:3001/health"
        fi
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
            info "🌐 URLs de test :"
            if [ "$USE_PUBLIC_IP" = true ]; then
                echo "   Health Check: http://$PUBLIC_IP:3001/health"
                echo "   Frontend    : http://$PUBLIC_IP:8080"
            fi
            echo "   Local Health: http://localhost:3001/health"
            echo ""
            log "🔍 Logs en temps réel (Ctrl+C pour arrêter) :"
            pm2 logs
        else
            info "🔍 Processus Node.js actifs :"
            ps aux | grep node | grep -v grep || echo "Aucun processus Node.js trouvé"
            echo ""
            info "🌐 Ports ouverts :"
            netstat -tlnp 2>/dev/null | grep -E ":(3001|5173|8080)" || echo "Aucun port GeneaIA ouvert"
            echo ""
            if [ "$USE_PUBLIC_IP" = true ]; then
                info "🌐 Tests d'accès public :"
                echo "   curl http://$PUBLIC_IP:3001/health"
                echo "   curl http://$PUBLIC_IP:8080"
            fi
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

# Afficher les informations d'accès final
if [ "$USE_PUBLIC_IP" = true ] && [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then
    echo ""
    info "🌐 Votre application est accessible via :"
    echo "   IP Publique : $PUBLIC_IP"
    echo "   Local       : localhost"
    echo ""
    warn "⚠️ Assurez-vous que les ports 3001 et 8080 sont ouverts dans votre pare-feu !"
fi