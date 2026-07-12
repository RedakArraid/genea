/**
 * Templates WhatsApp OTP - fr / en selon user.locale
 */

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);

const templates = {
  fr: (code, name, phoneDisplay) => {
    const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
    return `${greeting}

Votre code de connexion geneamap pour le numéro ${phoneDisplay} : *${code}*

Ce code est valable ${OTP_EXPIRES_MINUTES} minutes.
Si vous n'avez pas demandé ce code, ignorez ce message.

L'équipe geneamap`;
  },
  en: (code, name, phoneDisplay) => {
    const greeting = name ? `Hello ${name},` : 'Hello,';
    return `${greeting}

Your geneamap login code for ${phoneDisplay}: *${code}*

This code is valid for ${OTP_EXPIRES_MINUTES} minutes.
If you did not request this code, please ignore this message.

The geneamap team`;
  },
};

function buildOtpWhatsappMessage({ code, name, phoneDisplay, locale }) {
  const lang = locale === 'en' ? 'en' : 'fr';
  return templates[lang](code, name, phoneDisplay);
}

function buildOtpTestMessage() {
  return `geneamap, test OpenWA

Si vous recevez ce message, l'intégration WhatsApp fonctionne correctement.`;
}

module.exports = { buildOtpWhatsappMessage, buildOtpTestMessage };
