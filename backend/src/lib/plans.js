/**
 * Forfaits geneamap - tarification internationale (USD)
 *
 * Découverte : gratuit à l'inscription
 * Famille : 15 600 FCFA/an ($24) ou 1 625 FCFA/mois
 * Patrimoine : $42/an ou $4,50/mois - 5 arbres, 200 personnes/arbre + versioning
 */

const CURRENCY = 'USD';
const FX_USD_XOF = Number(process.env.FX_USD_XOF) || 650;

/** Prix affichage FCFA (paiement reste USD via Paystack) */
const PRICE_XOF = {
  SOLO: 0,
  FAMILY: 15600,
  FAMILY_MONTHLY: 1625,
  PATRIMONY: 27300,
  PATRIMONY_MONTHLY: 2925,
};

const MONTHLY_BILLING_PLANS = ['FAMILY', 'PATRIMONY'];

/** Essai gratuit Découverte (jours) */
const SOLO_TRIAL_DAYS = 30;

function normalizeBillingInterval(planId, billingInterval = 'yearly') {
  return billingInterval;
}

const PLANS = {
  SOLO: {
    id: 'SOLO',
    name: 'Découverte',
    billingPeriod: 'free',
    priceUsd: 0,
    priceLabel: 'Gratuit',
    durationDays: null,
    trialDays: SOLO_TRIAL_DAYS,
    maxTrees: 1,
    maxPersonsPerTree: 10,
    maxCollaborators: 2,
    maxFichesTotal: 0,
    maxPhotosTotal: Infinity,
    canPublicMatching: false,
    canExport: false,
    canImport: false,
    canVersioning: false,
    features: [
      '1 arbre, jusqu\'à 10 personnes',
      'Photos de profil incluses',
      'Pas de fiches (documents)',
      'Partage privé (2 collaborateurs)',
      'Pas de correspondances avec les arbres publics',
    ],
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Famille',
    billingPeriod: 'yearly',
    priceUsd: 24,
    priceMonthlyUsd: 2.5,
    priceLabel: '15 600 FCFA ($24) / an',
    priceLabelMonthly: '1 625 FCFA ($2,50) / mois',
    durationDays: 365,
    durationDaysMonthly: 30,
    maxTrees: 3,
    maxPersonsPerTree: 50,
    maxFichesTotal: 100,
    maxPhotosTotal: Infinity,
    maxCollaborators: 10,
    canPublicMatching: false,
    canExport: true,
    canImport: false,
    canVersioning: false,
    features: [
      '3 arbres, 50 personnes max par arbre',
      '100 fiches (documents) au total',
      'Organigrammes & lexique personnalisé',
      '10 collaborateurs par arbre',
      'Export GEDCOM & PDF',
    ],
  },
  PATRIMONY: {
    id: 'PATRIMONY',
    name: 'Patrimoine',
    billingPeriod: 'yearly',
    priceUsd: 42,
    priceMonthlyUsd: 4.5,
    priceLabel: '27 300 FCFA ($42) / an',
    priceLabelMonthly: '2 925 FCFA ($4,50) / mois',
    durationDays: 365,
    durationDaysMonthly: 30,
    maxTrees: 5,
    maxPersonsPerTree: 200,
    maxCollaborators: 30,
    maxFichesTotal: Infinity,
    maxPhotosTotal: Infinity,
    canPublicMatching: true,
    canExport: true,
    canImport: true,
    canVersioning: true,
    features: [
      '5 arbres, 200 personnes max par arbre',
      '30 collaborateurs par arbre',
      'Grands organigrammes & arrière-plans',
      'Photos & fiches (documents) illimités',
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
  const interval = normalizeBillingInterval(planId, billingInterval);
  const plan = PLANS[planId] || PLANS.SOLO;
  if (MONTHLY_BILLING_PLANS.includes(planId) && interval === 'monthly' && plan.priceMonthlyUsd != null) {
    return plan.priceMonthlyUsd;
  }
  return plan.priceUsd;
}

/** Prix FCFA affichage (forfait + intervalle) */
function getPlanPriceXof(planId, billingInterval = 'yearly') {
  const interval = normalizeBillingInterval(planId, billingInterval);
  if (planId === 'FAMILY' && interval === 'monthly') {
    return PRICE_XOF.FAMILY_MONTHLY;
  }
  if (planId === 'PATRIMONY' && interval === 'monthly') {
    return PRICE_XOF.PATRIMONY_MONTHLY;
  }
  return PRICE_XOF[planId] ?? Math.round(getPlanPrice(planId, interval) * FX_USD_XOF);
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
  const interval = normalizeBillingInterval(planId, billingInterval);
  const plan = PLANS[planId] || PLANS.SOLO;
  if (MONTHLY_BILLING_PLANS.includes(planId) && interval === 'monthly') {
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
  normalizeBillingInterval,
  MONTHLY_BILLING_PLANS,
  SOLO_TRIAL_DAYS,
  isFreePlan,
  isPaidPlan,
  computeDiscountedAmount,
  toPaystackAmount,
  serializePlan,
  listPlansForApi,
};
