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
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API GeneaIA' });
});

// Route de health check pour le monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'GeneaIA API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'Connected' // On pourrait ajouter un test DB ici
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

// Enregistrement des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-trees', familyTreeRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/node-positions', nodePositionRoutes);
app.use('/api/edges', edgeRoutes);

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
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});

// Gestion propre de la fermeture du processus
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Connexion à la base de données fermée');
  process.exit(0);
});

module.exports = app;