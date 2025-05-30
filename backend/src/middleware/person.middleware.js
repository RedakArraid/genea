/**
 * Middleware de validation pour les personnes
 * 
 * Vérifie que l'utilisateur a les droits sur les personnes qu'il manipule
 */

const prisma = require('../lib/prisma');

/**
 * Middleware qui vérifie si l'utilisateur peut accéder à une personne
 */
const canAccessPerson = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const personId = req.params.id;
    
    if (!personId) {
      return res.status(400).json({ message: 'ID de personne manquant' });
    }
    
    // Récupérer la personne avec son arbre
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        FamilyTree: {
          select: { ownerId: true, isPublic: true }
        }
      }
    });
    
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    
    // Vérifier les droits
    if (person.FamilyTree.ownerId !== userId && !person.FamilyTree.isPublic) {
      return res.status(403).json({ 
        message: 'Vous n\'avez pas les droits pour accéder à cette personne' 
      });
    }
    
    // Ajouter les infos de la personne à la requête pour éviter une nouvelle requête
    req.personData = person;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware qui vérifie si l'utilisateur peut créer des relations
 */
const canCreateRelationship = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sourceId, targetId } = req.body;
    
    if (!sourceId || !targetId) {
      return res.status(400).json({ message: 'IDs des personnes source et cible requis' });
    }
    
    // Récupérer les deux personnes avec leurs arbres
    const [source, target] = await Promise.all([
      prisma.person.findUnique({
        where: { id: sourceId },
        include: { FamilyTree: { select: { ownerId: true, isPublic: true } } }
      }),
      prisma.person.findUnique({
        where: { id: targetId },
        include: { FamilyTree: { select: { ownerId: true, isPublic: true } } }
      })
    ]);
    
    if (!source || !target) {
      return res.status(404).json({ message: 'Une ou plusieurs personnes non trouvées' });
    }
    
    // Vérifier que les deux personnes sont dans le même arbre
    if (source.treeId !== target.treeId) {
      return res.status(400).json({ 
        message: 'Les deux personnes doivent appartenir au même arbre généalogique' 
      });
    }
    
    // Vérifier les droits sur l'arbre
    if (source.FamilyTree.ownerId !== userId && !source.FamilyTree.isPublic) {
      return res.status(403).json({ 
        message: 'Vous n\'avez pas les droits pour créer des relations dans cet arbre' 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  canAccessPerson,
  canCreateRelationship
};
