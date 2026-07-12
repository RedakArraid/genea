/**
 * Contrôleur pour la gestion des arbres généalogiques
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { assertPlanEntitlement, evaluatePersonCapacity, getEffectivePlanLimits } = require('../lib/planAccess');
const { requireTreeRead } = require('../lib/treeAccess');
const { loadTreeExportData, assertCanExportTree, assertCanExportGedcom, assertCanImportExportTree, slugifyFilename } = require('../lib/exportAccess');
const { isOrganizationTree } = require('../lib/treeType');
const { normalizeOrgLexicon, getOrgLexiconPreset } = require('../lib/orgLexicon');
const { generateGedcom } = require('../lib/gedcom');
const { generateTreePdf } = require('../lib/treePdf');
const { importGedcomIntoTree } = require('../lib/gedcomImport');
const { findTreeMatches } = require('../lib/matching/findMatches');

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
    
    const { name, description, isPublic, rootPerson, treeType: rawTreeType, orgLexiconPreset } = req.body;
    const treeType = rawTreeType === 'ORGANIZATION' ? 'ORGANIZATION' : 'GENEALOGY';
    const isOrg = treeType === 'ORGANIZATION';
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
          treeType,
          orgLexicon: isOrg ? getOrgLexiconPreset(orgLexiconPreset) : null,
          ownerId: userId,
        },
      });
      
      const rootPersonData = {
        firstName: rootPerson?.firstName || (isOrg ? 'Responsable' : 'Personne'),
        lastName: rootPerson?.lastName || 'Racine',
        birthDate: rootPerson?.birthDate ? new Date(rootPerson.birthDate) : null,
        birthPlace: rootPerson?.birthPlace || null,
        occupation: rootPerson?.occupation || (isOrg ? 'Directeur' : null),
        biography: rootPerson?.biography || (isOrg
          ? 'Membre racine de l\'organigramme. Modifiez le poste et les informations.'
          : 'Personne racine de l\'arbre généalogique. Modifiez ces informations.'),
        gender: isOrg ? null : (rootPerson?.gender || 'other'),
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
      message: isOrg ? 'Organigramme créé avec succès' : 'Arbre généalogique créé avec succès avec une personne racine',
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
    const limits = getEffectivePlanLimits(user);

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
 * Arrière-plan canvas (organigrammes uniquement)
 */
exports.updateTreeBackground = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Cet arbre ne peut pas être modifié' });
    }
    if (!isOrganizationTree(tree)) {
      return res.status(403).json({ message: 'Arrière-plan réservé aux arbres organisation' });
    }

    const {
      backgroundImageUrl,
      backgroundMode,
      backgroundOpacity,
      backgroundOverlay,
      backgroundTileSize,
    } = req.body;

    const data = {};
    if (backgroundImageUrl !== undefined) {
      data.backgroundImageUrl = backgroundImageUrl || null;
    }
    if (backgroundMode !== undefined) {
      if (!['NONE', 'COVER', 'REPEAT'].includes(backgroundMode)) {
        return res.status(400).json({ message: 'Mode arrière-plan invalide' });
      }
      data.backgroundMode = backgroundMode;
      if (backgroundMode === 'NONE') {
        data.backgroundImageUrl = null;
      }
    }
    if (backgroundOpacity !== undefined) {
      const opacity = Number(backgroundOpacity);
      if (!Number.isFinite(opacity) || opacity < 0.05 || opacity > 1) {
        return res.status(400).json({ message: 'Opacité invalide (0.05 à 1)' });
      }
      data.backgroundOpacity = opacity;
    }
    if (backgroundOverlay !== undefined) {
      data.backgroundOverlay = Boolean(backgroundOverlay);
    }
    if (backgroundTileSize !== undefined) {
      const tileSize = Number(backgroundTileSize);
      if (!Number.isInteger(tileSize) || tileSize < 80 || tileSize > 400) {
        return res.status(400).json({ message: 'Taille du motif invalide (80 à 400)' });
      }
      data.backgroundTileSize = tileSize;
    }

    const updatedTree = await prisma.familyTree.update({
      where: { id },
      data,
    });

    res.status(200).json({
      message: 'Arrière-plan mis à jour',
      tree: updatedTree,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }
    next(error);
  }
};

/**
 * Terminologie organisation (niveaux, subordination, poste…)
 */
