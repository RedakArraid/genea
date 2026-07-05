/**
 * Envoi d'emails via SMTP (Nodemailer).
 * En local Docker : Mailpit (SMTP 1025, UI http://localhost:8025).
 */

const nodemailer = require('nodemailer');

function getSmtpConfig() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  return {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: user ? { user, pass } : undefined,
  };
}

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

let transporter = null;

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport(getSmtpConfig());
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || 'GeneaIA <noreply@geneaia.app>';
  const transport = getTransporter();

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

module.exports = {
  isMailConfigured,
  getTransporter,
  sendMail,
};
