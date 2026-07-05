/**
 * Normalisation téléphone internationale (libphonenumber-js).
 * Défaut : Côte d'Ivoire (+225).
 */

const { parsePhoneNumberFromString, isValidPhoneNumber } = require('libphonenumber-js');

const DEFAULT_COUNTRY = 'CI';

function normalizePhone(raw, defaultCountry = DEFAULT_COUNTRY) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format('E.164');
}

function looksLikePhone(input, defaultCountry = DEFAULT_COUNTRY) {
  return normalizePhone(input, defaultCountry) !== null;
}

function isValidPhone(phone) {
  if (!phone) return false;
  return isValidPhoneNumber(phone);
}

/** Compatibilité : valide tout numéro E.164 (plus seulement CI) */
function isValidCiPhone(phone) {
  return isValidPhone(phone);
}

/** Affichage national : +2250700000001 → 0700000001 (CI) ou format local du pays */
function formatPhoneDisplay(phone, defaultCountry = DEFAULT_COUNTRY) {
  if (!phone) return '';
  const parsed = parsePhoneNumberFromString(phone, defaultCountry);
  if (!parsed) return phone;
  if (parsed.country === 'CI') {
    return `0${parsed.nationalNumber}`;
  }
  return parsed.formatNational();
}

module.exports = {
  normalizePhone,
  looksLikePhone,
  isValidPhone,
  isValidCiPhone,
  formatPhoneDisplay,
  DEFAULT_COUNTRY,
};
