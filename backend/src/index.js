/**
 * Point d'entrée principal de l'API geneamap
 * 
 * Ce fichier initialise le serveur Express, configure les middlewares
 * et enregistre toutes les routes de l'API.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('./lib/prisma');
const dotenv = require('dotenv');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const familyTreeRoutes = require('./routes/familyTree.routes');
const personRoutes = require('./routes/person.routes');
const relationshipRoutes = require('./routes/relationship.routes');
const nodePositionRoutes = require('./routes/nodePosition.routes');
const edgeRoutes = require('./routes/edge.routes');
const planRoutes = require('./routes/plan.routes');
const uploadRoutes = require('./routes/upload.routes');
const documentRoutes = require('./routes/document.routes');
const billingRoutes = require('./routes/billing.routes');
const billingWebhookRoutes = require('./routes/billing-webhook.routes');
const adminRoutes = require('./routes/admin.routes');
const { initStorage } = require('./lib/storage');
const { ensureDemoTree } = require('./lib/demoTree');

// Configuration des variables d'environnement
dotenv.config();

// Initialisation de l'app Express
const app = express();
const PORT = process.env.PORT || 3001;

// Prisma est maintenant importé depuis le module central

// Configuration des middlewares
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Quand une écriture sur l'arbre démo est redirigée vers la copie personnelle
// de l'utilisateur (voir lib/demoFork.js), on le signale dans la réponse pour
// que le frontend bascule sur cette copie au lieu de l'arbre public partagé.
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.locals.demoForkTreeId && body && typeof body === 'object') {
      body.demoForkTreeId = res.locals.demoForkTreeId;
    }
    return originalJson(body);
  };
  next();
});

app.use('/api/billing/webhooks', billingWebhookRoutes);
app.use(morgan('dev'));

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API geneamap' });
});

const healthResponse = (req, res) => {
  res.json({ status: 'ok', service: 'geneamap-backend' });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Enregistrement des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-trees', familyTreeRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/persons/:personId/documents', documentRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/node-positions', nodePositionRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Une erreur est survenue sur le serveur';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrage du serveur
initStorage()
  .catch((err) => console.error('Init MinIO:', err.message))
  .finally(() => {
    ensureDemoTree().catch((err) => console.error('Demo tree bootstrap:', err.message));
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
    });
  });

// Gestion propre de la fermeture du processus
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Connexion à la base de données fermée');
  process.exit(0);
});

module.exports = app;
