/**
 * Forfaits GeneaIA — tarification internationale (USD)
 *
 * Essai : $5 — paiement unique
 * Famille : $30/an
 * Patrimoine : $50/an ou $5/mois
 */

const CURRENCY = 'USD';
const FX_USD_XOF = Number(process.env.FX_USD_XOF) || 650;

/** Prix affichage FCFA (paiement reste USD via Paystack) */
const PRICE_XOF = {
  SOLO: 3250,
  FAMILY: 19500,
  PATRIMONY: 32500,
  PATRIMONY_MONTHLY: 3250,
};

const PLANS = {
  SOLO: {
    id: 'SOLO',
    name: 'Essai',
    billingPeriod: 'once',
    priceUsd: 5,
    priceLabel: '$5 — one-time',
    durationDays: 90,
    maxTrees: 1,
    maxPersonsPerTree: 25,
    maxCollaborators: 2,
    maxMediaAssets: 10,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    features: [
      '1 arbre, jusqu\'à 25 fiches',
      '90 jours pour tester GeneaIA',
      'Partage privé (2 collaborateurs)',
      'Paiement carte sécurisé',
    ],
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Famille',
    billingPeriod: 'yearly',
    priceUsd: 30,
    priceLabel: '$30 / year',
    durationDays: 365,
    maxTrees: 5,
    maxPersonsPerTree: 500,
    maxCollaborators: Infinity,
    maxMediaAssets: 100,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    features: [
      '5 arbres, 500 fiches par arbre',
      '100 photos & documents inclus',
      'Collaborateurs illimités',
      'Arbres publics en lecture seule',
      'Export GEDCOM & PDF',
    ],
  },
  PATRIMONY: {
    id: 'PATRIMONY',
    name: 'Patrimoine',
    billingPeriod: 'yearly',
    priceUsd: 50,
    priceMonthlyUsd: 5,
    priceLabel: '$50 / year',
    priceLabelMonthly: '$5 / month',
    durationDays: 365,
    durationDaysMonthly: 30,
    maxTrees: Infinity,
    maxPersonsPerTree: Infinity,
    maxCollaborators: Infinity,
    maxMediaAssets: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: true,
    features: [
      'Personnes et arbres illimités',
      'Photos & documents illimités',
      'Arbres publics en lecture seule',
      'Export & import GEDCOM, PDF',
      'Historique des modifications',
      'Support prioritaire',
    ],
  },
};

function getPlanLimits(plan) {
  return PLANS[plan] || PLANS.SOLO;
}

function getPlanPrice(planId, billingInterval = 'yearly') {
  const plan = PLANS[planId] || PLANS.SOLO;
  if (planId === 'PATRIMONY' && billingInterval === 'monthly' && plan.priceMonthlyUsd != null) {
    return plan.priceMonthlyUsd;
  }
  return plan.priceUsd;
}

/** Prix FCFA affichage (forfait + intervalle) */
function getPlanPriceXof(planId, billingInterval = 'yearly') {
  if (planId === 'PATRIMONY' && billingInterval === 'monthly') {
    return PRICE_XOF.PATRIMONY_MONTHLY;
  }
  return PRICE_XOF[planId] ?? Math.round(getPlanPrice(planId, billingInterval) * FX_USD_XOF);
}

function getPlanDisplayAmounts(planId, billingInterval = 'yearly') {
  const usd = getPlanPrice(planId, billingInterval);
  return {
    usd,
    xof: getPlanPriceXof(planId, billingInterval),
    fxRate: FX_USD_XOF,
  };
}

function getPlanDurationDays(planId, billingInterval = 'yearly') {
  const plan = PLANS[planId] || PLANS.SOLO;
  if (planId === 'PATRIMONY' && billingInterval === 'monthly') {
    return plan.durationDaysMonthly ?? 30;
  }
  return plan.durationDays;
}

function isPaidPlan(planId) {
  return !!PLANS[planId];
}

function computeDiscountedAmount(baseAmount, promo) {
  if (!promo) return baseAmount;
  if (promo.discountType === 'PERCENT') {
    return Math.max(0, Math.round(baseAmount * (1 - promo.discountValue / 100) * 100) / 100);
  }
  return Math.max(0, baseAmount - promo.discountValue);
}

/** Paystack : montant en centimes USD (× 100) */
function toPaystackAmount(usd) {
  return Math.round(usd * 100);
}

/** Sérialise un forfait pour JSON (Infinity → null) */
function serializePlan(plan) {
  const out = { ...plan };
  for (const key of Object.keys(out)) {
    if (out[key] === Infinity) out[key] = null;
  }
  return out;
}

function listPlansForApi() {
  return Object.values(PLANS).map(serializePlan);
}

module.exports = {
  PLANS,
  CURRENCY,
  getPlanLimits,
  getPlanPrice,
  getPlanPriceXof,
  getPlanDisplayAmounts,
  FX_USD_XOF,
  PRICE_XOF,
  getPlanDurationDays,
  isPaidPlan,
  computeDiscountedAmount,
  toPaystackAmount,
  serializePlan,
  listPlansForApi,
};
