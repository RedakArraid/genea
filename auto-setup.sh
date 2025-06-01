#!/bin/bash

# 🧬 SCRIPT DE CONFIGURATION AUTOMATIQUE GENEAIA
# Ce script configure automatiquement votre environnement GeneaIA

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour générer des secrets sécurisés
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

generate_password() {
    openssl rand -base64 24 | tr -d "=+/"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet GeneaIA"
    exit 1
fi

print_header "🧬 CONFIGURATION AUTOMATIQUE GENEAIA"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 1 : COLLECTE DES INFORMATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "📋 COLLECTE DES INFORMATIONS"

# IP du VPS
read -p "🌐 IP de votre VPS : " VPS_IP
if [ -z "$VPS_IP" ]; then
    print_error "L'IP du VPS est obligatoire"
    exit 1
fi

# Utilisateur SSH
read -p "👤 Utilisateur SSH (défaut: ubuntu): " SSH_USER
SSH_USER=${SSH_USER:-ubuntu}

# Domaine (optionnel)
read -p "🌍 Nom de domaine (optionnel, ex: geneaia.com): " DOMAIN
if [ -n "$DOMAIN" ]; then
    PROD_URL="https://$DOMAIN"
    STAGING_URL="https://staging.$DOMAIN"
    API_PROD_URL="https://api.$DOMAIN"
    API_STAGING_URL="https://api-staging.$DOMAIN"
else
    PROD_URL="http://$VPS_IP:3000"
    STAGING_URL="http://$VPS_IP:3001"
    API_PROD_URL="http://$VPS_IP:3001/api"
    API_STAGING_URL="http://$VPS_IP:3002/api"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 2 : GÉNÉRATION DES SECRETS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🔐 GÉNÉRATION DES SECRETS SÉCURISÉS"

print_step "Génération des secrets JWT..."
STAGING_JWT_SECRET=$(generate_secret)
PROD_JWT_SECRET=$(generate_secret)

print_step "Génération des mots de passe de base de données..."
STAGING_DB_PASSWORD=$(generate_password)
PROD_DB_PASSWORD=$(generate_password)

print_step "Génération d'un nouveau JWT secret pour le développement local..."
DEV_JWT_SECRET=$(generate_secret)

print_success "Secrets générés avec succès"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 3 : MISE À JOUR DES FICHIERS DE CONFIGURATION LOCAUX
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "📝 MISE À JOUR DES FICHIERS DE CONFIGURATION"

print_step "Mise à jour du JWT_SECRET dans backend/.env..."
if [ -f "backend/.env" ]; then
    # Sauvegarder l'ancien fichier
    cp backend/.env backend/.env.backup
    # Remplacer le JWT_SECRET
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=\"$DEV_JWT_SECRET\"/" backend/.env
    rm -f backend/.env.bak
    print_success "JWT_SECRET mis à jour dans backend/.env"
else
    print_warning "Fichier backend/.env non trouvé"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 4 : INSTALLATION DES DÉPENDANCES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "📦 INSTALLATION DES DÉPENDANCES"

print_step "Installation des dépendances..."
npm run setup

print_step "Génération du client Prisma..."
cd backend
npx prisma generate
cd ..

print_success "Dépendances installées"

print_header "🎉 CONFIGURATION TERMINÉE"

echo -e "${GREEN}📁 FICHIERS GÉNÉRÉS :${NC}"
echo "  ✅ Configuration backend/.env mis à jour"
echo "  ✅ Dépendances installées"
echo "  ✅ Client Prisma généré"

echo -e "\n${YELLOW}📋 PROCHAINES ÉTAPES :${NC}"
echo "  1️⃣  Démarrez PostgreSQL si ce n'est pas fait"
echo "  2️⃣  Initialisez la base de données : npm run db:init"
echo "  3️⃣  Démarrez l'application : npm run dev"
echo "  4️⃣  Ouvrez http://localhost:5173 dans votre navigateur"

echo -e "\n${BLUE}🌐 URLS CONFIGURÉES :${NC}"
echo "  🏠 Local:      http://localhost:5173"
echo "  🎭 Staging:    $STAGING_URL"
echo "  🏭 Production: $PROD_URL"
echo "  📡 API Staging: $API_STAGING_URL"
echo "  📡 API Prod:    $API_PROD_URL"

echo -e "\n${GREEN}🔑 SECRETS GÉNÉRÉS :${NC}"
echo "  🔐 JWT Dev:      $DEV_JWT_SECRET"
echo "  🎭 JWT Staging:  $STAGING_JWT_SECRET"
echo "  🏭 JWT Prod:     $PROD_JWT_SECRET"
echo "  🗄️ DB Staging:   $STAGING_DB_PASSWORD"
echo "  🗄️ DB Prod:      $PROD_DB_PASSWORD"

echo -e "\n${GREEN}👤 COMPTE DE TEST :${NC}"
echo "  📧 Email: test@example.com"
echo "  🔒 Password: password123"

print_header "🚀 GENEAIA EST PRÊT !"

echo -e "${GREEN}🎊 Votre application de généalogie est maintenant configurée !${NC}"
echo -e "${BLUE}   Démarrez avec : npm run dev${NC}"
