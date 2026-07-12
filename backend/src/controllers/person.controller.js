/**
 * Contrôleur pour la gestion des personnes dans l'arbre généalogique
 */

const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { assertPhotoLimit, assertPersonCapacity, getEffectivePlanLimits } = require('../lib/planAccess');
const { recordPersonRevision, listPersonRevisions, ownerCanVersion } = require('../lib/versioning');
const storage = require('../lib/storage');
const { sendError, sendValidationErrors } = require('../lib/apiErrors');

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
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
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
      return sendValidationErrors(res, errors);
    }

    const { treeId } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return sendError(res, 404, 'TREE_NOT_FOUND', 'Arbre généalogique non trouvé');
    }

    if (!tree.isDemo) {
      await assertPersonCapacity(tree.ownerId, treeId);
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
      return sendError(res, 400, 'USE_UPLOAD_ENDPOINT', 'Utilisez POST /api/uploads/photo pour envoyer une image (MinIO activé)');
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
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message, {
        maxPersons: error.maxPersons,
        planName: error.planName,
      });
    }
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
      return sendValidationErrors(res, errors);
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
        return sendError(res, 400, 'USE_UPLOAD_ENDPOINT', 'Utilisez POST /api/uploads/photo pour envoyer une image (MinIO activé)');
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
      const existing = await prisma.person.findUnique({ where: { id } });
      if (!existing) {
        return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
      }
      await recordPersonRevision(existing, req.user?.id, 'UPDATE');

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
        return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
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
      select: { id: true, photoUrl: true, treeId: true, firstName: true, lastName: true, birthDate: true, birthPlace: true, deathDate: true, occupation: true, biography: true, gender: true, PersonDocument: { select: { fileKey: true, fileUrl: true } } },
    });
    if (!person) {
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
    }

    await recordPersonRevision(person, req.user?.id, 'DELETE');
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
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
    }
    next(error);
  }
};

/**
 * Mettre à jour uniquement la photo (autorisé en démo - pas une fiche texte)
 */
exports.updatePersonPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (photoUrl === undefined) {
      return sendError(res, 400, 'PHOTO_URL_REQUIRED', 'photoUrl requis');
    }

    if (photoUrl && photoUrl.startsWith('data:') && storage.isReady()) {
      return sendError(res, 400, 'USE_UPLOAD_ENDPOINT', 'Utilisez POST /api/uploads/photo pour envoyer une image');
    }

    const existing = await prisma.person.findUnique({
      where: { id },
      select: { photoUrl: true, FamilyTree: { select: { ownerId: true } } },
    });
    if (!existing) {
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
    }

    if (photoUrl && !existing.photoUrl) {
      await assertPhotoLimit(existing.FamilyTree.ownerId);
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
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
    }
    next(error);
  }
};

exports.getPersonRevisions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) {
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
    }
    const allowed = await ownerCanVersion(person.treeId);
    if (!allowed) {
      return res.status(403).json({ message: 'Historique réservé au forfait Patrimoine', code: 'VERSIONING_NOT_ALLOWED' });
    }
    const revisions = await listPersonRevisions(id);
    res.json({ revisions });
  } catch (error) {
    next(error);
  }
};

exports.restorePersonRevision = async (req, res, next) => {
  try {
    const { id, revisionId } = req.params;
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) {
      return sendError(res, 404, 'PERSON_NOT_FOUND', 'Personne non trouvée');
    }
    const allowed = await ownerCanVersion(person.treeId);
    if (!allowed) {
      return res.status(403).json({ message: 'Historique réservé au forfait Patrimoine', code: 'VERSIONING_NOT_ALLOWED' });
    }
    const revision = await prisma.personRevision.findFirst({ where: { id: revisionId, personId: id } });
    if (!revision) {
      return sendError(res, 404, 'NOT_FOUND', 'Révision introuvable');
    }
    await recordPersonRevision(person, req.user?.id, 'UPDATE');
    const snap = revision.snapshot;
    const updated = await prisma.person.update({
      where: { id },
      data: {
        firstName: snap.firstName,
        lastName: snap.lastName,
        birthDate: snap.birthDate ? new Date(snap.birthDate) : null,
        birthPlace: snap.birthPlace,
        deathDate: snap.deathDate ? new Date(snap.deathDate) : null,
        occupation: snap.occupation,
        biography: snap.biography,
        gender: snap.gender,
        photoUrl: snap.photoUrl,
      },
    });
    res.json({ message: 'Version restaurée', person: updated });
  } catch (error) {
    next(error);
  }
};