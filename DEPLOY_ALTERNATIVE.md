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
mkdir -p /var/www/geneaia-staging
mkdir -p /var/www/geneaia-production

# Créer la configuration staging
cd /var/www/geneaia-staging

cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: geneaia-db-staging
    environment:
      POSTGRES_DB: geneaia_staging
      POSTGRES_USER: geneaia_staging
      POSTGRES_PASSWORD: 7xRr77PJmojqFftNgfmgeovF8
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U geneaia_staging -d geneaia_staging"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/redakarraid/geneaia-backend:staging
    container_name: geneaia-backend-staging
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://geneaia_staging:7xRr77PJmojqFftNgfmgeovF8@postgres:5432/geneaia_staging?schema=public
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
    image: ghcr.io/redakarraid/geneaia-frontend:staging
    container_name: geneaia-frontend-staging
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
cd /Users/kader/Desktop/projet-en-cours/geneaIA

# Build backend
cd backend
docker build -t geneaia-backend:local .

# Build frontend  
cd ../frontend
docker build -t geneaia-frontend:local .
```

### 2. Sauvegarder et transférer les images

```bash
# Sauvegarder les images
docker save geneaia-backend:local > geneaia-backend.tar
docker save geneaia-frontend:local > geneaia-frontend.tar

# Transférer vers le serveur (avec votre méthode SSH qui marche)
scp geneaia-backend.tar root@168.231.86.179:/tmp/
scp geneaia-frontend.tar root@168.231.86.179:/tmp/
```

### 3. Charger sur le serveur

```bash
# Sur le serveur
ssh root@168.231.86.179

# Charger les images
docker load < /tmp/geneaia-backend.tar
docker load < /tmp/geneaia-frontend.tar

# Modifier le docker-compose.yml pour utiliser les images locales
cd /var/www/geneaia-staging
sed -i 's/ghcr.io\/redakarraid\/geneaia-backend:staging/geneaia-backend:local/g' docker-compose.yml
sed -i 's/ghcr.io\/redakarraid\/geneaia-frontend:staging/geneaia-frontend:local/g' docker-compose.yml

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
ssh-add ~/.ssh/geneaia-deploy
```

### 2. Méthode de clé SSH alternative

```bash
# Créer une nouvelle clé avec un autre format
ssh-keygen -t rsa -b 4096 -C "geneaia-deploy" -f ~/.ssh/geneaia-rsa

# Copier la clé (méthode manuelle)
cat ~/.ssh/geneaia-rsa.pub

# Sur le serveur, ajouter manuellement dans authorized_keys
echo "VOTRE_CLE_PUBLIQUE_ICI" >> ~/.ssh/authorized_keys

# Tester
ssh -i ~/.ssh/geneaia-rsa root@168.231.86.179
```

### 3. Une fois SSH réparé

```bash
# Mettre à jour GitHub Secrets avec la nouvelle clé
cat ~/.ssh/geneaia-rsa

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
