#!/bin/bash

# 🔍 SCRIPT DE VÉRIFICATION DU DÉPLOIEMENT VPS

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Demander l'IP du VPS
read -p "🌐 Entrez l'IP de votre VPS : " VPS_IP
if [ -z "$VPS_IP" ]; then
    print_error "L'IP du VPS est obligatoire"
    exit 1
fi

print_header "🔍 VÉRIFICATION DU DÉPLOIEMENT GENEAIA"

print_step "Test de connexion SSH..."
if ssh -i ~/.ssh/geneaia_deploy -o ConnectTimeout=10 -o BatchMode=yes ubuntu@$VPS_IP "echo 'SSH OK'" 2>/dev/null; then
    print_success "Connexion SSH fonctionnelle"
else
    print_error "Connexion SSH échouée"
    echo "Vérifiez :"
    echo "- L'IP du VPS est correcte"
    echo "- La clé SSH est bien configurée sur le VPS"
    echo "- Le VPS est allumé et accessible"
    exit 1
fi

print_step "Vérification de Docker sur le VPS..."
if ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "docker --version" >/dev/null 2>&1; then
    DOCKER_VERSION=$(ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "docker --version")
    print_success "$DOCKER_VERSION"
else
    print_error "Docker non installé sur le VPS"
    exit 1
fi

print_step "Vérification de Docker Compose sur le VPS..."
if ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "docker-compose --version" >/dev/null 2>&1; then
    COMPOSE_VERSION=$(ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "docker-compose --version")
    print_success "$COMPOSE_VERSION"
else
    print_error "Docker Compose non installé sur le VPS"
    exit 1
fi

print_step "Vérification des dossiers de déploiement..."
if ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "ls -la /var/www/geneaia*" >/dev/null 2>&1; then
    print_success "Dossiers de déploiement présents"
else
    print_warning "Dossiers de déploiement manquants - création..."
    ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "sudo mkdir -p /var/www/geneaia /var/www/geneaia-staging && sudo chown \$USER:\$USER /var/www/geneaia*"
    print_success "Dossiers créés"
fi

print_step "Test des URLs de l'application..."

# Test staging si disponible
if curl -s --connect-timeout 5 http://$VPS_IP:3000 >/dev/null 2>&1; then
    print_success "Staging accessible sur http://$VPS_IP:3000"
else
    print_warning "Staging non accessible (normal si pas encore déployé)"
fi

# Test production si disponible
if curl -s --connect-timeout 5 http://$VPS_IP >/dev/null 2>&1; then
    print_success "Production accessible sur http://$VPS_IP"
else
    print_warning "Production non accessible (normal si pas encore déployé)"
fi

# Test API si disponible
if curl -s --connect-timeout 5 http://$VPS_IP:3001/api >/dev/null 2>&1; then
    print_success "API accessible sur http://$VPS_IP:3001/api"
else
    print_warning "API non accessible (normal si pas encore déployé)"
fi

print_step "Vérification des containers Docker..."
CONTAINERS=$(ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP "docker ps --format 'table {{.Names}}\t{{.Status}}'" 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    print_success "Containers en cours d'exécution :"
    echo "$CONTAINERS"
else
    print_warning "Aucun container en cours d'exécution"
fi

print_header "📋 RÉSUMÉ"

echo -e "${GREEN}🎯 Actions suivantes recommandées :${NC}"
echo ""

if ! curl -s --connect-timeout 5 http://$VPS_IP:3000 >/dev/null 2>&1; then
    echo "1️⃣ **Configurer les secrets GitHub** pour le déploiement automatique"
    echo "2️⃣ **Pousser vers la branche staging** : git push origin staging"
    echo "3️⃣ **Surveiller GitHub Actions** pour voir le déploiement"
fi

echo ""
echo -e "${BLUE}🌐 URLs à tester après déploiement :${NC}"
echo "   Staging     : http://$VPS_IP:3000"
echo "   Production  : http://$VPS_IP"
echo "   API         : http://$VPS_IP:3001/api"
echo ""

echo -e "${YELLOW}🔧 Commandes utiles pour débugger sur le VPS :${NC}"
echo "   ssh -i ~/.ssh/geneaia_deploy ubuntu@$VPS_IP"
echo "   docker ps"
echo "   docker-compose logs -f"
echo "   docker-compose restart"
echo ""

print_success "Vérification terminée ! Votre VPS est prêt pour le déploiement."
