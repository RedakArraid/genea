#!/bin/bash

# 🧪 Script de Test Backend API GeneaIA
# Vérifie que l'API est correctement configurée pour l'IP publique

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[TEST-API]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${BLUE}🧪 TEST BACKEND API GENEAIA${NC}"
echo "============================"
echo ""

# Détecter l'IP publique
PUBLIC_IP=$(curl -s http://ipv4.icanhazip.com 2>/dev/null || echo "IP_NON_DETECTEE")

log "🌐 IP publique détectée: $PUBLIC_IP"
echo ""

# Tests de connectivité
TESTS_PASSED=0
TESTS_TOTAL=0

test_endpoint() {
    local url=$1
    local description=$2
    
    ((TESTS_TOTAL++))
    
    echo -n "Testing $description: "
    
    if curl -f "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
}

# Test 1: Health check local
log "🔍 Tests de connectivité..."
echo ""

test_endpoint "http://localhost:3001" "Racine API (localhost)"
test_endpoint "http://localhost:3001/health" "Health check (localhost)"
test_endpoint "http://localhost:3001/api/health" "API Health check (localhost)"

# Test 2: Health check IP publique (si disponible)
if [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then
    echo ""
    log "🌐 Tests via IP publique ($PUBLIC_IP)..."
    echo ""
    
    test_endpoint "http://$PUBLIC_IP:3001" "Racine API (IP publique)"
    test_endpoint "http://$PUBLIC_IP:3001/health" "Health check (IP publique)"
    test_endpoint "http://$PUBLIC_IP:3001/api/health" "API Health check (IP publique)"
fi

# Test 3: Détails de la réponse health
echo ""
log "🔍 Analyse de la réponse health check..."
echo ""

if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
    
    # Vérifier les champs essentiels
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
        success "✅ Status OK trouvé"
    else
        error "❌ Status OK manquant"
    fi
    
    if echo "$HEALTH_RESPONSE" | grep -q '"host":"0.0.0.0"'; then
        success "✅ Host 0.0.0.0 configuré"
    else
        warn "⚠️ Host pourrait ne pas être configuré sur 0.0.0.0"
    fi
    
    if echo "$HEALTH_RESPONSE" | grep -q '"accessible_via"'; then
        success "✅ URLs d'accès incluses"
    else
        warn "⚠️ URLs d'accès manquantes"
    fi
    
    echo ""
    log "📋 Réponse health check complète:"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
    
else
    error "❌ Impossible d'obtenir la réponse health check"
fi

# Test 4: Configuration des ports
echo ""
log "🔌 Vérification des ports..."
echo ""

PORT_3001=$(netstat -tlnp 2>/dev/null | grep ":3001 " || echo "")
if [ -n "$PORT_3001" ]; then
    success "✅ Port 3001 en écoute"
    echo "   $PORT_3001"
    
    # Vérifier si c'est sur 0.0.0.0
    if echo "$PORT_3001" | grep -q "0.0.0.0:3001"; then
        success "✅ Écoute sur toutes les interfaces (0.0.0.0)"
    elif echo "$PORT_3001" | grep -q "127.0.0.1:3001"; then
        warn "⚠️ Écoute seulement sur localhost (127.0.0.1)"
        warn "   Pour l'IP publique, configurez HOST=0.0.0.0"
    fi
else
    error "❌ Port 3001 non trouvé"
fi

# Test 5: Pare-feu (si UFW installé)
if command -v ufw >/dev/null 2>&1; then
    echo ""
    log "🔥 Vérification pare-feu..."
    echo ""
    
    UFW_STATUS=$(sudo ufw status 2>/dev/null || echo "inactive")
    if echo "$UFW_STATUS" | grep -q "3001"; then
        success "✅ Port 3001 autorisé dans UFW"
    elif echo "$UFW_STATUS" | grep -q "inactive"; then
        warn "⚠️ UFW désactivé"
    else
        warn "⚠️ Port 3001 non autorisé dans UFW"
        echo "   Utilisez: sudo ufw allow 3001"
    fi
fi

# Résumé final
echo ""
echo "=================================="
echo -e "${BLUE}📊 RÉSUMÉ DES TESTS${NC}"
echo "=================================="
echo ""

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    success "🎉 TOUS LES TESTS PASSÉS ($TESTS_PASSED/$TESTS_TOTAL)"
    echo ""
    success "✅ Votre backend API est parfaitement configuré !"
    echo ""
    log "🌐 Votre API est accessible via :"
    echo "   Local      : http://localhost:3001"
    if [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then
        echo "   IP Publique: http://$PUBLIC_IP:3001"
    fi
    echo "   Health     : /health ou /api/health"
    
elif [ $TESTS_PASSED -gt 0 ]; then
    warn "⚠️ TESTS PARTIELS ($TESTS_PASSED/$TESTS_TOTAL)"
    echo ""
    warn "🔧 Votre API fonctionne localement mais pourrait avoir des problèmes d'accès public"
    echo ""
    log "💡 Actions suggérées :"
    echo "   1. Vérifiez le pare-feu: sudo make setup-firewall"
    echo "   2. Redémarrez l'API: make restart"
    echo "   3. Vérifiez les logs: pm2 logs geneaia-backend"
    
else
    error "❌ ÉCHEC DES TESTS ($TESTS_PASSED/$TESTS_TOTAL)"
    echo ""
    error "🛑 Votre backend API n'est pas accessible"
    echo ""
    log "💡 Actions de dépannage :"
    echo "   1. Vérifiez que l'API est démarrée: pm2 status"
    echo "   2. Redémarrez: make launch"
    echo "   3. Vérifiez les logs: pm2 logs geneaia-backend"
    echo "   4. Vérifiez le pare-feu: sudo ufw status"
fi

echo ""
log "🔧 Commandes utiles :"
echo "   make launch           # Redémarrer avec détection IP publique"
echo "   sudo make setup-firewall  # Configurer pare-feu"
echo "   make test-public      # Test rapide accès public"
echo "   pm2 logs geneaia-backend  # Voir les logs backend"

exit 0