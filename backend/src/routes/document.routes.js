/**
 * Routes documents personne
 */

const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const { canWritePerson } = require('../middleware/treeAccess.middleware');
const { storageConfig } = require('../config/storage.config');
const prisma = require('../lib/prisma');
const { resolveTreeAccess } = require('../lib/treeAccess');
const { isDocumentsEnabled } = require('../lib/features');

const router = express.Router({ mergeParams: true });

const requireDocumentsFeature = (_req, res, next) => {
  if (!isDocumentsEnabled()) {
    return res.status(403).json({
      code: 'FEATURE_DISABLED',
      message: 'Les documents seront disponibles prochainement',
    });
  }
  next();
};

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: storageConfig.limits.documentMaxBytes },
});

const canReadPersonDocuments = async (req, res, next) => {
  try {
    const { personId } = req.params;
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    const access = await resolveTreeAccess(req.user?.id, person.treeId);
    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    req.personData = person;
    req.treeAccess = access;
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canWritePersonDocuments = async (req, res, next) => {
  try {
    const { personId } = req.params;
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { FamilyTree: true },
    });
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    req.params.id = personId;
    req.personData = person;
    return canWritePerson(req, res, next);
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

router.get('/', optionalAuth, canReadPersonDocuments, documentController.listDocuments);

router.post(
  '/',
  isAuth,
  requireDocumentsFeature,
  documentUpload.single('file'),
  canWritePersonDocuments,
  documentController.uploadDocument
);

router.delete(
  '/:docId',
  isAuth,
  requireDocumentsFeature,
  async (req, res, next) => {
    try {
      const { docId } = req.params;
      const doc = await prisma.personDocument.findUnique({
        where: { id: docId },
        include: { Person: { include: { FamilyTree: true } } },
      });
      if (!doc) {
        return res.status(404).json({ message: 'Document non trouvé' });
      }
      req.params.id = doc.personId;
      req.personData = doc.Person;
      req.documentId = docId;
      return canWritePerson(req, res, next);
    } catch (error) {
      res.status(error.statusCode || 403).json({ message: error.message });
    }
  },
  documentController.deleteDocument
);

module.exports = router;
