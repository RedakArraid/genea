#!/bin/bash

# 🔧 Script de Configuration Initiale du Déploiement GeneaIA
# À exécuter une seule fois pour configurer le déploiement automatique

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[SETUP]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🔧 CONFIGURATION DÉPLOIEMENT GENEAIA 🔧           ║"
echo "║                Setup initial automatisé                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Ce script doit être exécuté depuis la racine du projet geneaIA"
    exit 1
fi

step "1/8 📋 Configuration Git et GitHub"

# Vérifier Git
if ! command -v git >/dev/null 2>&1; then
    error "Git n'est pas installé"
    exit 1
fi

# Initialiser le repo si nécessaire
if [ ! -d ".git" ]; then
    log "📦 Initialisation du repository Git..."
    git init
    success "✅ Repository Git initialisé"
fi

# Configurer le remote si nécessaire
if ! git remote get-url origin >/dev/null 2>&1; then
    echo ""
    log "🔗 Configuration du repository GitHub..."
    read -p "Entrez l'URL de votre repository GitHub: " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        success "✅ Remote GitHub configuré: $REPO_URL"
    else
        warn "⚠️ Repository non configuré, vous pourrez le faire plus tard"
    fi
fi

step "2/8 📁 Création de la structure de déploiement"

# Créer les dossiers nécessaires
mkdir -p deploy/logs
mkdir -p deploy/backups
mkdir -p deploy/configs

success "✅ Structure de dossiers créée"

step "3/8 🔐 Configuration des fichiers d'environnement"

# Backend .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        log "📄 Fichier backend/.env créé à partir de .env.example"
    else
        cat > backend/.env << 'EOF'
# Configuration Backend GeneaIA
NODE_ENV=development
PORT=3001

# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/geneaia"

# JWT
JWT_SECRET="votre-secret-jwt-tres-long-et-securise-32-caracteres-minimum"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760

# Email (optionnel)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EOF
        log "📄 Fichier backend/.env créé avec template par défaut"
    fi
    
    warn "⚠️ Configurez backend/.env avec vos paramètres avant de déployer"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        log "📄 Fichier frontend/.env créé à partir de .env.example"
    else
        cat > frontend/.env << 'EOF'
# Configuration Frontend GeneaIA
VITE_APP_NAME="GeneaIA"
VITE_API_URL="http://localhost:3001/api"
VITE_UPLOAD_MAX_SIZE=10485760
EOF
        log "📄 Fichier frontend/.env créé avec template par défaut"
    fi
    
    warn "⚠️ Configurez frontend/.env avec vos paramètres"
fi

success "✅ Fichiers d'environnement configurés"

step "4/8 🔧 Configuration des scripts"

