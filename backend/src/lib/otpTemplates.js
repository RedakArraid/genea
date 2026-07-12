/**
 * Templates email OTP - fr / en selon user.locale
 */

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);

const templates = {
  fr: {
    subject: (code) => `${code}, votre code de connexion geneamap`,
    build: (code, name, phoneDisplay) => {
      const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
      const text = `${greeting}

Votre code de connexion geneamap pour le numéro ${phoneDisplay} : ${code}

Ce code est valable ${OTP_EXPIRES_MINUTES} minutes.
Si vous n'avez pas demandé ce code, ignorez ce message.

L'équipe geneamap`;
      const html = `
    <p>${greeting}</p>
    <p>Code de connexion pour <strong>${phoneDisplay}</strong> :</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0">${code}</p>
    <p style="color:#666">Valable ${OTP_EXPIRES_MINUTES} minutes.</p>
  `;
      return { text, html };
    },
  },
  en: {
    subject: (code) => `${code}, your geneamap login code`,
    build: (code, name, phoneDisplay) => {
      const greeting = name ? `Hello ${name},` : 'Hello,';
      const text = `${greeting}

Your geneamap login code for ${phoneDisplay}: ${code}

This code is valid for ${OTP_EXPIRES_MINUTES} minutes.
If you did not request this code, please ignore this message.

The geneamap team`;
      const html = `
    <p>${greeting}</p>
    <p>Login code for <strong>${phoneDisplay}</strong>:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0">${code}</p>
    <p style="color:#666">Valid for ${OTP_EXPIRES_MINUTES} minutes.</p>
  `;
      return { text, html };
    },
  },
};

function resolveLocale(locale) {
  return locale === 'en' ? 'en' : 'fr';
}

function buildOtpEmail({ code, name, phoneDisplay, locale }) {
  const lang = resolveLocale(locale);
  const tpl = templates[lang];
  const { text, html } = tpl.build(code, name, phoneDisplay);
  return { subject: tpl.subject(code), text, html };
}

module.exports = { buildOtpEmail, resolveLocale };
