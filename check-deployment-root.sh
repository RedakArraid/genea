#!/bin/bash

# 🔍 SCRIPT DE VÉRIFICATION DU DÉPLOIEMENT VPS - Version ROOT

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

# IP fixe de votre VPS
VPS_IP="168.231.86.179"
SSH_USER="root"

print_header "🔍 VÉRIFICATION DU DÉPLOIEMENT GENEAIA (ROOT)"

print_step "Test de connexion SSH avec root..."
if ssh -i ~/.ssh/geneaia_deploy -o ConnectTimeout=10 -o BatchMode=yes root@$VPS_IP "echo 'SSH OK'" 2>/dev/null; then
    print_success "Connexion SSH fonctionnelle avec root"
else
    print_error "Connexion SSH échouée avec la clé"
    echo ""
    echo "🔧 Tests de diagnostic :"
    
    # Test 1: Connexion manuelle possible ?
    print_step "Test de connexion manuelle..."
    if timeout 5 bash -c "</dev/tcp/$VPS_IP/22" 2>/dev/null; then
        print_success "Port SSH (22) accessible"
        
        # Test 2: Connexion sans clé
        print_step "Essayez de vous connecter manuellement :"
        echo "ssh root@$VPS_IP"
        echo ""
        echo "Puis exécutez ces commandes sur le VPS :"
        echo "mkdir -p ~/.ssh"
        echo "chmod 700 ~/.ssh"
        echo "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINHqIwvhe+7C3cmGnNMeZrj54JGxmRoiq+U+9aQlah75 deploy@geneaia-20250601' >> ~/.ssh/authorized_keys"
        echo "chmod 600 ~/.ssh/authorized_keys"
        echo ""
        echo "Puis relancez ce script."
        
    else
        print_error "Port SSH (22) inaccessible"
        echo "Vérifiez que le VPS est allumé et accessible"
    fi
    exit 1
fi

print_step "Vérification de Docker sur le VPS..."
if ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "docker --version" >/dev/null 2>&1; then
    DOCKER_VERSION=$(ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "docker --version")
    print_success "$DOCKER_VERSION"
else
    print_warning "Docker non installé - installation..."
    ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    print_success "Docker installé"
fi

print_step "Vérification de Docker Compose sur le VPS..."
if ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "docker-compose --version" >/dev/null 2>&1; then
    COMPOSE_VERSION=$(ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "docker-compose --version")
    print_success "$COMPOSE_VERSION"
else
    print_warning "Docker Compose non installé - installation..."
    ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose"
    print_success "Docker Compose installé"
fi

print_step "Vérification des dossiers de déploiement..."
if ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "ls -la /var/www/geneaia*" >/dev/null 2>&1; then
    print_success "Dossiers de déploiement présents"
else
    print_warning "Dossiers de déploiement manquants - création..."
    ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "mkdir -p /var/www/geneaia /var/www/geneaia-staging"
    print_success "Dossiers créés"
fi

print_step "Installation de Nginx..."
if ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "nginx -v" >/dev/null 2>&1; then
    print_success "Nginx installé"
else
    print_warning "Installation de Nginx..."
    ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "apt update && apt install nginx -y"
    print_success "Nginx installé"
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
CONTAINERS=$(ssh -i ~/.ssh/geneaia_deploy root@$VPS_IP "docker ps --format 'table {{.Names}}\t{{.Status}}'" 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    print_success "Containers en cours d'exécution :"
    echo "$CONTAINERS"
else
    print_warning "Aucun container en cours d'exécution"
fi

print_header "📋 RÉSUMÉ"

echo -e "${GREEN}🎯 VPS configuré avec utilisateur ROOT !${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes :${NC}"
echo "1️⃣ Configurer les secrets GitHub avec USER = root"
echo "2️⃣ Pousser vers staging : git push origin staging"
echo "3️⃣ Surveiller GitHub Actions"
echo ""

echo -e "${BLUE}🌐 URLs à tester après déploiement :${NC}"
echo "   Staging     : http://$VPS_IP:3000"
echo "   Production  : http://$VPS_IP"
echo "   API         : http://$VPS_IP:3001/api"
echo ""

echo -e "${GREEN}✅ Votre VPS est prêt pour le déploiement !${NC}"