# Rendre tous les scripts exécutables
chmod +x scripts/*.sh
chmod +x Makefile 2>/dev/null || true

success "✅ Scripts configurés et rendus exécutables"

step "5/8 📦 Installation des dépendances"

log "Installation des dépendances du projet principal..."
npm install

log "Installation des dépendances backend..."
cd backend && npm install
if [ -f "prisma/schema.prisma" ]; then
    log "Génération du client Prisma..."
    npx prisma generate
fi
cd ..

log "Installation des dépendances frontend..."
cd frontend && npm install
cd ..

success "✅ Toutes les dépendances installées"

step "6/8 🎨 Configuration GitHub Actions"

# Vérifier que le workflow existe et est à jour
if [ -f ".github/workflows/deploy.yml" ]; then
    success "✅ GitHub Actions déjà configuré"
else
    mkdir -p .github/workflows
    # Le fichier existe déjà d'après notre analyse
    success "✅ Structure GitHub Actions créée"
fi

step "7/8 📋 Configuration PM2 (pour VPS)"

# Créer le fichier de configuration PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'geneaia-backend',
      script: './backend/src/index.js',
      cwd: '.',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './deploy/logs/backend-error.log',
      out_file: './deploy/logs/backend-out.log',
      log_file: './deploy/logs/backend-combined.log',
      time: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'geneaia-frontend',
      script: 'serve',
      cwd: './frontend',
      args: 'dist -l 8080',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './deploy/logs/frontend-error.log',
      out_file: './deploy/logs/frontend-out.log',
      log_file: './deploy/logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF

success "✅ Configuration PM2 créée"

step "8/8 📋 Création du guide de déploiement VPS"

cat > deploy/VPS-SETUP.md << 'EOF'
# 🌐 Guide de Configuration VPS pour GeneaIA

## 🚀 Installation Initiale sur VPS

### 1. Prérequis système

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# PM2 global
sudo npm install -g pm2 serve

# Git (si pas déjà installé)
sudo apt install git

# Nginx (optionnel pour reverse proxy)
sudo apt install nginx
```

### 2. Configuration PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base et l'utilisateur
CREATE DATABASE geneaia;
CREATE USER geneaia_user WITH PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE geneaia TO geneaia_user;
\q
```

### 3. Clonage et configuration du projet

```bash
# Cloner le projet
cd /var/www
sudo git clone https://github.com/votre-username/geneaia.git
sudo chown -R $USER:$USER geneaia
cd geneaia

# Configurer les variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Modifier les fichiers .env avec vos paramètres
nano backend/.env
nano frontend/.env
```

### 4. Premier déploiement

```bash
# Installation et configuration
make vps-setup

# Ou étape par étape :
npm install
cd backend && npm install && npx prisma migrate deploy
cd ../frontend && npm install && npm run build
cd ..

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configuration Nginx (optionnel)

```nginx
# /etc/nginx/sites-available/geneaia
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/geneaia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Workflow de Mise à Jour

### Automatique (recommandé)

```bash
cd /var/www/geneaia
git pull
make vps-update
```

### Manuel

```bash
cd /var/www/geneaia

# 1. Sauvegarder la config
cp backend/.env ../backup_env_backend
cp frontend/.env ../backup_env_frontend

# 2. Récupérer les changements
git pull

# 3. Restaurer la config si écrasée
cp ../backup_env_backend backend/.env
cp ../backup_env_frontend frontend/.env

# 4. Mettre à jour
npm install
cd backend && npm install && npx prisma migrate deploy
cd ../frontend && npm install && npm run build
cd ..

# 5. Redémarrer
pm2 restart all
```

## 📊 Monitoring

```bash
# Statut PM2
pm2 status

# Logs en temps réel
pm2 logs

# Monitoring complet
pm2 monit

# Vérifier les services
make status
```

## 🔧 Dépannage

### Service ne démarre pas
```bash
# Vérifier les logs
pm2 logs geneaia-backend
pm2 logs geneaia-frontend

# Redémarrer un service spécifique
pm2 restart geneaia-backend
```

### Base de données
```bash
# Tester la connexion
cd backend
npx prisma db push --accept-data-loss

# Reset si nécessaire
npx prisma migrate reset --force
```

### Permissions
```bash
# Régler les permissions
sudo chown -R $USER:$USER /var/www/geneaia
chmod +x scripts/*.sh
```
EOF

success "✅ Guide VPS créé"

# Résumé final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               ✅ CONFIGURATION TERMINÉE !                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

success "🎉 Déploiement automatique GeneaIA configuré !"

echo ""
log "📋 Prochaines étapes :"
echo "   1. Configurez backend/.env et frontend/.env"
echo "   2. make push          # Premier push vers GitHub"
echo "   3. Sur VPS: git clone + make vps-setup"
echo "   4. Ensuite: git pull + make vps-update"

echo ""
log "🌐 GitHub Actions :"
echo "   - Configurez les secrets dans GitHub:"
echo "     * VPS_HOST (IP de votre VPS)"
echo "     * VPS_USER (utilisateur SSH)"
echo "     * VPS_SSH_KEY (clé privée SSH)"
echo "     * VPS_PATH (/var/www/geneaia)"
echo "     * VITE_API_URL (URL de production)"

echo ""
log "🔧 Commandes disponibles :"
echo "   make dev              # Développement local"
echo "   make push             # Push vers GitHub"
echo "   make vps-update       # Mise à jour VPS"
echo "   make help             # Aide complète"

echo ""
warn "⚠️ N'oubliez pas de :"
echo "   - Configurer les fichiers .env"
echo "   - Tester en local avant de déployer"
echo "   - Configurer les secrets GitHub pour CI/CD"

echo ""
success "🎯 Configuration du déploiement automatique terminée !"
