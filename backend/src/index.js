/**
 * Point d'entrée principal de l'API GeneaIA
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

// Configuration des variables d'environnement
dotenv.config();

// Initialisation de l'app Express
const app = express();
const PORT = process.env.PORT || 3001;

// Prisma est maintenant importé depuis le module central

// Configuration des middlewares
// CORS configuré pour accepter les connexions publiques
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // En développement, permettre tout
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En production, utiliser CORS_ORIGIN du .env ou permettre localhost
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:5173'
    ].filter(Boolean);
    
    callback(null, allowedOrigins.includes(origin) || true);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Middleware de logging global pour debug
app.use((req, res, next) => {
  console.log('🌐 REQUÊTE REÇUE:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API GeneaIA' });
});

// Route de health check pour le monitoring
app.get('/health', (req, res) => {
  const HOST_INFO = {
    hostname: require('os').hostname(),
    platform: require('os').platform(),
    ip_addresses: Object.values(require('os').networkInterfaces())
      .flat()
      .filter(iface => iface.family === 'IPv4' && !iface.internal)
      .map(iface => iface.address)
  };
  
  res.status(200).json({
    status: 'OK',
    message: 'GeneaIA API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3001,
    database: 'Connected',
    server_info: HOST_INFO,
    accessible_via: [
      `http://localhost:${process.env.PORT || 3001}`,
      ...HOST_INFO.ip_addresses.map(ip => `http://${ip}:${process.env.PORT || 3001}`)
    ]
  });
});

// Route de health check pour l'API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'GeneaIA API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de debug (à supprimer en production)
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURÉE' : 'NON CONFIGURÉE',
      JWT_SECRET: process.env.JWT_SECRET ? 'CONFIGURÉ' : 'NON CONFIGURÉ',
      CORS_ORIGIN: process.env.CORS_ORIGIN
    }
  });
});

// Enregistrement des routes avec logging
console.log('📍 Enregistrement des routes API...');
app.use('/api/auth', (req, res, next) => {
  console.log('🔐 Route AUTH appelée:', req.method, req.path);
  next();
}, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-trees', familyTreeRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/node-positions', nodePositionRoutes);
app.use('/api/edges', edgeRoutes);
console.log('✅ Routes enregistrées');

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('🚨 ERREUR INTERCEPTÉE:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Une erreur est survenue sur le serveur';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.toString()
    })
  });
});

// Test de connexion à la base de données
prisma.$connect()
  .then(() => {
    console.log('✅ Connexion à la base de données réussie');
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'configurée' : 'NON CONFIGURÉE');
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    console.error('🔗 DATABASE_URL:', process.env.DATABASE_URL || 'NON DÉFINIE');
  });

// Démarrage du serveur
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces
app.listen(PORT, HOST, () => {
  console.log(`Serveur démarré sur ${HOST}:${PORT}`);
  console.log(`URL locale: http://localhost:${PORT}`);
  if (HOST === '0.0.0.0') {
    console.log(`Accessible via IP publique sur le port ${PORT}`);
  }
});

// Gestion propre de la fermeture du processus
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Connexion à la base de données fermée');
  process.exit(0);
});

module.exports = app;
