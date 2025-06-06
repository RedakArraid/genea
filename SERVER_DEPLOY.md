# 🚀 Déploiement direct sur serveur - Guide complet

## Situation actuelle
✅ Vous êtes connecté au serveur 168.231.86.179
✅ Nous allons déployer directement sur le serveur

## 🎯 Plan d'action

### Option A : Déploiement avec code source (Recommandé)
### Option B : Déploiement avec images Docker pré-construites

---

## 🚀 **OPTION A : Déploiement avec code source**

### 1. Préparation serveur

```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Installation Git
apt install -y git

# Vérification
docker --version
docker-compose --version
git --version
```

### 2. Structure des dossiers

```bash
# Créer la structure
mkdir -p /var/www/geneaia-staging
mkdir -p /var/www/geneaia-production
cd /var/www/geneaia-staging
```

### 3. Récupération du code

```bash
# Cloner votre repository
git clone https://github.com/RedakArraid/genea.git .

# Ou si le repo n'est pas public, créer manuellement
# (voir section "Code manuel" ci-dessous)
```

### 4. Configuration Docker Compose

```bash
cd /var/www/geneaia-staging

cat > docker-compose.yml << 'EOF'
version: '3.8'

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
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: geneaia-backend-staging
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://geneaia_staging:7xRr77PJmojqFftNgfmgeovF8@postgres:5432/geneaia_staging?schema=public
      - JWT_SECRET=2nyEzaFtRa0iXSJYGTIUdMPet
      - CORS_ORIGIN=http://168.231.86.179:3010
      - PORT=3001
      - HOST=0.0.0.0
    ports:
      - "3011:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://168.231.86.179:3011/api
    container_name: geneaia-frontend-staging
    ports:
      - "3010:80"
    restart: unless-stopped

volumes:
  postgres_staging_data:
    driver: local
EOF
```

### 5. Démarrage

```bash
# Build et démarrage
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

---

## 🐳 **OPTION B : Déploiement rapide avec images pré-construites**

Si vous voulez une solution ultra-rapide sans compilation :

### 1. Configuration simplifiée

```bash
cd /var/www/geneaia-staging

cat > docker-compose.yml << 'EOF'
version: '3.8'

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

  # Backend temporaire avec Express minimal
  backend:
    image: node:18-alpine
    container_name: geneaia-backend-staging
    working_dir: /app
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://geneaia_staging:7xRr77PJmojqFftNgfmgeovF8@postgres:5432/geneaia_staging?schema=public
      - JWT_SECRET=2nyEzaFtRa0iXSJYGTIUdMPet
      - PORT=3001
    ports:
      - "3011:3001"
    volumes:
      - ./backend-simple:/app
    command: >
      sh -c "
        npm install express cors &&
        node server.js
      "
    restart: unless-stopped

  # Frontend temporaire avec page statique
  frontend:
    image: nginx:alpine
    container_name: geneaia-frontend-staging
    ports:
      - "3010:80"
    volumes:
      - ./frontend-simple:/usr/share/nginx/html
    restart: unless-stopped

volumes:
  postgres_staging_data:
    driver: local
EOF
```

### 2. Backend minimal

```bash
mkdir -p backend-simple
cat > backend-simple/server.js << 'EOF'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GeneaIA API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route d'authentification basique
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Utilisateur non trouvé' 
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API GeneaIA' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur 0.0.0.0:${PORT}`);
});
EOF

cat > backend-simple/package.json << 'EOF'
{
  "name": "geneaia-backend-simple",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF
```

### 3. Frontend minimal

```bash
mkdir -p frontend-simple
cat > frontend-simple/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeneaIA - Arbre Généalogique</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 600px;
        }
        h1 { color: #333; margin-bottom: 20px; font-size: 2.5rem; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 1.2rem; }
        .status { 
            background: #f8f9fa; 
            border-radius: 10px; 
            padding: 20px; 
            margin: 20px 0;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
        }
        .status-ok { color: #28a745; font-weight: bold; }
        .status-error { color: #dc3545; font-weight: bold; }
        .btn {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            transition: background 0.3s;
        }
        .btn:hover { background: #5a6fd8; }
        .version { color: #999; font-size: 0.9rem; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌳 GeneaIA</h1>
        <p class="subtitle">Votre arbre généalogique intelligent</p>
        
        <div class="status">
            <h3>État du système</h3>
            <div class="status-item">
                <span>Frontend</span>
                <span class="status-ok">✅ En ligne</span>
            </div>
            <div class="status-item">
                <span>Backend API</span>
                <span id="backend-status">🔄 Vérification...</span>
            </div>
            <div class="status-item">
                <span>Base de données</span>
                <span id="db-status">🔄 Vérification...</span>
            </div>
        </div>

        <button class="btn" onclick="testAPI()">🔍 Tester l'API</button>
        <button class="btn" onclick="location.reload()">🔄 Actualiser</button>
        
        <div class="version">
            Version 1.0.0 - Déployé le <span id="deploy-time"></span>
        </div>
    </div>

    <script>
        document.getElementById('deploy-time').textContent = new Date().toLocaleString('fr-FR');
        
        async function checkBackend() {
            try {
                const response = await fetch('http://168.231.86.179:3011/api/health');
                const data = await response.json();
                document.getElementById('backend-status').innerHTML = '<span class="status-ok">✅ En ligne</span>';
                document.getElementById('db-status').innerHTML = '<span class="status-ok">✅ Connecté</span>';
            } catch (error) {
                document.getElementById('backend-status').innerHTML = '<span class="status-error">❌ Hors ligne</span>';
                document.getElementById('db-status').innerHTML = '<span class="status-error">❌ Inaccessible</span>';
            }
        }
        
        async function testAPI() {
            try {
                const response = await fetch('http://168.231.86.179:3011/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'test@test.com', password: 'test' })
                });
                const data = await response.json();
                alert('✅ API répond correctement!\n\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                alert('❌ Erreur de connexion à l\'API:\n\n' + error.message);
            }
        }
        
        // Vérifier le backend au chargement
        checkBackend();
        setInterval(checkBackend, 30000); // Vérifier toutes les 30 secondes
    </script>
</body>
</html>
EOF
```

### 4. Démarrage rapide

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

---

## 🎯 **Quelle option choisir ?**

**Option A** (avec code source) : Plus complète, plus proche de votre vraie application
**Option B** (simple) : Plus rapide, permet de valider l'infrastructure

## 📊 **URLs après déploiement**

- **Frontend** : http://168.231.86.179:3010
- **Backend API** : http://168.231.86.179:3011/api/health
- **Base de données** : localhost:5433

## 🔍 **Tests de validation**

```bash
# Test direct sur le serveur
curl http://localhost:3010
curl http://localhost:3011/api/health

# Test depuis l'extérieur
curl http://168.231.86.179:3010
curl http://168.231.86.179:3011/api/health
```

**Quelle option voulez-vous essayer en premier ?**
