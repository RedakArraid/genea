#!/bin/bash

# 🔥 Script de Configuration Pare-feu pour GeneaIA
# Configure UFW pour permettre l'accès via IP publique

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[FIREWALL]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${BLUE}🔥 CONFIGURATION PARE-FEU GENEAIA${NC}"
echo "=================================="
echo ""

# Vérifier les privilèges sudo
if [ "$EUID" -ne 0 ]; then
    error "❌ Ce script doit être exécuté avec sudo"
    echo "Usage: sudo ./scripts/setup-firewall.sh"
    exit 1
fi

# Détecter l'IP publique
PUBLIC_IP=$(curl -s http://ipv4.icanhazip.com 2>/dev/null || echo "IP_NON_DETECTEE")

log "🌐 Configuration du pare-feu pour GeneaIA"
echo ""
echo "IP publique détectée: $PUBLIC_IP"
echo ""

# Menu de configuration
echo "Choisissez le niveau de sécurité :"
echo ""
echo "1) 🔓 Développement (ports ouverts pour tests)"
echo "2) 🔒 Production avec Nginx (HTTP/HTTPS + SSH)"
echo "3) 🔥 Production directe (ports app + SSH)"
echo "4) 📊 Voir le statut actuel"
echo "5) 🚫 Réinitialiser le pare-feu"
echo ""

read -p "Votre choix (1-5): " choice

case $choice in
    1)
        log "🔓 Configuration développement..."
        
        # Réinitialiser UFW
        ufw --force reset
        
        # Politique par défaut
        ufw default deny incoming
        ufw default allow outgoing
        
        # SSH (obligatoire)
        ufw allow ssh
        
        # Ports GeneaIA
        ufw allow 3001 comment "GeneaIA Backend API"
        ufw allow 8080 comment "GeneaIA Frontend"
        ufw allow 5173 comment "Vite Dev Server"
        
        # Ports web standards
        ufw allow 80 comment "HTTP"
        ufw allow 443 comment "HTTPS"
        
        # Activer UFW
        ufw --force enable
        
        success "✅ Pare-feu configuré en mode développement"
        ;;
        
    2)
        log "🔒 Configuration production avec Nginx..."
        
        # Réinitialiser UFW
        ufw --force reset
        
        # Politique par défaut
        ufw default deny incoming
        ufw default allow outgoing
        
        # SSH (obligatoire)
        ufw allow ssh
        
        # Web (Nginx reverse proxy)
        ufw allow 'Nginx Full'
        
        # Bloquer l'accès direct aux ports app (sécurité)
        # Les utilisateurs passeront par Nginx
        
        # Activer UFW
        ufw --force enable
        
        success "✅ Pare-feu configuré pour production avec Nginx"
        warn "⚠️ Configurez Nginx pour proxy vers les ports 3001 et 8080"
        ;;
        
    3)
        log "🔥 Configuration production directe..."
        
        # Réinitialiser UFW
        ufw --force reset
        
        # Politique par défaut
        ufw default deny incoming
        ufw default allow outgoing
        
        # SSH (obligatoire)
        ufw allow ssh
        
        # Ports GeneaIA
        ufw allow 3001 comment "GeneaIA Backend API"
        ufw allow 8080 comment "GeneaIA Frontend"
        
        # Ports web standards
        ufw allow 80 comment "HTTP"
        ufw allow 443 comment "HTTPS"
        
        # Activer UFW
        ufw --force enable
        
        success "✅ Pare-feu configuré pour production directe"
        ;;
        
    4)
        log "📊 Statut actuel du pare-feu..."
        echo ""
        
        # Statut UFW
        echo "🔥 Statut UFW :"
        ufw status verbose
        echo ""
        
        # Ports ouverts
        echo "🌐 Ports en écoute :"
        netstat -tlnp | grep -E ":(22|80|443|3001|5173|8080)" || echo "Aucun port GeneaIA détecté"
        echo ""
        
        # Test des ports GeneaIA
        echo "🧪 Tests de connectivité :"
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            echo "  ✅ Backend API (3001) : Accessible"
        else
            echo "  ❌ Backend API (3001) : Non accessible"
        fi
        
        if curl -f http://localhost:8080 >/dev/null 2>&1; then
            echo "  ✅ Frontend (8080) : Accessible"
        else
            echo "  ❌ Frontend (8080) : Non accessible"
        fi
        
        if [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then
            echo ""
            echo "🌐 Tests depuis l'extérieur :"
            echo "  Testez manuellement :"
            echo "    curl http://$PUBLIC_IP:3001/health"
            echo "    curl http://$PUBLIC_IP:8080"
        fi
        ;;
        
    5)
        log "🚫 Réinitialisation du pare-feu..."
        
        warn "⚠️ Cette action va supprimer toutes les règles actuelles !"
        read -p "Confirmer la réinitialisation ? (y/N): " confirm
        
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            ufw --force reset
            ufw --force disable
            
            success "✅ Pare-feu réinitialisé et désactivé"
            warn "⚠️ Votre serveur n'est plus protégé !"
            echo "   Reconfigurez le pare-feu rapidement."
        else
            log "❌ Réinitialisation annulée"
        fi
        ;;
        
    *)
        error "❌ Choix invalide"
        exit 1
        ;;
esac

# Affichage final
echo ""
log "📋 Informations finales :"
echo ""

if [ "$choice" != "4" ] && [ "$choice" != "5" ]; then
    echo "🔥 Statut UFW :"
    ufw status numbered
    echo ""
fi

if [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then
    echo "🌐 Votre application est accessible via :"
    echo "   IP Publique : $PUBLIC_IP"
    echo "   URLs de test :"
    echo "     http://$PUBLIC_IP:3001/health  (API)"
    echo "     http://$PUBLIC_IP:8080         (Frontend)"
    echo ""
fi

echo "💡 Commandes utiles :"
echo "   sudo ufw status           # Voir le statut"
echo "   sudo ufw enable/disable   # Activer/désactiver"
echo "   sudo ufw delete <rule>    # Supprimer une règle"
echo "   netstat -tlnp             # Voir les ports ouverts"

echo ""
success "🎯 Configuration pare-feu terminée !"

# Test final automatique
if [ "$choice" = "1" ] || [ "$choice" = "3" ]; then
    echo ""
    log "🧪 Test automatique des services..."
    sleep 2
    
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        success "✅ API Backend accessible"
    else
        warn "⚠️ API Backend non accessible"
    fi
    
    if curl -f http://localhost:8080 >/dev/null 2>&1; then
        success "✅ Frontend accessible"
    else
        warn "⚠️ Frontend non accessible (normal si non démarré)"
    fi
fi