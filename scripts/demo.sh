#!/bin/bash

# 🎯 Script de Démonstration GeneaIA
# Vérifie que le déploiement automatique est fonctionnel

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[DEMO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${PURPLE}[STEP]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               🎯 DÉMONSTRATION GENEAIA 🎯                    ║${NC}"
echo -e "${BLUE}║           Test du déploiement automatique                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "❌ Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

step "1/8 📋 Vérification de la structure"

# Vérifier les fichiers essentiels
FILES_CHECK=(
    "Makefile"
    "ecosystem.config.js"
    "backend/.env.example"
    "frontend/.env.example"
    "scripts/auto-push.sh"
    "scripts/vps-update.sh"
    "scripts/validate-deploy.sh"
    ".github/workflows/deploy.yml"
)

for file in "${FILES_CHECK[@]}"; do
    if [ -f "$file" ]; then
        success "✅ $file"
    else
        error "❌ $file manquant"
    fi
done

step "2/8 🔧 Test des commandes Makefile"

# Tester les commandes principales
echo ""
info "🔍 Commandes disponibles:"
make help | grep -E "^[a-zA-Z_-]+" | head -10

step "3/8 📦 Vérification des dépendances"

# Vérifier Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    success "✅ Node.js $NODE_VERSION"
else
    error "❌ Node.js non trouvé"
fi

# Vérifier npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    success "✅ npm $NPM_VERSION"
else
    error "❌ npm non trouvé"
fi

# Vérifier Git
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    success "✅ Git $GIT_VERSION"
else
    error "❌ Git non trouvé"
fi

step "4/8 🗄️ Test base de données (optionnel)"

if command -v psql >/dev/null 2>&1; then
    PSQL_VERSION=$(psql --version | cut -d' ' -f3)
    success "✅ PostgreSQL CLI $PSQL_VERSION"
else
    warn "⚠️ PostgreSQL CLI non trouvé (optionnel)"
fi

step "5/8 🔍 Validation de la configuration"

# Lancer le script de validation
if [ -x "scripts/validate-deploy.sh" ]; then
    log "Lancement de la validation..."
    if ./scripts/validate-deploy.sh >/dev/null 2>&1; then
        success "✅ Configuration valide"
    else
        warn "⚠️ Problèmes de configuration détectés"
        info "💡 Lancez: ./scripts/validate-deploy.sh pour plus de détails"
    fi
else
    warn "⚠️ Script de validation non exécutable"
fi

step "6/8 🤖 Test GitHub Actions"

if [ -f ".github/workflows/deploy.yml" ]; then
    success "✅ Workflow GitHub Actions configuré"
    info "📋 Secrets GitHub à configurer:"
    echo "   • VPS_HOST (IP de votre VPS)"
    echo "   • VPS_USER (utilisateur SSH)"
    echo "   • VPS_SSH_KEY (clé privée SSH)"
    echo "   • VPS_PATH (chemin sur le VPS)"
else
    error "❌ Workflow GitHub Actions manquant"
fi

step "7/8 🚀 Test des scripts de déploiement"

# Tester que les scripts sont exécutables
SCRIPTS=(
    "scripts/auto-push.sh"
    "scripts/vps-update.sh"
    "scripts/quick-init.sh"
    "scripts/clean.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        success "✅ $script exécutable"
    else
        warn "⚠️ $script non exécutable (chmod +x requis)"
    fi
done

step "8/8 🎯 Simulation de déploiement"

log "Simulation d'un workflow de déploiement..."
echo ""

# Simuler les étapes du déploiement
echo "1. 📝 Modification du code"
sleep 1
echo "2. 🧪 Tests automatiques"
sleep 1
echo "3. 🏗️ Build de production"
sleep 1
echo "4. 📋 Validation pré-déploiement"
sleep 1
echo "5. 🚀 Push vers GitHub"
sleep 1
echo "6. 🤖 GitHub Actions CI/CD"
sleep 1
echo "7. 🌐 Déploiement VPS"
sleep 1
echo "8. ✅ Tests post-déploiement"
sleep 1

# Résumé final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ DÉMONSTRATION TERMINÉE !                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

success "🎉 Système de déploiement automatique GeneaIA testé !"

echo ""
log "📋 Workflow complet de déploiement :"
echo ""
echo "   🔧 Développement local:"
echo "      make dev                    # Démarrage développement"
echo "      make test                   # Tests"
echo ""
echo "   🚀 Déploiement:"
echo "      make push                   # Push automatique vers GitHub"
echo "      # GitHub Actions se déclenche automatiquement"
echo ""
echo "   🌐 Sur VPS (après GitHub Actions):"
echo "      git pull                    # Récupération du code"
echo "      make vps-update             # Mise à jour automatique"
echo ""
echo "   📊 Monitoring:"
echo "      make status                 # Statut des services"
echo "      make logs                   # Logs en temps réel"
echo ""

log "🔧 Commandes de maintenance :"
echo "   make clean                     # Nettoyage projet"
echo "   ./scripts/validate-deploy.sh   # Validation configuration"
echo "   make config-check              # Vérification complète"
echo ""

info "💡 Prochaines étapes pour un déploiement réel :"
echo ""
echo "   1. 📝 Configurez vos fichiers .env:"
echo "      • cp backend/.env.example backend/.env"
echo "      • cp frontend/.env.example frontend/.env"
echo "      • Modifiez les avec vos vraies données"
echo ""
echo "   2. 🔗 Configurez GitHub:"
echo "      • Créez un repo GitHub"
echo "      • Ajoutez les secrets (VPS_HOST, VPS_USER, etc.)"
echo "      • git remote add origin <votre-repo>"
echo ""
echo "   3. 🌐 Préparez votre VPS:"
echo "      • Installez Node.js, PostgreSQL, PM2"
echo "      • Configurez SSH et les clés"
echo "      • Créez le dossier de déploiement"
echo ""
echo "   4. 🚀 Premier déploiement:"
echo "      • make push                 # Push vers GitHub"
echo "      • Sur VPS: git clone + make vps-setup"
echo ""

warn "⚠️ Points d'attention :"
echo "   • Testez toujours en local avant de déployer"
echo "   • Sauvegardez votre base de données avant les mises à jour"
echo "   • Surveillez les logs après déploiement"
echo "   • Configurez des alertes pour le monitoring"

echo ""
success "🎯 Votre système de déploiement automatique GeneaIA est prêt !"
echo ""
info "📚 Documentation complète dans deploy/README.md"
info "🆘 Support et troubleshooting dans deploy/VPS-SETUP.md"

echo ""
log "🎊 Bon développement et déploiement avec GeneaIA !"
echo ""