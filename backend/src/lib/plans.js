/**
 * Forfaits geneamap — tarification internationale (USD)
 *
 * Découverte : gratuit à l'inscription
 * Famille : $24/an — généalogie & petits organigrammes
 * Patrimoine : $42/an ou $4,50/mois — illimité + versioning
 */

const CURRENCY = 'USD';
const FX_USD_XOF = Number(process.env.FX_USD_XOF) || 650;

/** Prix affichage FCFA (paiement reste USD via Paystack) */
const PRICE_XOF = {
  SOLO: 0,
  FAMILY: 15600,
  PATRIMONY: 27300,
  PATRIMONY_MONTHLY: 2925,
};

const PLANS = {
  SOLO: {
    id: 'SOLO',
    name: 'Découverte',
    billingPeriod: 'free',
    priceUsd: 0,
    priceLabel: 'Gratuit',
    durationDays: null,
    maxTrees: 1,
    maxPersonsPerTree: 60,
    maxCollaborators: 2,
    maxMediaAssets: 15,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    features: [
      '1 arbre (généalogie ou organisation)',
      'Jusqu\'à 60 fiches',
      '15 photos & documents',
      'Partage privé (2 collaborateurs)',
    ],
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Famille',
    billingPeriod: 'yearly',
    priceUsd: 24,
    priceLabel: '$24 / year',
    durationDays: 365,
    maxTrees: 4,
    maxPersonsPerTree: 350,
    maxCollaborators: Infinity,
    maxMediaAssets: 80,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    features: [
      '4 arbres, 350 fiches par arbre',
      'Organigrammes & lexique personnalisé',
      '80 photos & documents inclus',
      'Collaborateurs illimités',
      'Export GEDCOM & PDF',
    ],
  },
  PATRIMONY: {
    id: 'PATRIMONY',
    name: 'Patrimoine',
    billingPeriod: 'yearly',
    priceUsd: 42,
    priceMonthlyUsd: 4.5,
    priceLabel: '$42 / year',
    priceLabelMonthly: '$4.50 / month',
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
      'Grands organigrammes & arrière-plans',
      'Photos & documents illimités',
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
  return plan.durationDays ?? null;
}

function isFreePlan(planId) {
  const plan = PLANS[planId];
  return !!plan && plan.priceUsd === 0;
}

function isPaidPlan(planId) {
  return !!PLANS[planId] && !isFreePlan(planId);
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
  isFreePlan,
  isPaidPlan,
  computeDiscountedAmount,
  toPaystackAmount,
  serializePlan,
  listPlansForApi,
};
