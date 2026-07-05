/**
 * Configuration SMTP : base de données (admin) avec repli sur les variables d'environnement.
 */

const prisma = require('./prisma');

const SETTING_ID = 'default';

function fromEnv() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  return {
    host: process.env.SMTP_HOST?.trim() || null,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    user: user || null,
    pass: pass || null,
    from: process.env.SMTP_FROM?.trim() || null,
    source: 'env',
  };
}

function toTransportConfig(config) {
  const user = config.user?.trim();
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: user ? { user, pass: config.pass } : undefined,
    from: config.from,
    source: config.source,
  };
}

async function getDbSettings() {
  return prisma.smtpSetting.findUnique({ where: { id: SETTING_ID } });
}

async function getEffectiveSmtpConfig() {
  const db = await getDbSettings();
  if (db?.host?.trim()) {
    return toTransportConfig({
      host: db.host.trim(),
      port: db.port,
      secure: db.secure,
      user: db.user,
      pass: db.pass,
      from: db.from,
      source: 'db',
    });
  }
  return toTransportConfig(fromEnv());
}

async function getPublicSmtpSettings() {
  const db = await getDbSettings();
  const env = fromEnv();
  const usingDb = Boolean(db?.host?.trim());

  if (usingDb) {
    return {
      host: db.host,
      port: db.port,
      secure: db.secure,
      user: db.user || '',
      from: db.from || '',
      hasPassword: Boolean(db.pass),
      configured: true,
      source: 'db',
      updatedAt: db.updatedAt,
    };
  }

  return {
    host: env.host || '',
    port: env.port,
    secure: env.secure,
    user: env.user || '',
    from: env.from || '',
    hasPassword: Boolean(env.pass),
    configured: Boolean(env.host),
    source: env.host ? 'env' : 'none',
    updatedAt: null,
  };
}

async function updateSmtpSettings(payload) {
  const data = {};
  if (payload.host !== undefined) data.host = payload.host?.trim() || null;
  if (payload.port !== undefined) data.port = parseInt(payload.port, 10) || 587;
  if (payload.secure !== undefined) data.secure = Boolean(payload.secure);
  if (payload.user !== undefined) data.user = payload.user?.trim() || null;
  if (payload.from !== undefined) data.from = payload.from?.trim() || null;
  if (payload.pass !== undefined && payload.pass !== '') {
    data.pass = payload.pass;
  }

  const row = await prisma.smtpSetting.upsert({
    where: { id: SETTING_ID },
    create: { id: SETTING_ID, ...data },
    update: data,
  });

  return getPublicSmtpSettings();
}

module.exports = {
  getEffectiveSmtpConfig,
  getPublicSmtpSettings,
  updateSmtpSettings,
};
