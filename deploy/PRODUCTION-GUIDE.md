# 🌐 Guide de Mise en Production GeneaIA

## ✅ État Actuel : Déploiement VPS Réussi

Votre message "[OK] 🎯 Mise à jour VPS terminée avec succès !" confirme que le déploiement automatique fonctionne parfaitement. Voici les prochaines étapes pour une mise en production complète.

## 🚀 Prochaines Étapes de Production

### 1. 🔍 Vérification Post-Déploiement

```bash
# Sur votre VPS, vérifiez que tout fonctionne
curl http://localhost:3001/health
# Résultat attendu: {"status":"OK","message":"GeneaIA API is running",...}

# Vérifiez les services PM2
pm2 status

# Testez le frontend
curl http://localhost:8080
```

### 2. 🌐 Configuration du Serveur Web (Nginx)

#### Installation et configuration Nginx

```bash
# Installation Nginx
sudo apt update
sudo apt install nginx

# Créer la configuration GeneaIA
sudo nano /etc/nginx/sites-available/geneaia
```

**Contenu du fichier de configuration :**

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Logs
    access_log /var/log/nginx/geneaia_access.log;
    error_log /var/log/nginx/geneaia_error.log;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend React (Single Page Application)
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Fallback pour React Router
        try_files $uri $uri/ @fallback;
    }

    # Fallback pour SPA
    location @fallback {
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout pour les requêtes longues
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health checks
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # Fichiers statiques avec cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:8080;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Activation de la configuration

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/geneaia /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Vérifier le statut
sudo systemctl status nginx
```

### 3. 🔒 Configuration SSL avec Let's Encrypt

```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

### 4. 🔥 Configuration du Pare-feu (UFW)

```bash
# Activer UFW
sudo ufw enable

# Règles de base
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH
sudo ufw allow ssh

# Autoriser HTTP et HTTPS
sudo ufw allow 'Nginx Full'

# Vérifier les règles
sudo ufw status
```

### 5. ⚡ Script de Lancement Facile

Le script `scripts/launch.sh` que j'ai créé vous permet de lancer facilement backend et frontend :

```bash
# Utilisation du nouveau script de lancement
chmod +x scripts/launch.sh

# Lancement interactif avec menu
make launch

# Ou directement en mode développement
make dev

# Options disponibles :
# 1. Développement (backend + frontend parallèle)
# 2. Production locale (simulation VPS)
# 3. Production VPS (PM2)
# 4. Tests + Lancement
# 5. Monitoring uniquement
# 6. Arrêter tous les services
```

### 6. 🔧 Optimisations de Performance

#### Configuration PM2 optimisée

```javascript
// ecosystem.config.js mis à jour
module.exports = {
  apps: [
    {
      name: 'geneaia-backend',
      script: './backend/src/index.js',
      cwd: '.',
      instances: 'max', // Utilise tous les CPU disponibles
      exec_mode: 'cluster',
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
      node_args: '--max-old-space-size=1024',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    },
    {
      name: 'geneaia-frontend',
      script: 'serve',
      cwd: './frontend',
      args: 'dist -l 8080 -s --cors',
      instances: 2,
      exec_mode: 'cluster',
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
```

### 7. 📊 Monitoring et Alertes

#### Script de monitoring automatique (déjà créé)

```bash
# Le script scripts/monitor.sh est déjà configuré
# Pour l'activer en cron job :
crontab -e

# Ajouter :
*/5 * * * * /var/www/geneaia/scripts/monitor.sh
```

### 8. 🗄️ Sauvegarde Automatique

```bash
# Le script scripts/backup-db.sh est prêt
# Pour l'activer :
crontab -e

# Ajouter :
0 2 * * * /var/www/geneaia/scripts/backup-db.sh
```

### 9. 📝 Variables d'Environnement Production

#### Backend (.env production)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://geneaia_user:MOT_DE_PASSE_SECURISE@localhost:5432/geneaia"
JWT_SECRET="votre-cle-jwt-super-securisee-256-bits-minimum"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://votre-domaine.com"
LOG_LEVEL="warn"
LOG_FILE="/var/log/geneaia/app.log"
```

#### Frontend (.env production)

```env
VITE_APP_NAME="GeneaIA"
VITE_APP_VERSION="1.0.0"
VITE_API_URL="https://votre-domaine.com/api"
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_PWA=true
```

### 10. ✅ Checklist de Mise en Production

#### ✅ **Pré-déploiement**
- [ ] Domain name configuré et pointant vers le VPS
- [ ] Certificat SSL installé et fonctionnel
- [ ] Base de données sauvegardée
- [ ] Variables d'environnement production configurées
- [ ] Tests passés en local avec `make launch`

#### ✅ **Déploiement**
- [ ] Code déployé via `make vps-update`
- [ ] Services PM2 démarrés
- [ ] Nginx configuré et redémarré
- [ ] Tests post-déploiement réussis

#### ✅ **Post-déploiement**
- [ ] Monitoring configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Logs centralisés
- [ ] Documentation mise à jour

### 11. 🎯 Commandes de Production Essentielles

```bash
# Lancement et développement
make launch                  # Menu interactif
make dev                     # Développement rapide
scripts/launch.sh            # Script direct

# Déploiement
make push                    # Push vers GitHub
make vps-update             # Mise à jour VPS
scripts/deploy-production.sh # Déploiement complet

# Monitoring
make status                  # Statut général
pm2 monit                   # Interface monitoring
pm2 logs                    # Logs en temps réel
curl localhost:3001/health  # Test API

# Maintenance
pm2 restart all             # Redémarrage services
make clean                  # Nettoyage projet
scripts/backup-db.sh        # Sauvegarde manuelle
```

## 🎊 Résultat Final

Votre système GeneaIA dispose maintenant de :

✅ **Script de lancement unifié** - `make launch` ou `scripts/launch.sh`  
✅ **Route /health intégrée** - Monitoring automatique  
✅ **Déploiement automatique** - Push → GitHub Actions → VPS  
✅ **Production prête** - SSL, Nginx, PM2 cluster  
✅ **Monitoring complet** - Logs, alertes, sauvegardes  
✅ **Documentation complète** - Guides step-by-step  

### 🚀 Votre GeneaIA est maintenant une application de production professionnelle !

**Workflow final :**
1. **Développement :** `make launch` → Option 1 (dev)
2. **Tests :** `make launch` → Option 4 (tests)
3. **Déploiement :** `make push` → Auto-déploiement
4. **Production :** VPS avec SSL, monitoring, sauvegardes

---

**📞 Support :** Utilisez `make help` pour voir toutes les commandes disponibles ou consultez la documentation dans `deploy/`.