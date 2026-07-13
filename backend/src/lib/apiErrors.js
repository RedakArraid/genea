/**
 * Réponses d'erreur API avec code stable (traduit côté frontend via errors.json).
 */
function sendError(res, status, code, message, params) {
  const body = { code, message };
  if (params && Object.keys(params).length) body.params = params;
  return res.status(status).json(body);
}

/** Mappe les messages express-validator vers des codes i18n */
function validationCode(msg) {
  if (msg.includes('date de naissance') && msg.includes('futur')) return 'BIRTH_DATE_FUTURE';
  if (msg.includes('téléphone')) return 'INVALID_PHONE';
  if (msg.includes('email')) return 'EMAIL_TAKEN';
  return 'VALIDATION_ERROR';
}

function sendValidationErrors(res, errors) {
  const first = errors.array()[0];
  const code = validationCode(first?.msg || '');
  return sendError(res, 400, code, first?.msg || 'Validation error');
}

function sendStatusError(res, error, fallbackStatus = 403) {
  const status = error.statusCode || fallbackStatus;
  const body = { message: error.message };
  if (error.code) body.code = error.code;
  return res.status(status).json(body);
}

module.exports = { sendError, sendValidationErrors, validationCode, sendStatusError };
