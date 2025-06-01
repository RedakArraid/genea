#!/bin/bash

# 🔍 Script de Validation du Déploiement GeneaIA
# Vérifie que tout est correct avant un déploiement

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[VALIDATE]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Variables
ERRORS=0
WARNINGS=0

# Fonction pour incrémenter les erreurs
add_error() {
    error "$1"
    ((ERRORS++))
}

# Fonction pour incrémenter les warnings
add_warning() {
    warn "$1"
    ((WARNINGS++))
}

echo ""
echo -e "${BLUE}🔍 VALIDATION DU DÉPLOIEMENT GENEAIA${NC}"
echo "=================================="
echo ""

# 1. Vérifier la structure du projet
log "📁 Vérification de la structure du projet..."

if [ ! -f "package.json" ]; then
    add_error "package.json manquant à la racine"
fi

if [ ! -d "backend" ]; then
    add_error "Dossier backend manquant"
else
    if [ ! -f "backend/package.json" ]; then
        add_error "backend/package.json manquant"
    fi
    if [ ! -f "backend/src/index.js" ] && [ ! -f "backend/index.js" ]; then
        add_error "Point d'entrée backend manquant (src/index.js ou index.js)"
    fi
fi

if [ ! -d "frontend" ]; then
    add_error "Dossier frontend manquant"
else
    if [ ! -f "frontend/package.json" ]; then
        add_error "frontend/package.json manquant"
    fi
fi

success "✅ Structure du projet"

# 2. Vérifier la configuration
log "⚙️ Vérification de la configuration..."

if [ ! -f "backend/.env" ]; then
    add_warning "backend/.env manquant (copiez .env.example)"
else
    # Vérifier les variables essentielles
    if ! grep -q "DATABASE_URL" backend/.env; then
        add_error "DATABASE_URL manquant dans backend/.env"
    fi
    if ! grep -q "JWT_SECRET" backend/.env; then
        add_error "JWT_SECRET manquant dans backend/.env"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    add_warning "frontend/.env manquant (copiez .env.example)"
else
    if ! grep -q "VITE_API_URL" frontend/.env; then
        add_warning "VITE_API_URL manquant dans frontend/.env"
    fi
fi

success "✅ Configuration"

# 3. Vérifier Git
log "📋 Vérification Git..."

if [ ! -d ".git" ]; then
    add_error "Repository Git non initialisé"
else
    if ! git remote get-url origin >/dev/null 2>&1; then
        add_warning "Remote origin non configuré"
    fi
    
    # Vérifier s'il y a des modifications non commitées
    if ! git diff --quiet || ! git diff --staged --quiet; then
        add_warning "Modifications non commitées détectées"
    fi
fi

success "✅ Git"

# 4. Vérifier les dépendances
log "📦 Vérification des dépendances..."

if [ ! -d "node_modules" ]; then
    add_warning "node_modules manquant à la racine (npm install requis)"
fi

if [ ! -d "backend/node_modules" ]; then
    add_warning "backend/node_modules manquant (npm install requis)"
fi

if [ ! -d "frontend/node_modules" ]; then
    add_warning "frontend/node_modules manquant (npm install requis)"
fi

success "✅ Dépendances"

# 5. Vérifier les scripts de déploiement
log "🔧 Vérification des scripts..."

for script in scripts/auto-push.sh scripts/vps-update.sh scripts/post-push.sh; do
    if [ ! -f "$script" ]; then
        add_error "Script manquant: $script"
    elif [ ! -x "$script" ]; then
        add_warning "Script non exécutable: $script (chmod +x requis)"
    fi
done

if [ ! -f "Makefile" ]; then
    add_error "Makefile manquant"
fi

success "✅ Scripts"

# 6. Vérifier Prisma (si utilisé)
if [ -d "backend/prisma" ]; then
    log "🗄️ Vérification Prisma..."
    
    if [ ! -f "backend/prisma/schema.prisma" ]; then
        add_error "Schema Prisma manquant"
    fi
    
    if [ ! -d "backend/prisma/migrations" ]; then
        add_warning "Aucune migration Prisma trouvée"
    fi
    
    success "✅ Prisma"
fi

# 7. Vérifier les fichiers ignorés
log "🚫 Vérification .gitignore..."

if [ ! -f ".gitignore" ]; then
    add_warning ".gitignore manquant"
else
    # Vérifier que les fichiers sensibles sont ignorés
    if ! grep -q "\.env" .gitignore; then
        add_warning "Fichiers .env non ignorés dans .gitignore"
    fi
    if ! grep -q "node_modules" .gitignore; then
        add_warning "node_modules non ignoré dans .gitignore"
    fi
fi

success "✅ .gitignore"

# 8. Vérifier GitHub Actions
log "🤖 Vérification GitHub Actions..."

if [ ! -f ".github/workflows/deploy.yml" ]; then
    add_warning "Workflow GitHub Actions manquant"
else
    success "✅ Workflow GitHub Actions présent"
fi

# 9. Test de build
log "🏗️ Test de build frontend..."

if [ -d "frontend" ]; then
    cd frontend
    if npm run build >/dev/null 2>&1; then
        success "✅ Build frontend réussi"
        if [ ! -d "dist" ]; then
            add_warning "Dossier dist non créé après build"
        fi
    else
        add_error "Échec du build frontend"
    fi
    cd ..
fi

# 10. Vérifier PM2 config
log "🔧 Vérification configuration PM2..."

if [ ! -f "ecosystem.config.js" ]; then
    add_warning "Configuration PM2 manquante (ecosystem.config.js)"
else
    success "✅ Configuration PM2 présente"
fi

# Résumé final
echo ""
echo "=================================="
echo -e "${BLUE}📊 RÉSUMÉ DE LA VALIDATION${NC}"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ PARFAIT !${NC} Aucun problème détecté"
    echo ""
    success "🚀 Prêt pour le déploiement !"
    echo ""
    log "💡 Commandes suggérées :"
    echo "   make push        # Push vers GitHub"
    echo "   make deploy      # Build + Push"
    echo ""
    
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ ATTENTION${NC} - $WARNINGS warning(s) détecté(s)"
    echo ""
    warn "🔧 Corrigez les warnings pour un déploiement optimal"
    echo ""
    log "💡 Vous pouvez tout de même déployer avec :"
    echo "   make push"
    echo ""
    
else
    echo -e "${RED}❌ ERREURS${NC} - $ERRORS erreur(s), $WARNINGS warning(s)"
    echo ""
    error "🛑 Corrigez les erreurs avant de déployer"
    echo ""
    log "💡 Après correction, relancez :"
    echo "   ./scripts/validate-deploy.sh"
    echo ""
    
fi

# Liste des actions recommandées
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "🔧 Actions recommandées :"
    echo ""
    
    if [ ! -f "backend/.env" ]; then
        echo "   cp backend/.env.example backend/.env"
        echo "   # Puis configurez backend/.env"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        echo "   cp frontend/.env.example frontend/.env"
        echo "   # Puis configurez frontend/.env"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "   npm install"
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        echo "   cd backend && npm install"
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        echo "   cd frontend && npm install"
    fi
    
    for script in scripts/*.sh; do
        if [ -f "$script" ] && [ ! -x "$script" ]; then
            echo "   chmod +x $script"
        fi
    done
    
    if [ ! -d ".git" ]; then
        echo "   git init"
        echo "   git remote add origin <URL_DE_VOTRE_REPO>"
    fi
    
    echo ""
fi

# Code de sortie
if [ $ERRORS -gt 0 ]; then
    exit 1
else
    exit 0
fi