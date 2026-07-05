/**
 * Contrôleur pour la gestion des personnes dans l'arbre généalogique
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { assertMediaAssetLimit, getEffectivePlanLimits } = require('../lib/planAccess');
const storage = require('../lib/storage');

/**
 * Récupérer toutes les personnes d'un arbre généalogique
 */
exports.getAllPersons = async (req, res, next) => {
  try {
    const { treeId } = req.params;
    
    const persons = await prisma.person.findMany({
      where: { treeId },
      orderBy: { lastName: 'asc' }
    });
    
    res.status(200).json({ persons });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une personne spécifique
 */
exports.getPersonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const person = await prisma.person.findUnique({
      where: { id }
    });
    
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    
    res.status(200).json({ person });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une nouvelle personne
 */
exports.createPerson = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { treeId } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }

    if (!tree.isDemo) {
      const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
      const limits = getEffectivePlanLimits(owner);
      const personCount = await prisma.person.count({ where: { treeId } });
      if (personCount >= limits.maxPersonsPerTree) {
        return res.status(403).json({
          message: `Limite de ${limits.maxPersonsPerTree} personnes atteinte pour le forfait ${limits.name}`,
        });
      }
    }
    const {
      firstName,
      lastName,
      birthDate,
      birthPlace,
      deathDate,
      occupation,
      biography,
      gender,
      photoUrl
    } = req.body;

    if (photoUrl && photoUrl.startsWith('data:') && storage.isReady()) {
      return res.status(400).json({
        message: 'Utilisez POST /api/uploads/photo pour envoyer une image (MinIO activé)',
      });
    }

    const newPerson = await prisma.person.create({
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
        deathDate: deathDate ? new Date(deathDate) : null,
        occupation,
        biography,
        gender,
        photoUrl,
        treeId: treeId
      }
    });
    
    res.status(201).json({
      message: 'Personne créée avec succès',
      person: newPerson
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour une personne
 */
exports.updatePerson = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const {
      firstName,
      lastName,
      birthDate,
      birthPlace,
      deathDate,
      occupation,
      biography,
      gender,
      photoUrl
    } = req.body;
    
    // Créer un objet de données à mettre à jour avec uniquement les champs fournis
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
    if (deathDate !== undefined) updateData.deathDate = deathDate ? new Date(deathDate) : null;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (biography !== undefined) updateData.biography = biography;
    if (gender !== undefined) updateData.gender = gender;
    if (photoUrl !== undefined) {
      if (photoUrl && photoUrl.startsWith('data:') && storage.isReady()) {
        return res.status(400).json({
          message: 'Utilisez POST /api/uploads/photo pour envoyer une image (MinIO activé)',
        });
      }
      if (photoUrl && storage.isReady()) {
        const existing = await prisma.person.findUnique({ where: { id }, select: { photoUrl: true } });
        if (existing?.photoUrl && existing.photoUrl !== photoUrl) {
          await storage.deleteByUrl(existing.photoUrl);
        }
      }
      updateData.photoUrl = photoUrl || null;
    }
    
    try {
      const updatedPerson = await prisma.person.update({
        where: { id },
        data: updateData
      });
      
      res.status(200).json({
        message: 'Personne mise à jour avec succès',
        person: updatedPerson
      });
    } catch (dbError) {
      if (dbError.code === 'P2025') {
        return res.status(404).json({ message: 'Personne non trouvée' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une personne
 */
exports.deletePerson = async (req, res, next) => {
  try {
    const { id } = req.params;

    const person = await prisma.person.findUnique({
      where: { id },
      select: { photoUrl: true, PersonDocument: { select: { fileKey: true, fileUrl: true } } },
    });
    if (person?.photoUrl) {
      await storage.deleteByUrl(person.photoUrl);
    }
    if (person?.PersonDocument?.length) {
      await Promise.all(person.PersonDocument.map((d) => storage.deleteByKey(d.fileKey)));
    }

    await prisma.person.delete({
      where: { id }
    });
    
    res.status(200).json({
      message: 'Personne supprimée avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    next(error);
  }
};

/**
 * Mettre à jour uniquement la photo (autorisé en démo — pas une fiche texte)
 */
exports.updatePersonPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (photoUrl === undefined) {
      return res.status(400).json({ message: 'photoUrl requis' });
    }

    if (photoUrl && photoUrl.startsWith('data:') && storage.isReady()) {
      return res.status(400).json({
        message: 'Utilisez POST /api/uploads/photo pour envoyer une image',
      });
    }

    const existing = await prisma.person.findUnique({
      where: { id },
      select: { photoUrl: true, FamilyTree: { select: { ownerId: true } } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }

    if (photoUrl && !existing.photoUrl) {
      await assertMediaAssetLimit(existing.FamilyTree.ownerId);
    }

    if (photoUrl && storage.isReady() && existing.photoUrl && existing.photoUrl !== photoUrl) {
      await storage.deleteByUrl(existing.photoUrl);
    }

    const person = await prisma.person.update({
      where: { id },
      data: { photoUrl: photoUrl || null },
    });

    res.status(200).json({ message: 'Photo mise à jour', person });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    next(error);
  }
};