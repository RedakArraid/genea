/**
 * Configuration OpenWA : base de données (admin) avec repli sur les variables d'environnement.
 */

const prisma = require('./prisma');

const SETTING_ID = 'default';

function fromEnv() {
  const baseUrl = process.env.OPENWA_BASE_URL?.trim() || null;
  const apiKey = process.env.OPENWA_API_KEY?.trim() || null;
  const sessionId = process.env.OPENWA_SESSION_ID?.trim() || null;
  const enabled = process.env.OPENWA_ENABLED === 'true';

  return {
    enabled,
    baseUrl,
    apiKey,
    sessionId,
    source: 'env',
  };
}

function normalizeBaseUrl(raw) {
  if (!raw?.trim()) return null;
  let url = raw.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) url += '/api';
  return url;
}

async function getDbSettings() {
  return prisma.openWaSetting.findUnique({ where: { id: SETTING_ID } });
}

function isDbConfigured(db) {
  return Boolean(db?.baseUrl?.trim() && db?.apiKey && db?.sessionId?.trim());
}

function isEnvConfigured(env) {
  return Boolean(env.baseUrl && env.apiKey && env.sessionId);
}

async function getEffectiveOpenWaConfig() {
  const db = await getDbSettings();
  if (isDbConfigured(db)) {
    return {
      enabled: Boolean(db.enabled),
      baseUrl: normalizeBaseUrl(db.baseUrl),
      apiKey: db.apiKey,
      sessionId: db.sessionId.trim(),
      source: 'db',
    };
  }

  const env = fromEnv();
  if (isEnvConfigured(env)) {
    return {
      enabled: env.enabled,
      baseUrl: normalizeBaseUrl(env.baseUrl),
      apiKey: env.apiKey,
      sessionId: env.sessionId,
      source: 'env',
    };
  }

  return {
    enabled: false,
    baseUrl: null,
    apiKey: null,
    sessionId: null,
    source: 'none',
  };
}

async function isOpenWaActive() {
  const config = await getEffectiveOpenWaConfig();
  return config.enabled && Boolean(config.baseUrl && config.apiKey && config.sessionId);
}

async function getPublicOpenWaSettings() {
  const db = await getDbSettings();
  const env = fromEnv();
  const usingDb = isDbConfigured(db);

  if (usingDb) {
    return {
      enabled: Boolean(db.enabled),
      baseUrl: db.baseUrl || '',
      sessionId: db.sessionId || '',
      hasApiKey: Boolean(db.apiKey),
      configured: true,
      source: 'db',
      updatedAt: db.updatedAt,
    };
  }

  return {
    enabled: env.enabled,
    baseUrl: env.baseUrl || '',
    sessionId: env.sessionId || '',
    hasApiKey: Boolean(env.apiKey),
    configured: isEnvConfigured(env),
    source: isEnvConfigured(env) ? 'env' : 'none',
    updatedAt: null,
  };
}

async function updateOpenWaSettings(payload) {
  const data = {};
  if (payload.enabled !== undefined) data.enabled = Boolean(payload.enabled);
  if (payload.baseUrl !== undefined) {
    data.baseUrl = payload.baseUrl?.trim() ? normalizeBaseUrl(payload.baseUrl) : null;
  }
  if (payload.sessionId !== undefined) data.sessionId = payload.sessionId?.trim() || null;
  if (payload.apiKey !== undefined && payload.apiKey !== '') {
    data.apiKey = payload.apiKey;
  }

  await prisma.openWaSetting.upsert({
    where: { id: SETTING_ID },
    create: { id: SETTING_ID, ...data },
    update: data,
  });

  return getPublicOpenWaSettings();
}

module.exports = {
  normalizeBaseUrl,
  getEffectiveOpenWaConfig,
  isOpenWaActive,
  getPublicOpenWaSettings,
  updateOpenWaSettings,
};
