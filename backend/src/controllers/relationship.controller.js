/**
 * Contrôleur pour la gestion des relations entre personnes
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Récupérer toutes les relations d'une personne
 */
exports.getPersonRelationships = async (req, res, next) => {
  try {
    const { personId } = req.params;
    
    // Vérifier que la personne existe
    const person = await prisma.person.findUnique({
      where: { id: personId }
    });
    
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    
    // Récupérer toutes les relations où la personne est impliquée
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { sourceId: personId },
          { targetId: personId }
        ]
      },
      include: {
        Person_Relationship_sourceIdToPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true
          }
        },
        Person_Relationship_targetIdToPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true
          }
        }
      }
    });
    
    res.status(200).json({ relationships });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une nouvelle relation entre deux personnes
 */
exports.createRelationship = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type, sourceId, targetId } = req.body;
    
    // Vérifier que les personnes existent
    const source = await prisma.person.findUnique({
      where: { id: sourceId },
      include: { FamilyTree: true }
    });
    
    const target = await prisma.person.findUnique({
      where: { id: targetId },
      include: { FamilyTree: true }
    });
    
    if (!source || !target) {
      return res.status(404).json({ message: 'Une ou plusieurs personnes non trouvées' });
    }
    
    // Vérifier que les personnes sont dans le même arbre
    if (source.FamilyTree.id !== target.FamilyTree.id) {
      return res.status(400).json({ 
        message: 'Les deux personnes doivent appartenir au même arbre généalogique' 
      });
    }
    
    // Vérifier que la relation n'existe pas déjà
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        AND: [
          { sourceId },
          { targetId },
          { type }
        ]
      }
    });
    
    if (existingRelationship) {
      return res.status(409).json({ message: 'Cette relation existe déjà' });
    }
    
    // Créer la relation
    const newRelationship = await prisma.relationship.create({
      data: {
        type,
        sourceId,
        targetId
      },
      include: {
        Person_Relationship_sourceIdToPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        Person_Relationship_targetIdToPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    // Si c'est une relation parent-enfant, créer aussi la relation inverse
    if (type === 'parent') {
      await prisma.relationship.create({
        data: {
          type: 'child',
          sourceId: targetId,
          targetId: sourceId
        }
      });
    } else if (type === 'child') {
      await prisma.relationship.create({
        data: {
          type: 'parent',
          sourceId: targetId,
          targetId: sourceId
        }
      });
    } else if (type === 'spouse') {
      // Pour les époux, créer la relation dans les deux sens si elle n'existe pas
      const existingReverseRelationship = await prisma.relationship.findFirst({
        where: {
          AND: [
            { sourceId: targetId },
            { targetId: sourceId },
            { type: 'spouse' }
          ]
        }
      });
      
      if (!existingReverseRelationship) {
        await prisma.relationship.create({
          data: {
            type: 'spouse',
            sourceId: targetId,
            targetId: sourceId
          }
        });
      }
    } else if (type === 'sibling') {
      // Pour les frères et sœurs, créer la relation dans les deux sens si elle n'existe pas
      const existingReverseRelationship = await prisma.relationship.findFirst({
        where: {
          AND: [
            { sourceId: targetId },
            { targetId: sourceId },
            { type: 'sibling' }
          ]
        }
      });
      
      if (!existingReverseRelationship) {
        await prisma.relationship.create({
          data: {
            type: 'sibling',
            sourceId: targetId,
            targetId: sourceId
          }
        });
      }
    }
    
    res.status(201).json({
      message: 'Relation créée avec succès',
      relationship: newRelationship
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une relation
 */
exports.deleteRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Récupérer d'abord la relation pour connaître son type
    const relationship = await prisma.relationship.findUnique({
      where: { id }
    });
    
    if (!relationship) {
      return res.status(404).json({ message: 'Relation non trouvée' });
    }
    
    // Supprimer la relation
    await prisma.relationship.delete({
      where: { id }
    });
    
    // Si c'est une relation bidirectionnelle, supprimer aussi l'autre sens
    if (['parent', 'child', 'spouse', 'sibling'].includes(relationship.type)) {
      const inverseType = relationship.type === 'parent' ? 'child' : 
                        relationship.type === 'child' ? 'parent' : 
                        relationship.type; // spouse et sibling restent identiques
      
      await prisma.relationship.deleteMany({
        where: {
          AND: [
            { sourceId: relationship.targetId },
            { targetId: relationship.sourceId },
            { type: inverseType }
          ]
        }
      });
    }
    
    res.status(200).json({
      message: 'Relation supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Relation non trouvée' });
    }
    next(error);
  }
};