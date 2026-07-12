/**
 * Stockage objet S3-compatible (MinIO)
 */

const { randomUUID } = require('crypto');
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { storageConfig, getPublicConfig } = require('../config/storage.config');

const { bucket } = storageConfig;
let client = null;
let ready = false;

function isEnabled() {
  return Boolean(storageConfig.endpoint && storageConfig.accessKey && storageConfig.secretKey);
}

function getClient() {
  if (!client) {
    client = new S3Client({
      endpoint: storageConfig.endpoint,
      region: storageConfig.region,
      credentials: {
        accessKeyId: storageConfig.accessKey,
        secretAccessKey: storageConfig.secretKey,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

function getMinioBaseUrl() {
  if (storageConfig.publicUrl) return storageConfig.publicUrl.replace(/\/$/, '');
  const endpoint = storageConfig.endpoint.replace(/\/$/, '');
  return `${endpoint}/${bucket}`;
}

function getProxyBaseUrl() {
  return `${storageConfig.apiPublicUrl}/api/uploads/file`;
}

function getPublicUrl(key) {
  if (storageConfig.useProxy) {
    return `${getProxyBaseUrl()}/${key}`;
  }
  return `${getMinioBaseUrl()}/${key}`;
}

function extractKeyFromUrl(url) {
  if (!url || url.startsWith('data:')) return null;

  const proxyPrefix = `${getProxyBaseUrl()}/`;
  if (url.startsWith(proxyPrefix)) {
    return decodeURIComponent(url.slice(proxyPrefix.length));
  }

  const minioBase = getMinioBaseUrl();
  if (url.startsWith(`${minioBase}/`)) {
    return url.slice(minioBase.length + 1);
  }

  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) return url.slice(idx + marker.length);

  const fileMarker = '/api/uploads/file/';
  const fileIdx = url.indexOf(fileMarker);
  if (fileIdx !== -1) {
    return decodeURIComponent(url.slice(fileIdx + fileMarker.length));
  }

  return null;
}

function sanitizeExt(originalName, allowedExts, fallback = 'bin') {
  const ext = (originalName.split('.').pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g, '') || fallback;
  return allowedExts.includes(ext) ? ext : fallback;
}

function buildPhotoKey(treeId, personId, originalName = '') {
  const ext = sanitizeExt(originalName, ['jpg', 'jpeg', 'png', 'webp', 'gif'], 'jpg');
  return `${storageConfig.prefixes.photos}/${treeId}/${personId || 'draft'}/${randomUUID()}.${ext}`;
}

function buildDocumentKey(treeId, personId, originalName = '') {
  const ext = sanitizeExt(originalName, ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'txt'], 'pdf');
  return `${storageConfig.prefixes.documents}/${treeId}/${personId}/${randomUUID()}.${ext}`;
}

function buildBackgroundKey(treeId, originalName = '') {
  const ext = sanitizeExt(originalName, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'], 'jpg');
  return `${storageConfig.prefixes.backgrounds}/${treeId}/${randomUUID()}.${ext}`;
}

function validateFile(type, mimetype, sizeBytes) {
  const allowed = storageConfig.allowedMime[type];
  const maxBytes = storageConfig.limits[`${type}MaxBytes`];
  if (!allowed.includes(mimetype)) {
    return { ok: false, message: `Type de fichier non autorisé pour ${type}` };
  }
  if (sizeBytes > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, message: `Fichier trop volumineux (max ${maxMb} Mo)` };
  }
  return { ok: true };
}

async function ensureBucketPolicy(s3) {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };
  try {
    await s3.send(new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    }));
  } catch (err) {
    console.warn('Politique bucket MinIO non appliquée:', err.message);
  }
}

async function initStorage() {
  if (!isEnabled()) {
    console.warn('Stockage S3 non configuré — stockage fichiers désactivé');
    return false;
  }

  const s3 = getClient();
  let created = false;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err) {
    if (!storageConfig.autoInit) {
      // Mode R2/S3 externe : le bucket doit exister (créé dans le dashboard).
      console.error(`Bucket "${bucket}" inaccessible (${err.message}) — stockage désactivé. Créez le bucket ou vérifiez les credentials.`);
      return false;
    }
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    created = true;
  }

  if (storageConfig.autoInit) {
    await ensureBucketPolicy(s3);
  }

  ready = true;
  const cfg = getPublicConfig();
  const access = storageConfig.useProxy ? getProxyBaseUrl() : getMinioBaseUrl();
  console.log(`Stockage S3 prêt — bucket "${bucket}" (accès: ${access})${created ? ' [créé]' : ''}`);
  console.log(`  Photos: ${cfg.prefixes.photos}/ · Documents: ${cfg.prefixes.documents}/`);
  return true;
}

async function uploadBuffer(key, buffer, contentType) {
  if (!ready) throw new Error('Stockage MinIO non initialisé');
  const s3 = getClient();
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return { url: getPublicUrl(key), key };
}

async function getObjectStream(key) {
  if (!ready) throw new Error('Stockage MinIO non initialisé');
  const s3 = getClient();
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return {
    stream: response.Body,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength,
  };
}

async function deleteByKey(key) {
  if (!key || !ready) return;
  const s3 = getClient();
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.warn(`Suppression objet ${key}:`, err.message);
  }
}

async function deleteByUrl(url) {
  const key = extractKeyFromUrl(url);
  if (key) await deleteByKey(key);
}

module.exports = {
  isEnabled,
  isReady: () => ready,
  initStorage,
  uploadBuffer,
  getObjectStream,
  deleteByUrl,
  deleteByKey,
  getPublicUrl,
  getPublicBaseUrl: getMinioBaseUrl,
  getProxyBaseUrl,
  extractKeyFromUrl,
  buildPhotoKey,
  buildDocumentKey,
  buildBackgroundKey,
  validateFile,
  getPublicConfig,
};
