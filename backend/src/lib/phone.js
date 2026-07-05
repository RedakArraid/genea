/**
 * Normalisation téléphone Côte d'Ivoire (+225)
 */

function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let p = raw.trim().replace(/[\s.-]/g, '');
  if (!p) return null;

  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);

  if (p.startsWith('225') && p.length >= 12) {
    return `+${p.slice(0, 12)}`;
  }

  // 07XXXXXXXX ou 05XXXXXXXX (10 chiffres)
  if (/^0\d{9}$/.test(p)) {
    return `+225${p}`;
  }

  return null;
}

function looksLikePhone(input) {
  return normalizePhone(input) !== null;
}

function isValidCiPhone(phone) {
  return /^\+2250\d{9}$/.test(phone);
}

module.exports = { normalizePhone, looksLikePhone, isValidCiPhone };
