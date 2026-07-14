/**
 * Feature flags produit — activer via variables d'environnement.
 * Documents/fiches : FEATURE_DOCUMENTS_ENABLED=true (désactivé par défaut).
 */
function isDocumentsEnabled() {
  return process.env.FEATURE_DOCUMENTS_ENABLED === 'true';
}

module.exports = { isDocumentsEnabled };
