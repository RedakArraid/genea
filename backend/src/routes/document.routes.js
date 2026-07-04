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
const { requireTreeRead } = require('../lib/treeAccess');

const router = express.Router({ mergeParams: true });

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
    const tree = await prisma.familyTree.findUnique({ where: { id: person.treeId } });
    if (tree?.isDemo) {
      req.personData = person;
      return next();
    }
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    await requireTreeRead(req.user.id, person.treeId);
    req.personData = person;
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
  documentUpload.single('file'),
  canWritePersonDocuments,
  documentController.uploadDocument
);

router.delete(
  '/:docId',
  isAuth,
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
