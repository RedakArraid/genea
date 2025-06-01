#!/bin/bash

# 🏗️ Script de préparation du VPS pour GeneaIA
# À exécuter sur votre serveur VPS

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables
DEPLOY_USER=$(whoami)
PROJECT_PATH="/var/www/geneaia"
STAGING_PATH="/var/www/geneaia-staging"

log_info "🚀 Préparation du VPS pour GeneaIA"
log_info "Utilisateur: $DEPLOY_USER"

# 1. Mise à jour du système
log_info "📦 Mise à jour du système..."
sudo apt update
sudo apt upgrade -y

# 2. Installation des dépendances
log_info "🔧 Installation des dépendances..."
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    ufw \
    fail2ban \
    nginx \
    certbot \
    python3-certbot-nginx

# 3. Installation de Docker
log_info "🐳 Installation de Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $DEPLOY_USER
    rm get-docker.sh
    log_success "Docker installé"
else
    log_info "Docker déjà installé"
fi

# 4. Installation de Docker Compose
log_info "🐙 Installation de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installé"
else
    log_info "Docker Compose déjà installé"
fi

# 5. Création des répertoires du projet
log_info "📁 Création des répertoires..."
sudo mkdir -p $PROJECT_PATH
sudo mkdir -p $STAGING_PATH
sudo mkdir -p /var/log/geneaia
sudo mkdir -p /var/uploads/geneaia
sudo chown -R $DEPLOY_USER:$DEPLOY_USER $PROJECT_PATH
sudo chown -R $DEPLOY_USER:$DEPLOY_USER $STAGING_PATH
sudo chown -R $DEPLOY_USER:$DEPLOY_USER /var/log/geneaia
sudo chown -R $DEPLOY_USER:$DEPLOY_USER /var/uploads/geneaia

# 6. Configuration du firewall
log_info "🔥 Configuration du firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 7. Configuration de Fail2Ban
log_info "🛡️ Configuration de Fail2Ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# 8. Configuration SSH sécurisée
log_info "🔐 Sécurisation SSH..."
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Désactiver l'authentification par mot de passe pour root
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Redémarrer SSH
sudo systemctl restart sshd

# 9. Installation de PostgreSQL
log_info "🗄️ Installation de PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    log_success "PostgreSQL installé"
else
    log_info "PostgreSQL déjà installé"
fi

# 10. Configuration des bases de données
log_info "📊 Configuration des bases de données..."

# Base production
sudo -u postgres psql -c "CREATE DATABASE geneaia_production;" 2>/dev/null || log_info "Base production existe déjà"
sudo -u postgres psql -c "CREATE USER geneaia_prod WITH ENCRYPTED PASSWORD 'CHANGEME_PROD_PASSWORD';" 2>/dev/null || log_info "Utilisateur production existe déjà"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE geneaia_production TO geneaia_prod;" 2>/dev/null

# Base staging
sudo -u postgres psql -c "CREATE DATABASE geneaia_staging;" 2>/dev/null || log_info "Base staging existe déjà"
sudo -u postgres psql -c "CREATE USER geneaia_staging WITH ENCRYPTED PASSWORD 'CHANGEME_STAGING_PASSWORD';" 2>/dev/null || log_info "Utilisateur staging existe déjà"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE geneaia_staging TO geneaia_staging;" 2>/dev/null

# 11. Configuration Nginx de base
log_info "🌐 Configuration Nginx..."
sudo tee /etc/nginx/sites-available/geneaia > /dev/null <<EOF
# Configuration de base - sera remplacée par les fichiers du projet
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    
    server_name _;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/geneaia /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 12. Configuration des logs
log_info "📋 Configuration des logs..."
sudo tee /etc/logrotate.d/geneaia > /dev/null <<EOF
/var/log/geneaia/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
}
EOF

# 13. Script de nettoyage Docker
log_info "🧹 Création du script de nettoyage..."
tee $PROJECT_PATH/cleanup-docker.sh > /dev/null <<EOF
#!/bin/bash
# Nettoyage Docker automatique
docker system prune -f
docker volume prune -f
docker image prune -a -f
EOF
chmod +x $PROJECT_PATH/cleanup-docker.sh

# 14. Cron job pour nettoyage
log_info "⏰ Configuration du nettoyage automatique..."
(crontab -l 2>/dev/null; echo "0 2 * * 0 $PROJECT_PATH/cleanup-docker.sh") | crontab -

# 15. Vérification des versions
log_info "📊 Vérification des installations..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Docker: $(docker --version)"
echo "🐙 Docker Compose: $(docker-compose --version)"
echo "🗄️ PostgreSQL: $(psql --version)"
echo "🌐 Nginx: $(nginx -v 2>&1)"
echo "🔥 UFW: $(sudo ufw status | head -1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_success "🎉 VPS préparé avec succès !"
echo ""
log_warning "⚠️  PROCHAINES ÉTAPES IMPORTANTES :"
echo "1. 🔑 Ajouter votre clé SSH publique : echo 'VOTRE_CLE_PUBLIQUE' >> ~/.ssh/authorized_keys"
echo "2. 🔐 Changer les mots de passe BDD dans /etc/postgresql/*/main/postgresql.conf"
echo "3. 🌐 Configurer votre domaine DNS vers cette IP"
echo "4. 📧 Configurer les secrets GitHub avec les informations de ce serveur"
echo "5. 🚀 Tester le déploiement depuis GitHub Actions"
echo ""
log_info "📝 Adresse IP de ce serveur : $(curl -s ifconfig.me)"
echo ""
log_warning "🔒 Déconnectez-vous et reconnectez-vous pour activer le groupe Docker"
