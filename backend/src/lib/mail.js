/**
 * Envoi d'emails via SMTP (Nodemailer).
 * Config : admin (DB) ou variables d'environnement.
 */

const nodemailer = require('nodemailer');
const { getEffectiveSmtpConfig } = require('./smtpSettings');

let transporter = null;
let transporterKey = null;

function configKey(config) {
  return JSON.stringify({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    from: config.from,
  });
}

async function isMailConfigured() {
  const config = await getEffectiveSmtpConfig();
  return Boolean(config.host);
}

async function getTransporter() {
  const config = await getEffectiveSmtpConfig();
  if (!config.host) return null;

  const key = configKey(config);
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    transporterKey = key;
  }
  return transporter;
}

function resetTransporter() {
  transporter = null;
  transporterKey = null;
}

function extractEmailAddress(from) {
  if (!from) return null;
  const bracket = from.match(/<([^>]+)>/);
  return (bracket ? bracket[1] : from).trim();
}

/** Aligne l'expéditeur sur le compte SMTP authentifié (requis par Hostinger, etc.) */
function resolveFromAddress(config) {
  const configured = config.from || process.env.SMTP_FROM || 'GeneaIA <noreply@geneaia.app>';
  const authUser = config.auth?.user?.trim();
  if (!authUser) return configured;

  const fromEmail = extractEmailAddress(configured)?.toLowerCase();
  if (fromEmail === authUser.toLowerCase()) return configured;

  const nameMatch = configured.match(/^([^<]+)</);
  const displayName = nameMatch ? nameMatch[1].trim().replace(/^"|"$/g, '') : 'GeneaIA';
  return `${displayName} <${authUser}>`;
}

async function sendMail({ to, subject, text, html }) {
  const config = await getEffectiveSmtpConfig();
  const from = resolveFromAddress(config);
  const transport = await getTransporter();

  if (!transport) {
    console.warn(`[mail] SMTP non configuré — email non envoyé à ${to}`);
    if (process.env.NODE_ENV === 'development' && text) {
      console.info(`[mail] Aperçu:\n${text}`);
    }
    return { simulated: true };
  }

  const info = await transport.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
}

async function verifySmtpConnection() {
  const transport = await getTransporter();
  if (!transport) {
    throw new Error('SMTP non configuré');
  }
  await transport.verify();
}

module.exports = {
  isMailConfigured,
  getTransporter,
  sendMail,
  verifySmtpConnection,
  resetTransporter,
};
