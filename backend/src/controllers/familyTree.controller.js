/**
 * Contrôleur pour la gestion des arbres généalogiques
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { getPlanLimits } = require('../lib/plans');
const { assertPlanEntitlement, getEffectivePlanLimits } = require('../lib/planAccess');
const { requireTreeRead } = require('../lib/treeAccess');

exports.getAllTrees = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [owned, shared] = await Promise.all([
      prisma.familyTree.findMany({
        where: { ownerId: userId, isDemo: false },
        include: { _count: { select: { Person: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.familyTree.findMany({
        where: {
          isDemo: false,
          TreeCollaborator: { some: { userId } },
        },
        include: {
          _count: { select: { Person: true } },
          TreeCollaborator: { where: { userId } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    res.status(200).json({ trees: owned, sharedTrees: shared });
  } catch (error) {
    next(error);
  }
};

exports.getTreeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tree = await prisma.familyTree.findUnique({
      where: { id },
      include: {
        Person: true,
        NodePosition: true,
        Edge: true,
      },
    });

    if (!tree) {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }

    const personIds = tree.Person.map((person) => person.id);
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { sourceId: { in: personIds } },
          { targetId: { in: personIds } },
        ],
      },
    });

    tree.Relationship = relationships;

    const access = req.treeAccess || (req.user?.id
      ? await requireTreeRead(req.user.id, id)
      : { canRead: false, canWrite: false, canEditPerson: false, role: 'none', isDemo: false });

    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé à cet arbre' });
    }

    res.status(200).json({ tree, access });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * Créer un nouvel arbre généalogique
 */
exports.createTree = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, isPublic, rootPerson } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    assertPlanEntitlement(user);
    const limits = getEffectivePlanLimits(user);
    const treeCount = await prisma.familyTree.count({
      where: { ownerId: userId, isDemo: false },
    });
    if (treeCount >= limits.maxTrees) {
      return res.status(403).json({
        message: `Limite de ${limits.maxTrees} arbre(s) atteinte pour le forfait ${limits.name}`,
      });
    }

    const visibility = isPublic ? 'PUBLIC' : 'PRIVATE';
    if (visibility === 'PUBLIC' && !limits.canPublicMatching) {
      return res.status(403).json({
        message: 'Les arbres publics nécessitent le forfait Famille ou Patrimoine',
      });
    }
    
    const result = await prisma.$transaction(async (prisma) => {
      const newTree = await prisma.familyTree.create({
        data: {
          name,
          description,
          isPublic: isPublic || false,
          visibility,
          ownerId: userId,
        },
      });
      
      // Créer une personne racine (avec données personnalisées ou par défaut)
      const rootPersonData = {
        firstName: rootPerson?.firstName || 'Personne',
        lastName: rootPerson?.lastName || 'Racine',
        birthDate: rootPerson?.birthDate ? new Date(rootPerson.birthDate) : null,
        birthPlace: rootPerson?.birthPlace || null,
        occupation: rootPerson?.occupation || null,
        biography: rootPerson?.biography || 'Personne racine de l\'arbre généalogique. Modifiez ces informations.',
        gender: rootPerson?.gender || 'other',
        treeId: newTree.id
      };
      
      const createdRootPerson = await prisma.person.create({
        data: rootPersonData
      });
      
      // Créer la position de la personne racine au centre
      await prisma.nodePosition.create({
        data: {
          nodeId: createdRootPerson.id,
          x: 300,
          y: 200,
          treeId: newTree.id
        }
      });
      
      return { tree: newTree, rootPerson: createdRootPerson };
    });
    
    res.status(201).json({ 
      message: 'Arbre généalogique créé avec succès avec une personne racine',
      tree: result.tree,
      rootPerson: result.rootPerson
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour un arbre généalogique
 */
exports.updateTree = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Cet arbre ne peut pas être modifié' });
    }
    if (tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Seul le propriétaire peut modifier l\'arbre' });
    }

    const { name, description, isPublic, visibility } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const limits = getPlanLimits(user.plan);

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (visibility !== undefined) {
      if (visibility === 'PUBLIC' && !limits.canPublicMatching) {
        return res.status(403).json({
          message: 'Les arbres publics nécessitent le forfait Famille ou Patrimoine',
        });
      }
      updateData.visibility = visibility;
      updateData.isPublic = visibility === 'PUBLIC';
    } else if (isPublic !== undefined) {
      if (isPublic && !limits.canPublicMatching) {
        return res.status(403).json({
          message: 'Les arbres publics nécessitent le forfait Famille ou Patrimoine',
        });
      }
      updateData.isPublic = isPublic;
      updateData.visibility = isPublic ? 'PUBLIC' : 'PRIVATE';
    }

    const updatedTree = await prisma.familyTree.update({
      where: { id },
      data: updateData,
    });
    
    res.status(200).json({ 
      message: 'Arbre généalogique mis à jour avec succès',
      tree: updatedTree 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }
    next(error);
  }
};

/**
 * Supprimer un arbre généalogique
 */
exports.deleteTree = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Cet arbre ne peut pas être supprimé' });
    }
    if (tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Seul le propriétaire peut supprimer l\'arbre' });
    }
    
    await prisma.familyTree.delete({
      where: { id }
    });
    
    res.status(200).json({ 
      message: 'Arbre généalogique supprimé avec succès' 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }
    next(error);
  }
};