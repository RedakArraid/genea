/**
 * Codes OTP par téléphone (connexion).
 * Envoi : email si le compte en a un + SMTP configuré ; log console en dev.
 */

const crypto = require('crypto');
const prisma = require('./prisma');
const { sendMail, isMailConfigured } = require('./mail');
const { normalizePhone, isValidPhone, formatPhoneDisplay } = require('./phone');
const { buildOtpEmail } = require('./otpTemplates');

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_COOLDOWN_SECONDS = parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10);

function hashOtp(code) {
  const secret = process.env.JWT_SECRET || 'otp-fallback-secret';
  return crypto.createHmac('sha256', secret).update(String(code).trim()).digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function isOtpDeliveryAvailable() {
  return (await isMailConfigured()) || process.env.NODE_ENV === 'development';
}

const GENERIC_SENT_MESSAGE = 'Si un compte existe avec ce numéro, un code a été envoyé.';

async function sendLoginOtpEmail(user, code, phoneDisplay) {
  const { subject, text, html } = buildOtpEmail({
    code,
    name: user.name,
    phoneDisplay,
    locale: user.locale,
  });
  await sendMail({ to: user.email, subject, text, html });
}

async function requestLoginOtp(rawPhone, defaultCountry = 'CI') {
  const phone = normalizePhone(rawPhone, defaultCountry);
  if (!phone || !isValidPhone(phone)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_PHONE_CI',
      message: 'Numéro de téléphone invalide (format CI : 07XXXXXXXX).',
    };
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return { ok: true, message: GENERIC_SENT_MESSAGE };
  }

  const recent = await prisma.otpCode.findFirst({
    where: { phone, purpose: 'LOGIN', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < OTP_COOLDOWN_SECONDS * 1000) {
    const waitSec = Math.ceil(
      (OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recent.createdAt.getTime())) / 1000,
    );
    return {
      ok: false,
      status: 429,
      code: 'OTP_RATE_LIMITED',
      message: `Veuillez patienter ${waitSec}s avant de redemander un code.`,
      params: { seconds: waitSec },
    };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  const phoneDisplay = formatPhoneDisplay(phone);

  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashOtp(code),
      purpose: 'LOGIN',
      expiresAt,
    },
  });

  let delivered = false;
  if (user.email && (await isMailConfigured())) {
    await sendLoginOtpEmail(user, code, phoneDisplay);
    delivered = true;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[otp] LOGIN ${phoneDisplay} → ${code} (expire ${expiresAt.toISOString()})`);
    delivered = true;
  }

  if (!delivered) {
    return {
      ok: false,
      status: 503,
      code: 'OTP_UNAVAILABLE',
      message: 'Envoi du code indisponible. Ajoutez un email à votre profil ou utilisez votre mot de passe.',
    };
  }

  return { ok: true, message: GENERIC_SENT_MESSAGE };
}

async function verifyLoginOtp(rawPhone, code, defaultCountry = 'CI') {
  const phone = normalizePhone(rawPhone, defaultCountry);
  if (!phone || !isValidPhone(phone)) {
    return { ok: false, code: 'INVALID_PHONE', message: 'Numéro de téléphone invalide.' };
  }

  const trimmedCode = String(code || '').trim();
  if (!/^\d{6}$/.test(trimmedCode)) {
    return { ok: false, code: 'INVALID_OTP_FORMAT', message: 'Code invalide (6 chiffres attendus).' };
  }

  const record = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose: 'LOGIN',
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, code: 'INVALID_OTP', message: 'Code invalide ou expiré.' };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, code: 'OTP_TOO_MANY_ATTEMPTS', message: 'Trop de tentatives. Demandez un nouveau code.' };
  }

  if (hashOtp(trimmedCode) !== record.codeHash) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, code: 'OTP_WRONG_CODE', message: 'Code incorrect.' };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return { ok: false, code: 'ACCOUNT_NOT_FOUND', message: 'Compte introuvable.' };
  }

  return { ok: true, user };
}

module.exports = {
  isOtpDeliveryAvailable,
  requestLoginOtp,
  verifyLoginOtp,
};
