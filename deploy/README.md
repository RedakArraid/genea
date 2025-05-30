# 🚀 GeneaIA - Guide de Déploiement Automatisé

## ⚡ Démarrage Ultra-Rapide

### 1. Configuration initiale (une seule fois)

```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh
chmod +x Makefile

# Configuration du développement
make dev-setup

# Premier push vers GitHub
make push
```

### 2. Workflow quotidien de développement

```bash
# Développement local
make dev

# Tests (optionnel)
make test

# Déploiement vers GitHub
make push
# ou avec un message personnalisé
make push-msg
```

### 3. Déploiement sur VPS

**Première installation sur le VPS :**

```bash
# Sur votre VPS
git clone https://github.com/votre-username/geneaia.git
cd geneaia

# Configuration initiale
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Modifiez les fichiers .env avec vos paramètres

# Installation et démarrage
make vps-setup
```

**Mises à jour régulières :**

```bash
# Sur votre VPS
git pull
make vps-update
```

## 🎛️ Commandes Principales

| Commande | Description |
|----------|-------------|
| `make dev` | 🔧 Démarrer en développement |
| `make push` | 🚀 Push vers GitHub |
| `make deploy` | 🚀 Build + Push |
| `make vps-update` | 🌐 Mise à jour VPS |
| `make status` | 📊 Statut des services |
| `make help` | 📖 Aide complète |

## 🔧 Configuration

### Variables d'environnement à configurer

**Backend (backend/.env) :**
```bash
NODE_ENV=production
DATABASE_URL="postgresql://user:password@localhost:5432/geneaia"
JWT_SECRET="votre-secret-32-caracteres-minimum"
PORT=3001
CORS_ORIGIN="https://votre-domaine.com"
```

**Frontend (frontend/.env) :**
```bash
VITE_APP_NAME="GeneaIA"
VITE_API_URL="https://votre-domaine.com/api"
```

## 🤖 GitHub Actions

Les workflows CI/CD se déclenchent automatiquement :
- **Push sur main/master** → Tests + déploiement
- **Pull Request** → Tests seulement

### Secrets GitHub à configurer :
- `VPS_HOST` : IP de votre VPS
- `VPS_USER` : Utilisateur SSH
- `VPS_SSH_KEY` : Clé privée SSH
- `VPS_PATH` : Chemin sur le VPS (ex: /var/www/geneaia)
- `VITE_API_URL` : URL de l'API en production

## 🌐 Configuration VPS

### Prérequis
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# PM2
sudo npm install -g pm2

# Nginx (optionnel)
sudo apt install nginx
```

### Service systemd (optionnel)
```bash
# Créer le service
sudo nano /etc/systemd/system/geneaia.service

# Contenu du fichier :
[Unit]
Description=GeneaIA Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/geneaia/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# Activer le service
sudo systemctl enable geneaia
sudo systemctl start geneaia
```

## 🆘 Dépannage

### Problèmes courants

**Erreur de permission :**
```bash
chmod +x scripts/*.sh
```

**Erreur de base de données :**
```bash
make config-check  # Vérifier la config
make db-setup      # Reconfigurer la DB
```

**Services non démarrés :**
```bash
make status        # Voir l'état
make restart       # Redémarrer
make logs          # Voir les logs
```

## 📊 Monitoring

```bash
make status        # État général
make logs          # Logs en temps réel
pm2 monit         # Interface PM2
```

## 🔄 Workflow Complet

### Développement → Production

1. **Développement local :**
   ```bash
   make dev
   # Développer vos fonctionnalités
   ```

2. **Tests :**
   ```bash
   make test
   ```

3. **Déploiement :**
   ```bash
   make deploy
   ```

4. **Sur le VPS :**
   ```bash
   git pull
   make vps-update
   ```

### Mise à jour d'urgence
```bash
# Local
make push-msg   # Avec message explicite

# VPS (immédiatement)
git pull && make vps-update
```

---

**🎯 Votre projet GeneaIA est maintenant prêt pour un déploiement automatisé !**

Utilisez `make help` pour voir toutes les commandes disponibles.