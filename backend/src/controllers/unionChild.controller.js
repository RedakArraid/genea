/**
 * Contrôleur pour la gestion des enfants d'union
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Créer un enfant d'union
 */
exports.createUnionChild = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { marriageEdgeId, childId, treeId } = req.body;
    
    // Vérifier que l'enfant existe
    const child = await prisma.person.findUnique({
      where: { id: childId }
    });
    
    if (!child) {
      return res.status(404).json({ message: 'Enfant non trouvé' });
    }
    
    // Vérifier que l'arête de mariage existe
    const marriageEdge = await prisma.edge.findUnique({
      where: { id: marriageEdgeId }
    });
    
    if (!marriageEdge) {
      return res.status(404).json({ message: 'Mariage non trouvé' });
    }
    
    // Vérifier si la relation existe déjà
    const existingUnionChild = await prisma.unionChild.findUnique({
      where: {
        marriageEdgeId_childId: {
          marriageEdgeId,
          childId
        }
      }
    });
    
    if (existingUnionChild) {
      return res.status(409).json({ message: 'Cet enfant est déjà associé à cette union' });
    }
    
    // Créer la relation enfant d'union
    const unionChild = await prisma.unionChild.create({
      data: {
        marriageEdgeId,
        childId,
        treeId: treeId || child.treeId
      },
      include: {
        Child: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    // Créer aussi l'arête pour l'affichage
    await prisma.edge.create({
      data: {
        source: marriageEdgeId,
        target: childId,
        type: 'union_child_connection',
        data: {
          type: 'union_child_connection',
          marriageEdgeId: marriageEdgeId,
          isUnionChild: true
        },
        treeId: treeId || child.treeId
      }
    });
    
    res.status(201).json({
      message: 'Enfant d\'union créé avec succès',
      unionChild
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer tous les enfants d'une union
 */
exports.getUnionChildren = async (req, res, next) => {
  try {
    const { marriageEdgeId } = req.params;
    
    const unionChildren = await prisma.unionChild.findMany({
      where: { marriageEdgeId },
      include: {
        Child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            photoUrl: true
          }
        }
      }
    });
    
    res.status(200).json({ unionChildren });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un enfant d'union
 */
exports.deleteUnionChild = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'enfant d'union pour connaître les IDs
    const unionChild = await prisma.unionChild.findUnique({
      where: { id }
    });
    
    if (!unionChild) {
      return res.status(404).json({ message: 'Enfant d\'union non trouvé' });
    }
    
    // Supprimer l'arête correspondante
    await prisma.edge.deleteMany({
      where: {
        source: unionChild.marriageEdgeId,
        target: unionChild.childId,
        type: 'union_child_connection'
      }
    });
    
    // Supprimer la relation enfant d'union
    await prisma.unionChild.delete({
      where: { id }
    });
    
    res.status(200).json({
      message: 'Enfant d\'union supprimé avec succès'
    });
    
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Enfant d\'union non trouvé' });
    }
    next(error);
  }
};
