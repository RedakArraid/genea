const { isPlanEntitlementActive } = require('./payments/fulfill');
const { getPlanLimits } = require('./plans');

function assertPlanEntitlement(user) {
  if (!isPlanEntitlementActive(user)) {
    const err = new Error('Forfait requis — choisissez un forfait sur la page Tarifs');
    err.statusCode = 402;
    throw err;
  }
}

function getEffectivePlanLimits(user) {
  if (!isPlanEntitlementActive(user)) {
    return {
      ...getPlanLimits('SOLO'),
      maxTrees: 0,
      maxPersonsPerTree: 0,
      maxCollaborators: 0,
    };
  }
  return getPlanLimits(user.plan);
}

module.exports = { assertPlanEntitlement, getEffectivePlanLimits, isPlanEntitlementActive };
