/**
 * Routes upload MinIO
 */

const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const { canWriteTree } = require('../middleware/treeAccess.middleware');
const { storageConfig } = require('../config/storage.config');

const router = express.Router();

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: storageConfig.limits.photoMaxBytes },
  fileFilter: (_req, file, cb) => {
    if (storageConfig.allowedMime.photo.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format photo non supporté'));
  },
});

const canWriteTreeFromBody = async (req, res, next) => {
  try {
    const { treeId } = req.body;
    if (!treeId) {
      return res.status(400).json({ message: 'ID d\'arbre manquant' });
    }
    req.params.treeId = treeId;
    return canWriteTree(req, res, next);
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

router.get('/status', uploadController.getStorageStatus);

const fileRouter = express.Router();
fileRouter.get('/*', optionalAuth, uploadController.canReadUploadedFile, uploadController.serveFile);
router.use('/file', fileRouter);

router.post(
  '/photo',
  isAuth,
  photoUpload.single('photo'),
  canWriteTreeFromBody,
  uploadController.uploadPhoto
);

router.post(
  '/tree-background',
  isAuth,
  photoUpload.single('background'),
  canWriteTreeFromBody,
  uploadController.uploadTreeBackground
);

module.exports = router;
