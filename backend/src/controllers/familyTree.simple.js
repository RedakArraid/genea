/**
 * Version simplifiée du contrôleur familyTree sans UnionChild
 * À utiliser temporairement si Prisma pose problème
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Version de getTreeById sans UnionChild
 * Pour éviter les erreurs Prisma temporairement
 */
exports.getTreeByIdSimple = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tree = await prisma.familyTree.findUnique({
      where: { id },
      include: {
        Person: true,
        NodePosition: true,
        Edge: true
      }
    });
    
    if (!tree) {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }
    
    // Ajouter un tableau vide pour UnionChild (sera géré côté frontend)
    tree.UnionChild = [];
    
    // Récupérer les relations pour les personnes de cet arbre
    const personIds = tree.Person.map(person => person.id);
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { sourceId: { in: personIds } },
          { targetId: { in: personIds } }
        ]
      }
    });
    
    // Ajouter les relations à l'objet arbre
    tree.Relationship = relationships;
    
    res.status(200).json({ tree });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTreeByIdSimple: exports.getTreeByIdSimple
};
