/**
 * Upload de fichiers vers MinIO
 */

const prisma = require('../lib/prisma');
const storage = require('../lib/storage');
const { resolveTreeAccess } = require('../lib/treeAccess');
const { assertMediaAssetLimit } = require('../lib/planAccess');
const { storageConfig } = require('../config/storage.config');

exports.canReadUploadedFile = async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.path.replace(/^\//, ''));
    if (!key || key.includes('..')) {
      return res.status(400).json({ message: 'Clé fichier invalide' });
    }

    const parts = key.split('/');
    const prefix = parts[0];
    const treeId = parts[1];
    const allowedPrefixes = [storageConfig.prefixes.photos, storageConfig.prefixes.documents];
    if (!treeId || !allowedPrefixes.includes(prefix)) {
      return res.status(400).json({ message: 'Clé fichier invalide' });
    }

    const access = await resolveTreeAccess(req.user?.id, treeId);
    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé au fichier' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!storage.isReady()) {
      return res.status(503).json({ message: 'Stockage MinIO indisponible' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier photo requis' });
    }

    const { treeId, personId } = req.body;
    if (!treeId) {
      return res.status(400).json({ message: 'treeId requis' });
    }

    const validation = storage.validateFile('photo', req.file.mimetype, req.file.size);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId },
      select: { ownerId: true },
    });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre non trouvé' });
    }

    let replacingExistingPhoto = false;
    if (personId) {
      const person = await prisma.person.findUnique({
        where: { id: personId },
        select: { photoUrl: true, treeId: true },
      });
      if (person?.treeId === treeId && person.photoUrl) {
        replacingExistingPhoto = true;
      }
    }

    await assertMediaAssetLimit(tree.ownerId, { replacingExistingPhoto });

    const key = storage.buildPhotoKey(treeId, personId, req.file.originalname);
    const { url, key: objectKey } = await storage.uploadBuffer(key, req.file.buffer, req.file.mimetype);

    res.status(201).json({ url, key: objectKey });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.serveFile = async (req, res, next) => {
  try {
    if (!storage.isReady()) {
      return res.status(503).json({ message: 'Stockage indisponible' });
    }

    const key = decodeURIComponent(req.path.replace(/^\//, ''));
    if (!key || key.includes('..')) {
      return res.status(400).json({ message: 'Clé fichier invalide' });
    }

    const { stream, contentType, contentLength } = await storage.getObjectStream(key);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    stream.pipe(res);
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    next(error);
  }
};

exports.getStorageStatus = (req, res) => {
  res.json({
    enabled: storage.isEnabled(),
    ready: storage.isReady(),
    publicBaseUrl: storage.isReady()
      ? (storage.getProxyBaseUrl?.() || storage.getPublicBaseUrl())
      : null,
    useProxy: storage.getPublicConfig?.()?.useProxy ?? true,
    ...storage.getPublicConfig(),
  });
};
