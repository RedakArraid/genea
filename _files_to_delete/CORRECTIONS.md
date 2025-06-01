# Instructions de Correction du Projet GeneaIA

## Corrections Appliquées

### ✅ 1. Module Prisma Central
- **Fichier créé :** `backend/src/lib/prisma.js`
- **Modification :** Tous les contrôleurs importent maintenant ce module
- **Avantage :** Gestion centralisée des connexions à la base de données

### ✅ 2. Configuration Proxy Vite Corrigée
- **Fichier modifié :** `frontend/vite.config.js`
- **Changement :** Suppression du `rewrite` qui cassait les routes API
- **Résultat :** Les requêtes `/api/*` sont maintenant correctement proxifiées

### ✅ 3. Fichiers .env.example Créés
- **Fichiers créés :**
  - `backend/.env.example`
  - `frontend/.env.example`
- **Avantage :** Guide pour la configuration des variables d'environnement

### ✅ 4. Scripts NPM Cross-Platform
- **Fichier créé :** `package.json` à la racine
- **Avantage :** Scripts qui fonctionnent sur Windows, Mac et Linux

### ✅ 5. Simplification des Relations
- **Fichier modifié :** `backend/prisma/seed.js`
- **Changement :** Suppression des relations bidirectionnelles redondantes
- **Résultat :** Données plus propres et logique simplifiée

## Corrections Restantes à Appliquer

### 🔄 1. Mise à Jour du Script de Développement Backend
Le script `dev` dans `backend/package.json` devrait utiliser nodemon :

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "dev:watch": "nodemon src/index.js"
  }
}
```

### 🔄 2. Validation de la Sécurité
Vérifier que le middleware `isOwner` est utilisé dans toutes les routes sensibles :

- ✅ `familyTree.routes.js` - Déjà protégé
- ❌ `person.routes.js` - À protéger
- ❌ `relationship.routes.js` - À protéger

### 🔄 3. Gestion des Erreurs Améliorée
Ajouter une gestion d'erreurs plus robuste dans les contrôleurs :

```javascript
// Exemple pour person.controller.js
exports.createPerson = async (req, res, next) => {
  try {
    // ... logique existante
  } catch (error) {
    console.error('Erreur création personne:', error);
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Conflit de données' });
    }
    
    next(error);
  }
};
```

### 🔄 4. Types de Relations Cohérents
Standardiser les types de relations entre le frontend et backend :

**Backend (Prisma Schema):**
```prisma
// Types: "parent", "child", "spouse", "sibling"
```

**Frontend (ReactFlow):**
```javascript
const edgeTypes = {
  'parent': 'parent_child_connection',
  'spouse': 'spouse_connection',
  'sibling': 'sibling_connection'
};
```

## Installation et Test

### 1. Installation des Dépendances
```bash
# À la racine du projet
npm install
npm run setup
```

### 2. Configuration de la Base de Données
```bash
# Copier les fichiers .env.example
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Modifier les fichiers .env avec vos données
# Puis initialiser la base de données
npm run db:init
```

### 3. Démarrage de l'Application
```bash
# Démarrer backend et frontend simultanément
npm run dev
```

## Tests de Validation

### 1. Test de l'API
```bash
# Tester l'authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Test du Frontend
- Naviguer vers http://localhost:5173
- Se connecter avec les identifiants de test
- Vérifier que l'arbre généalogique se charge

### 3. Test de la Sécurité
- Essayer d'accéder à un arbre sans être authentifié
- Vérifier que seul le propriétaire peut modifier un arbre

## Prochaines Améliorations Recommandées

### 1. Tests Automatisés
```bash
# Backend
npm install --save-dev jest supertest
# Créer tests/auth.test.js, tests/familyTree.test.js

# Frontend  
npm install --save-dev @testing-library/react @testing-library/jest-dom
# Créer src/__tests__/FamilyTreePage.test.jsx
```

### 2. Documentation API
```bash
# Installer Swagger
npm install swagger-jsdoc swagger-ui-express

# Documenter les endpoints avec JSDoc
/**
 * @swagger
 * /api/family-trees:
 *   get:
 *     summary: Récupère tous les arbres généalogiques
 *     tags: [FamilyTree]
 *     security:
 *       - bearerAuth: []
 */
```

### 3. Migration vers TypeScript
```bash
# Backend
npm install --save-dev typescript @types/node @types/express

# Frontend déjà configuré pour TypeScript
# Renommer .js en .ts et .jsx en .tsx
```

### 4. Optimisations Performance
- Mise en cache avec Redis
- Pagination des résultats
- Lazy loading des composants React
- Optimisation des requêtes Prisma

## Monitoring et Débogage

### 1. Logs Structurés
```javascript
// backend/src/lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### 2. Métriques d'Application
```javascript
// Installer prometheus ou datadog
npm install prom-client
```

Le projet est maintenant plus stable et maintenable. Les corrections critiques ont été appliquées et le projet devrait fonctionner correctement.
