/**
 * Module Prisma central
 * 
 * Ce module centralise l'instance Prisma pour éviter les problèmes de connexion
 * et faciliter la maintenance du code.
 */

const { PrismaClient } = require('@prisma/client');

// Créer une instance unique de Prisma
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// En développement, stocker l'instance dans global pour éviter les reconnexions
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Gestion propre de la fermeture de la connexion
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
