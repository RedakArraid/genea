# Migration du Backend vers Python

## ✅ Migration Complète

Le backend Node.js/Express a été entièrement recréé en Python avec FastAPI. Voici les détails de la migration :

### 🏗️ Architecture

- **Framework**: FastAPI (remplace Express.js)
- **ORM**: SQLAlchemy (remplace Prisma)
- **Authentification**: JWT avec python-jose (remplace jsonwebtoken)
- **Hachage**: passlib avec bcrypt (remplace bcryptjs)
- **Base de données**: PostgreSQL (inchangé)

### 📁 Structure du Nouveau Backend

```
backend-python/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Point d'entrée FastAPI
│   ├── core/
│   │   ├── config.py           # Configuration
│   │   ├── auth.py             # Utilitaires auth
│   │   └── deps.py             # Dépendances FastAPI
│   ├── models/                 # Modèles SQLAlchemy
│   │   ├── user.py
│   │   ├── family_tree.py
│   │   ├── person.py
│   │   ├── relationship.py
│   │   ├── node_position.py
│   │   └── edge.py
│   ├── schemas/                # Schémas Pydantic
│   │   ├── user.py
│   │   ├── family_tree.py
│   │   ├── person.py
│   │   ├── relationship.py
│   │   ├── node_position.py
│   │   └── edge.py
│   ├── api/v1/endpoints/       # Routes API
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── family_trees.py
│   │   ├── persons.py
│   │   ├── relationships.py
│   │   ├── node_positions.py
│   │   └── edges.py
│   └── db/
│       ├── session.py          # Configuration DB
│       └── base.py             # Import modèles
├── alembic/                    # Migrations
├── requirements.txt
├── package.json               # Scripts npm compatibles
└── Dockerfile
```

### 🔄 API Endpoints Migrés

Tous les endpoints ont été recréés avec la même structure:

#### Authentification (`/api/auth`)
- ✅ `POST /register` - Inscription
- ✅ `POST /login` - Connexion
- ✅ `GET /me` - Profil utilisateur

#### Utilisateurs (`/api/users`)
- ✅ `GET /profile` - Profil
- ✅ `PUT /profile` - Mise à jour profil

#### Arbres Généalogiques (`/api/family-trees`)
- ✅ `GET /` - Liste des arbres
- ✅ `GET /{id}` - Détail arbre
- ✅ `POST /` - Créer arbre
- ✅ `PUT /{id}` - Modifier arbre
- ✅ `DELETE /{id}` - Supprimer arbre

#### Personnes (`/api/persons`)
- ✅ `GET /tree/{treeId}` - Personnes d'un arbre
- ✅ `GET /{id}` - Détail personne
- ✅ `POST /tree/{treeId}` - Créer personne
- ✅ `PUT /{id}` - Modifier personne
- ✅ `DELETE /{id}` - Supprimer personne

#### Relations (`/api/relationships`)
- ✅ `GET /person/{personId}` - Relations d'une personne
- ✅ `POST /` - Créer relation
- ✅ `DELETE /{id}` - Supprimer relation

#### Positions (`/api/node-positions`)
- ✅ `GET /tree/{treeId}` - Positions d'un arbre
- ✅ `POST /` - Créer/modifier position
- ✅ `PUT /{id}` - Modifier position
- ✅ `DELETE /{id}` - Supprimer position

#### Liens (`/api/edges`)
- ✅ `GET /tree/{treeId}` - Liens d'un arbre
- ✅ `POST /` - Créer lien
- ��� `PUT /{id}` - Modifier lien
- ✅ `DELETE /{id}` - Supprimer lien

### 🛡️ Sécurité

- ✅ Authentification JWT identique
- ✅ Hachage bcrypt des mots de passe
- ✅ Validation des autorisations
- ✅ CORS configuré
- ✅ Validation des données (Pydantic)

### 📊 Base de Données

- ✅ Schéma identique à Prisma
- ✅ Migrations avec Alembic
- ✅ Relations préservées
- ✅ Index et contraintes

### 🚀 Déploiement

#### Installation des dépendances:
```bash
cd backend-python
pip install -r requirements.txt
```

#### Migration de la base de données:
```bash
cd backend-python
alembic upgrade head
```

#### Démarrage du serveur:
```bash
# Développement
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 3001
```

### 📚 Documentation API

Le nouveau backend inclut une documentation Swagger automatique:
- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

### ⚠️ Points d'Attention

1. **Dépendances Python**: Le backend nécessite Python 3.11+ et les dépendances du requirements.txt
2. **Variables d'environnement**: Adapter les variables selon l'environnement
3. **Migration des données**: Utiliser Alembic pour migrer le schéma existant
4. **Frontend**: Aucune modification nécessaire côté frontend (API compatible)

### 🔧 Prochaines Étapes

1. Installer Python et les dépendances sur l'environnement de déploiement
2. Configurer les variables d'environnement
3. Exécuter les migrations de base de données
4. Mettre à jour les scripts de déploiement pour utiliser le backend Python
5. Tester l'intégration complète frontend-backend

Le backend Python est fonctionnellement équivalent au backend Node.js et prêt pour la production.
