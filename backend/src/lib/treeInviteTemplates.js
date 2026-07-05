/**
 * Templates email — invitation à collaborer sur un arbre (fr / en).
 */

const { resolveLocale } = require('./otpTemplates');

const roleLabels = {
  fr: { VIEWER: 'consulter', EDITOR: 'modifier' },
  en: { VIEWER: 'view', EDITOR: 'edit' },
};

function roleLabel(locale, role) {
  const lang = resolveLocale(locale);
  return roleLabels[lang][role] || roleLabels[lang].VIEWER;
}

function buildTreeInviteEmail({ treeName, inviterName, role, inviteUrl, locale }) {
  const lang = resolveLocale(locale);
  const access = roleLabel(lang, role);
  const inviter = inviterName || (lang === 'en' ? 'A GeneaIA user' : 'Un utilisateur GeneaIA');

  if (lang === 'en') {
    const subject = `Invitation to ${access} the tree « ${treeName} » on GeneaIA`;
    const text = `Hello,

${inviter} has invited you to ${access} the family tree « ${treeName} » on GeneaIA.

Open this link to accept the invitation:
${inviteUrl}

If you do not have an account yet, create one with this email address, then open the link again.

— The GeneaIA team`;
    const html = `
    <p>Hello,</p>
    <p><strong>${inviter}</strong> has invited you to <strong>${access}</strong> the family tree <strong>« ${treeName} »</strong> on GeneaIA.</p>
    <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Accept invitation</a></p>
    <p style="color:#666;font-size:14px">Or copy this link: <a href="${inviteUrl}">${inviteUrl}</a></p>
    <p style="color:#666;font-size:14px">No account yet? Sign up with this email address, then open the link again.</p>
  `;
    return { subject, text, html };
  }

  const subject = `Invitation à ${access} l'arbre « ${treeName} » sur GeneaIA`;
  const text = `Bonjour,

${inviter} vous invite à ${access} l'arbre généalogique « ${treeName} » sur GeneaIA.

Ouvrez ce lien pour accepter l'invitation :
${inviteUrl}

Si vous n'avez pas encore de compte, créez-en un avec cette adresse email, puis rouvrez le lien.

— L'équipe GeneaIA`;
  const html = `
    <p>Bonjour,</p>
    <p><strong>${inviter}</strong> vous invite à <strong>${access}</strong> l'arbre généalogique <strong>« ${treeName} »</strong> sur GeneaIA.</p>
    <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Accepter l'invitation</a></p>
    <p style="color:#666;font-size:14px">Ou copiez ce lien : <a href="${inviteUrl}">${inviteUrl}</a></p>
    <p style="color:#666;font-size:14px">Pas encore de compte ? Inscrivez-vous avec cette adresse email, puis rouvrez le lien.</p>
  `;
  return { subject, text, html };
}

function buildTreeAccessEmail({ treeName, inviterName, role, treeUrl, locale }) {
  const lang = resolveLocale(locale);
  const access = roleLabel(lang, role);
  const inviter = inviterName || (lang === 'en' ? 'A GeneaIA user' : 'Un utilisateur GeneaIA');

  if (lang === 'en') {
    const subject = `You can now ${access} « ${treeName} » on GeneaIA`;
    const text = `Hello,

${inviter} has given you access to ${access} the family tree « ${treeName} » on GeneaIA.

Open the tree:
${treeUrl}

— The GeneaIA team`;
    const html = `
    <p>Hello,</p>
    <p><strong>${inviter}</strong> has given you access to <strong>${access}</strong> the family tree <strong>« ${treeName} »</strong> on GeneaIA.</p>
    <p><a href="${treeUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Open tree</a></p>
    <p style="color:#666;font-size:14px">Or copy this link: <a href="${treeUrl}">${treeUrl}</a></p>
  `;
    return { subject, text, html };
  }

  const subject = `Vous pouvez maintenant ${access} « ${treeName} » sur GeneaIA`;
  const text = `Bonjour,

${inviter} vous a donné accès pour ${access} l'arbre généalogique « ${treeName} » sur GeneaIA.

Ouvrir l'arbre :
${treeUrl}

— L'équipe GeneaIA`;
  const html = `
    <p>Bonjour,</p>
    <p><strong>${inviter}</strong> vous a donné accès pour <strong>${access}</strong> l'arbre généalogique <strong>« ${treeName} »</strong> sur GeneaIA.</p>
    <p><a href="${treeUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Ouvrir l'arbre</a></p>
    <p style="color:#666;font-size:14px">Ou copiez ce lien : <a href="${treeUrl}">${treeUrl}</a></p>
  `;
  return { subject, text, html };
}

module.exports = { buildTreeInviteEmail, buildTreeAccessEmail };
