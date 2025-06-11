/**
 * Contrôleur pour la gestion des arbres généalogiques
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Récupérer tous les arbres généalogiques de l'utilisateur connecté
 */
exports.getAllTrees = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const trees = await prisma.familyTree.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' }
    });
    
    res.status(200).json({ trees });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un arbre généalogique spécifique avec toutes ses données
 */
exports.getTreeById = async (req, res, next) => {
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
    
    // TEMPORAIRE: Ignorer UnionChild jusqu'à ce que Prisma soit corrigé
    // Récupérer les UnionChild séparément (avec gestion d'erreur)
    let unionChildren = [];
    /*
    try {
      if (prisma.unionChild) {
        unionChildren = await prisma.unionChild.findMany({
          where: { treeId: id },
          include: { Child: true }
        });
      }
    } catch (error) {
      console.warn('Table UnionChild non accessible, sera ignorée:', error.message);
      unionChildren = [];
    }
    */
    
    // Ajouter les UnionChild à l'objet tree (vide pour l'instant)
    tree.UnionChild = unionChildren;
    
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
    
    // Utiliser une transaction pour créer l'arbre et la personne racine ensemble
    const result = await prisma.$transaction(async (prisma) => {
      // Créer l'arbre généalogique
      const newTree = await prisma.familyTree.create({
        data: {
          name,
          description,
          isPublic: isPublic || false,
          ownerId: userId
        }
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
    const { name, description, isPublic } = req.body;
    
    const updatedTree = await prisma.familyTree.update({
      where: { id },
      data: {
        name,
        description,
        isPublic: isPublic !== undefined ? isPublic : undefined
      }
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