# 🚀 GitHub Actions - Tests Seulement

Les workflows GitHub Actions ont été modifiés pour exécuter uniquement les tests, sans déploiement automatique.

## 📋 Workflows Disponibles

### 1. Tests Complets (`.github/workflows/deploy.yml`)

**Déclencheurs :**
- Push sur `main`, `staging`, `develop`
- Pull Request vers `main`, `staging`
- Déclenchement manuel

**Jobs inclus :**

#### 🧪 Tests Backend Node.js
- Installation des dépendances
- Génération Prisma
- Migrations de base de données
- Lint du code
- Exécution des tests

#### 🐍 Tests Backend Python
- Installation des dépendances Python
- Vérification qualité du code (flake8)
- Exécution des tests pytest

#### 🌐 Tests Frontend
- Installation des dépendances
- Lint du code
- Exécution des tests
- Build de production
- Vérification de la taille du build

#### 🐳 Tests Docker
- Build des images Docker
- Vérification de la construction

#### 🔗 Tests d'Intégration
- Démarrage des services avec Docker Compose
- Tests de connectivité entre services

#### 📊 Résumé
- Affichage du résumé des résultats
- Statut final de tous les tests

### 2. Tests Rapides (`.github/workflows/tests.yml`)

**Déclencheurs :**
- Push sur `main`, `develop`
- Pull Request vers `main`

**Jobs inclus :**
- Tests backend Node.js de base
- Tests frontend de base
- Build frontend

## 🔧 Configuration

### Variables d'Environnement

Les workflows utilisent ces variables :
- `NODE_VERSION: '18'`
- `PYTHON_VERSION: '3.11'`
- `DATABASE_URL` (pour tests)
- `JWT_SECRET` (pour tests)

### Services PostgreSQL

Chaque workflow démarre automatiquement une base PostgreSQL pour les tests :
- Image : `postgres:15`
- Base de données : `geneaia_test`
- Utilisateur : `postgres`
- Mot de passe : `postgres`

## 📊 Résultats des Tests

### Visualisation

Les résultats sont affichés :
- ✅ En cas de succès
- ❌ En cas d'échec
- ⚠️ Pour les avertissements

### Résumé Automatique

Le workflow principal génère un résumé automatique avec :
- Statut de chaque composant
- Recommandations pour le déploiement manuel

## 🚀 Déploiement Manuel

Après que tous les tests passent :

### Développement
```bash
docker-compose up --build -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🐛 Dépannage

### Tests qui Échouent

1. **Backend Node.js :**
   - Vérifier les migrations Prisma
   - Vérifier la connectivité à la base de données
   - Vérifier les variables d'environnement

2. **Backend Python :**
   - Vérifier les dépendances dans `requirements.txt`
   - Vérifier la syntaxe Python avec flake8
   - Vérifier les tests pytest

3. **Frontend :**
   - Vérifier les dépendances npm
   - Vérifier la configuration Vite
   - Vérifier les tests unitaires

### Docker Builds

Si les builds Docker échouent :
- Vérifier les Dockerfiles
- Vérifier les dépendances système
- Vérifier les fichiers `.dockerignore`

## 📝 Personnalisation

### Ajouter de Nouveaux Tests

Pour ajouter des tests :

1. **Tests Backend :**
   ```yaml
   - name: 🧪 Nouveaux Tests Backend
     run: |
       cd backend
       npm run test:nouvelles-fonctionnalites
   ```

2. **Tests Frontend :**
   ```yaml
   - name: 🧪 Tests E2E
     run: |
       cd frontend
       npm run test:e2e
   ```

### Modifier les Déclencheurs

Pour changer quand les tests s'exécutent :

```yaml
on:
  push:
    branches: [ main, feature/* ]  # Tous les branches feature
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h du matin
```

### Ajouter des Notifications

Pour recevoir des notifications :

```yaml
- name: 📧 Notification Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🔐 Secrets Nécessaires

Aucun secret n'est requis pour les tests de base. Pour des fonctionnalités avancées :

- `SLACK_WEBHOOK` - Pour les notifications Slack
- `CODECOV_TOKEN` - Pour la couverture de code
- `SONAR_TOKEN` - Pour l'analyse SonarQube

## 📈 Métriques et Monitoring

### Couverture de Code

Pour ajouter la couverture de code :

```yaml
- name: 📊 Code Coverage
  run: |
    cd backend
    npm run test:coverage
    
- name: 📤 Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage/lcov.info
```

### Performance

Pour surveiller les performances :

```yaml
- name: ⚡ Performance Tests
  run: |
    cd frontend
    npm run build
    npm run lighthouse-ci
```

Les workflows sont maintenant configurés pour les tests uniquement, permettant un déploiement manuel contrôlé ! 🎉
