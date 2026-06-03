/**
 * Contrôleur pour la gestion des positions des nœuds dans l'arbre généalogique
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Récupérer toutes les positions de nœuds d'un arbre généalogique
 */
exports.getAllNodePositions = async (req, res, next) => {
  try {
    const { treeId } = req.params;
    
    const nodePositions = await prisma.nodePosition.findMany({
      where: { treeId }
    });
    
    res.status(200).json({ nodePositions });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une nouvelle position de nœud
 */
exports.createNodePosition = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { nodeId, treeId, x, y } = req.body;
    
    // Vérifier que l'arbre existe
    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId }
    });
    
    if (!tree) {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }
    
    // Vérifier si une position existe déjà pour ce nœud
    const existingPosition = await prisma.nodePosition.findFirst({
      where: { nodeId }
    });
    
    let nodePosition;
    
    if (existingPosition) {
      // Mettre à jour la position existante
      nodePosition = await prisma.nodePosition.update({
        where: { id: existingPosition.id },
        data: { x, y }
      });
    } else {
      // Créer une nouvelle position
      nodePosition = await prisma.nodePosition.create({
        data: {
          nodeId,
          treeId,
          x,
          y
        }
      });
    }
    
    res.status(201).json({
      message: 'Position de nœud créée avec succès',
      nodePosition
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour une position de nœud
 */
exports.updateNodePosition = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { x, y } = req.body;
    
    const nodePosition = await prisma.nodePosition.update({
      where: { id },
      data: { x, y }
    });
    
    res.status(200).json({
      message: 'Position de nœud mise à jour avec succès',
      nodePosition
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Position de nœud non trouvée' });
    }
    next(error);
  }
};

/**
 * Supprimer une position de nœud
 */
exports.deleteNodePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.nodePosition.delete({
      where: { id }
    });
    
    res.status(200).json({
      message: 'Position de nœud supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Position de nœud non trouvée' });
    }
    next(error);
  }
};