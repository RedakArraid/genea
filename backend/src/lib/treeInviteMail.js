/**
 * Envoi des emails d'invitation / accès à un arbre collaboratif.
 */

const { sendMail } = require('./mail');
const { buildTreeInviteEmail, buildTreeAccessEmail } = require('./treeInviteTemplates');

function publicFrontendUrl() {
  return process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
}

async function sendTreeInviteEmail({ to, treeName, inviterName, role, token, locale }) {
  const inviteUrl = `${publicFrontendUrl()}/invite/${token}`;
  const { subject, text, html } = buildTreeInviteEmail({
    treeName,
    inviterName,
    role,
    inviteUrl,
    locale,
  });
  return sendMail({ to, subject, text, html });
}

async function sendTreeAccessEmail({ to, treeName, inviterName, role, treeId, locale }) {
  const treeUrl = `${publicFrontendUrl()}/family-tree/${treeId}`;
  const { subject, text, html } = buildTreeAccessEmail({
    treeName,
    inviterName,
    role,
    treeUrl,
    locale,
  });
  return sendMail({ to, subject, text, html });
}

/** Best-effort : ne bloque pas l'API si l'email échoue. */
async function notifyTreeInviteEmail(params) {
  try {
    const result = await sendTreeInviteEmail(params);
    return { sent: Boolean(result?.sent), simulated: Boolean(result?.simulated) };
  } catch (error) {
    console.error('[mail] tree invite:', error.message);
    return { sent: false, error: error.message };
  }
}

async function notifyTreeAccessEmail(params) {
  try {
    const result = await sendTreeAccessEmail(params);
    return { sent: Boolean(result?.sent), simulated: Boolean(result?.simulated) };
  } catch (error) {
    console.error('[mail] tree access:', error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = { sendTreeInviteEmail, sendTreeAccessEmail, notifyTreeInviteEmail, notifyTreeAccessEmail };
