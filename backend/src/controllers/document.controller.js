/**
 * Gestion des documents personne (MinIO)
 */

const prisma = require('../lib/prisma');
const storage = require('../lib/storage');
const { assertMediaAssetLimit } = require('../lib/planAccess');
const { storageConfig } = require('../config/storage.config');

const VALID_CATEGORIES = new Set(storageConfig.documentCategories.map((c) => c.id));

exports.listDocuments = async (req, res, next) => {
  try {
    const { personId } = req.params;
    const documents = await prisma.personDocument.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!storage.isReady()) {
      return res.status(503).json({ message: 'Stockage MinIO indisponible' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier document requis' });
    }

    const { personId } = req.params;
    const { title, category = 'other' } = req.body;

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { FamilyTree: { select: { ownerId: true } } },
    });
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }

    await assertMediaAssetLimit(person.FamilyTree.ownerId);

    const validation = storage.validateFile('document', req.file.mimetype, req.file.size);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const docCategory = VALID_CATEGORIES.has(category) ? category : 'other';
    const docTitle = (title || req.file.originalname || 'Document').trim().slice(0, 200);

    const key = storage.buildDocumentKey(person.treeId, personId, req.file.originalname);
    const { url, key: fileKey } = await storage.uploadBuffer(key, req.file.buffer, req.file.mimetype);

    const document = await prisma.personDocument.create({
      data: {
        personId,
        treeId: person.treeId,
        title: docTitle,
        fileName: req.file.originalname,
        fileUrl: url,
        fileKey,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        category: docCategory,
        uploadedById: req.user?.id || null,
      },
    });

    res.status(201).json({ document });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const docId = req.params.docId || req.params.id;
    const doc = await prisma.personDocument.findUnique({ where: { id: docId } });
    if (!doc) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    await storage.deleteByKey(doc.fileKey);
    await prisma.personDocument.delete({ where: { id: docId } });

    res.json({ message: 'Document supprimé' });
  } catch (error) {
    next(error);
  }
};
