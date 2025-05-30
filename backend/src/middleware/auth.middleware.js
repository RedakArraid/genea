/**
 * Middleware d'authentification
 * 
 * Vérifie la validité du token JWT et extrait les informations utilisateur
 */

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * Middleware qui vérifie si l'utilisateur est authentifié
 */
const isAuth = (req, res, next) => {
  try {
    // Récupération du token d'authentification
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    
    // Extraction du token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Aucun token fourni' });
    }
    
    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajout des informations utilisateur à la requête
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter' });
    }
    
    return res.status(401).json({ message: 'Token non valide' });
  }
};

/**
 * Middleware qui vérifie si l'utilisateur est propriétaire de la ressource
 * Dépend du middleware isAuth qui doit être appelé avant
 */
const isOwner = (modelName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      // Chercher l'ID dans différents paramètres selon la route
      const resourceId = req.params.id || req.params.treeId;
      
      if (!resourceId) {
        return res.status(400).json({ message: 'ID de ressource manquant' });
      }
      
      // Récupération de la ressource selon le modèle demandé
      let resource;
      
      switch (modelName) {
        case 'FamilyTree':
          resource = await prisma.familyTree.findUnique({
            where: { id: resourceId },
            select: { ownerId: true, isPublic: true }
          });
          break;
        // D'autres cas peuvent être ajoutés ici
        default:
          return res.status(500).json({ message: 'Type de ressource non géré' });
      }
      
      if (!resource) {
        return res.status(404).json({ message: 'Ressource non trouvée' });
      }
      
      // Vérification de la propriété ou de l'accès public
      if (resource.ownerId !== userId && !resource.isPublic) {
        return res.status(403).json({ 
          message: 'Vous n\'avez pas les droits pour accéder à cette ressource' 
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  isAuth,
  isOwner
};