# 🚀 Déploiement alternatif - Résolution SSH

## Option 1 : Utiliser votre clé SSH existante

Si vous avez déjà accès au serveur avec une autre clé SSH :

### 1. Identifier votre clé SSH actuelle

```bash
# Lister vos clés SSH
ls -la ~/.ssh/

# Tester les clés existantes
ssh root@168.231.86.179
```

### 2. Utiliser votre clé existante dans GitHub Secrets

Une fois que vous trouvez la clé qui fonctionne, utilisez-la :

```bash
# Si c'est ~/.ssh/id_rsa par exemple
cat ~/.ssh/id_rsa

# Copier le contenu COMPLET dans GitHub Secrets
# Pour STAGING_SSH_KEY et PROD_SSH_KEY
```

## Option 2 : Déploiement manuel temporaire

En attendant de résoudre le SSH automatique :

### 1. Se connecter au serveur manuellement

```bash
# Avec votre méthode habituelle
ssh root@168.231.86.179
```

### 2. Installation manuelle sur le serveur

```bash
# Sur le serveur, créer les dossiers
mkdir -p /var/www/geneamap-staging
mkdir -p /var/www/geneamap-production

# Créer la configuration staging
cd /var/www/geneamap-staging

cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: geneamap-db-staging
    environment:
      POSTGRES_DB: geneamap_staging
      POSTGRES_USER: geneamap_staging
      POSTGRES_PASSWORD: 7xRr77PJmojqFftNgfmgeovF8
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U geneamap_staging -d geneamap_staging"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/redakarraid/geneamap-backend:staging
    container_name: geneamap-backend-staging
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://geneamap_staging:7xRr77PJmojqFftNgfmgeovF8@postgres:5432/geneamap_staging?schema=public
      - JWT_SECRET=2nyEzaFtRa0iXSJYGTIUdMPet
      - CORS_ORIGIN=http://168.231.86.179:3010
      - PORT=3001
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "3011:3001"

  frontend:
    image: ghcr.io/redakarraid/geneamap-frontend:staging
    container_name: geneamap-frontend-staging
    restart: unless-stopped
    ports:
      - "3010:80"

volumes:
  postgres_staging_data:
    driver: local
EOF

# Démarrer les services
docker-compose up -d

# Vérifier
docker-compose ps
docker-compose logs
```

## Option 3 : Construire et déployer localement

### 1. Build des images en local

```bash
cd /Users/kader/Desktop/projet-en-cours/geneamap

# Build backend
cd backend
docker build -t geneamap-backend:local .

# Build frontend  
cd ../frontend
docker build -t geneamap-frontend:local .
```

### 2. Sauvegarder et transférer les images

```bash
# Sauvegarder les images
docker save geneamap-backend:local > geneamap-backend.tar
docker save geneamap-frontend:local > geneamap-frontend.tar

# Transférer vers le serveur (avec votre méthode SSH qui marche)
scp geneamap-backend.tar root@168.231.86.179:/tmp/
scp geneamap-frontend.tar root@168.231.86.179:/tmp/
```

### 3. Charger sur le serveur

```bash
# Sur le serveur
ssh root@168.231.86.179

# Charger les images
docker load < /tmp/geneamap-backend.tar
docker load < /tmp/geneamap-frontend.tar

# Modifier le docker-compose.yml pour utiliser les images locales
cd /var/www/geneamap-staging
sed -i 's/ghcr.io\/redakarraid\/geneamap-backend:staging/geneamap-backend:local/g' docker-compose.yml
sed -i 's/ghcr.io\/redakarraid\/geneamap-frontend:staging/geneamap-frontend:local/g' docker-compose.yml

# Redémarrer
docker-compose up -d
```

## Option 4 : Fix SSH et retry

### 1. Diagnostique SSH avancé

```bash
# Test de connexion détaillé
ssh -vvv root@168.231.86.179

# Vérifier l'agent SSH
ssh-add -l

# Ajouter la clé à l'agent
ssh-add ~/.ssh/geneamap-deploy
```

### 2. Méthode de clé SSH alternative

```bash
# Créer une nouvelle clé avec un autre format
ssh-keygen -t rsa -b 4096 -C "geneamap-deploy" -f ~/.ssh/geneamap-rsa

# Copier la clé (méthode manuelle)
cat ~/.ssh/geneamap-rsa.pub

# Sur le serveur, ajouter manuellement dans authorized_keys
echo "VOTRE_CLE_PUBLIQUE_ICI" >> ~/.ssh/authorized_keys

# Tester
ssh -i ~/.ssh/geneamap-rsa root@168.231.86.179
```

### 3. Une fois SSH réparé

```bash
# Mettre à jour GitHub Secrets avec la nouvelle clé
cat ~/.ssh/geneamap-rsa

# Copier dans STAGING_SSH_KEY et PROD_SSH_KEY sur GitHub

# Relancer le déploiement
git add .
git commit -m "🔧 Fix: SSH key updated"
git push origin staging
```

## 🎯 Action recommandée

**Commencez par Option 1** : identifier votre clé SSH qui fonctionne déjà.

Si vous pouvez vous connecter au serveur, l'Option 2 (déploiement manuel) vous permettra d'avoir l'app en ligne rapidement pendant qu'on résout le SSH automatique.

**Questions pour vous aider :**
1. Pouvez-vous vous connecter au serveur avec `ssh root@168.231.86.179` sans spécifier de clé ?
2. Avez-vous une clé SSH qui fonctionne déjà ?
3. Voulez-vous d'abord faire un déploiement manuel pour voir l'app fonctionner ?