exports.updateOrgLexicon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Cet arbre ne peut pas être modifié' });
    }
    if (!isOrganizationTree(tree)) {
      return res.status(403).json({ message: 'Lexique réservé aux arbres organisation' });
    }

    const { orgLexicon, orgLexiconPreset } = req.body;
    let nextLexicon;
    if (orgLexiconPreset && orgLexiconPreset !== 'custom') {
      nextLexicon = getOrgLexiconPreset(orgLexiconPreset);
    } else if (orgLexicon && typeof orgLexicon === 'object') {
      nextLexicon = normalizeOrgLexicon({ ...orgLexicon, preset: orgLexicon.preset || 'custom' });
    } else {
      return res.status(400).json({ message: 'orgLexicon ou orgLexiconPreset requis' });
    }

    const updatedTree = await prisma.familyTree.update({
      where: { id },
      data: { orgLexicon: nextLexicon },
    });

    res.status(200).json({
      message: 'Terminologie mise à jour',
      tree: updatedTree,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }
    next(error);
  }
};

async function handleTreeExport(req, res, next, format) {
  try {
    const { id } = req.params;
    const { tree, relationships } = await loadTreeExportData(id);
    if (format === 'gedcom') {
      await assertCanExportGedcom(tree);
    } else {
      await assertCanExportTree(tree);
    }

    const access = req.treeAccess || await requireTreeRead(req.user.id, id);
    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé à cet arbre' });
    }

    const baseName = slugifyFilename(tree.name);

    if (format === 'gedcom') {
      const body = generateGedcom(tree, tree.Person, relationships);
      res.setHeader('Content-Type', 'text/x-gedcom; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.ged"`);
      return res.send(body);
    }

    const pdf = await generateTreePdf(tree, tree.Person);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code || undefined,
      });
    }
    return next(error);
  }
}

exports.exportGedcom = (req, res, next) => handleTreeExport(req, res, next, 'gedcom');

exports.exportPdf = (req, res, next) => handleTreeExport(req, res, next, 'pdf');

exports.importGedcom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tree } = await loadTreeExportData(id);
    await assertCanImportExportTree(tree);

    const access = req.treeAccess || await requireTreeRead(req.user.id, id);
    if (!access.canWrite) {
      return res.status(403).json({ message: 'Droits d\'écriture requis pour importer' });
    }

    const gedcomText = req.body?.gedcom || req.file?.buffer?.toString('utf8');
    if (!gedcomText?.trim()) {
      return res.status(400).json({ message: 'Fichier GEDCOM requis', code: 'GEDCOM_REQUIRED' });
    }

    const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
    const limits = getEffectivePlanLimits(owner);
    const parsedPreview = require('../lib/gedcom').parseGedcom(gedcomText);
    const currentCount = tree.Person?.length ?? await prisma.person.count({ where: { treeId: id } });
    const capacity = evaluatePersonCapacity(limits, {
      treePersonCount: currentCount,
      additional: parsedPreview.individuals.length,
    });
    if (!capacity.ok) {
      return res.status(capacity.statusCode).json({
        message: capacity.message,
        code: capacity.code,
        maxPersons: capacity.maxPersons,
        planName: capacity.planName,
      });
    }

    const result = await importGedcomIntoTree(id, gedcomText);
    res.status(201).json({ message: 'Import GEDCOM réussi', ...result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code || undefined });
    }
    next(error);
  }
};

exports.getTreeMatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const access = req.treeAccess || await requireTreeRead(req.user.id, id);
    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const result = await findTreeMatches(id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

exports.updateMatchingOptIn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { matchingOptIn } = req.body;
    const tree = await prisma.familyTree.findUnique({ where: { id } });
    if (!tree || tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Seul le propriétaire peut modifier cette option' });
    }
    if (isOrganizationTree(tree)) {
      return res.status(403).json({
        message: 'Correspondances indisponibles pour les organigrammes',
        code: 'MATCHING_ORG_FORBIDDEN',
      });
    }
    const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
    const limits = getEffectivePlanLimits(owner);
    if (matchingOptIn && !limits.canPublicMatching) {
      return res.status(403).json({
        message: 'Correspondances publiques réservées aux forfaits Famille et Patrimoine',
        code: 'MATCHING_NOT_ALLOWED',
      });
    }
    const updated = await prisma.familyTree.update({
      where: { id },
      data: { matchingOptIn: !!matchingOptIn },
    });
    res.json({ tree: updated, matchingOptIn: updated.matchingOptIn });
  } catch (error) {
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