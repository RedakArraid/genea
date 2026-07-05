/**
 * Configuration centralisée du stockage MinIO / S3
 */

const PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const DOCUMENT_CATEGORIES = [
  { id: 'birth', label: 'Acte de naissance' },
  { id: 'marriage', label: 'Acte de mariage' },
  { id: 'death', label: 'Acte de décès' },
  { id: 'census', label: 'Recensement / archive' },
  { id: 'photo', label: 'Photo / scan' },
  { id: 'other', label: 'Autre document' },
];

function parseMb(envKey, fallback) {
  const n = parseInt(process.env[envKey], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const storageConfig = {
  endpoint: process.env.S3_ENDPOINT || '',
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  bucket: process.env.S3_BUCKET || 'geneaia',
  region: process.env.S3_REGION || 'us-east-1',
  publicUrl: process.env.S3_PUBLIC_URL || '',
  apiPublicUrl: (process.env.API_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, ''),
  useProxy: process.env.STORAGE_USE_PROXY !== 'false',
  // true (MinIO local) : crée le bucket + policy publique au démarrage.
  // false (Cloudflare R2 / S3 externe) : le bucket doit exister, HeadBucket seulement.
  autoInit: process.env.STORAGE_AUTO_INIT !== 'false',

  prefixes: {
    photos: process.env.STORAGE_PHOTO_PREFIX || 'photos',
    documents: process.env.STORAGE_DOCUMENT_PREFIX || 'documents',
  },

  limits: {
    photoMaxBytes: parseMb('STORAGE_PHOTO_MAX_MB', 5) * 1024 * 1024,
    documentMaxBytes: parseMb('STORAGE_DOCUMENT_MAX_MB', 20) * 1024 * 1024,
  },

  allowedMime: {
    photo: PHOTO_MIME,
    document: DOCUMENT_MIME,
  },

  documentCategories: DOCUMENT_CATEGORIES,
};

function getPublicConfig() {
  return {
    enabled: Boolean(storageConfig.endpoint && storageConfig.accessKey && storageConfig.secretKey),
    useProxy: storageConfig.useProxy,
    prefixes: storageConfig.prefixes,
    limits: {
      photoMaxMb: Math.round(storageConfig.limits.photoMaxBytes / (1024 * 1024)),
      documentMaxMb: Math.round(storageConfig.limits.documentMaxBytes / (1024 * 1024)),
    },
    allowedPhotoMime: storageConfig.allowedMime.photo,
    allowedDocumentMime: storageConfig.allowedMime.document,
    documentCategories: storageConfig.documentCategories,
  };
}

module.exports = { storageConfig, getPublicConfig };
