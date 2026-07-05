/**
 * Forfaits GeneaIA — tarification internationale (USD)
 *
 * Essai : $5 — paiement unique
 * Famille : $30/an
 * Patrimoine : $50/an ou $5/mois
 */

const CURRENCY = 'USD';

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
      'Correspondances publiques',
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
      'Versioning et historique complet',
      'Import multi-formats',
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

/** @deprecated alias */
function getPlanPriceXof(planId, billingInterval) {
  return getPlanPrice(planId, billingInterval);
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

module.exports = {
  PLANS,
  CURRENCY,
  getPlanLimits,
  getPlanPrice,
  getPlanPriceXof,
  getPlanDurationDays,
  isPaidPlan,
  computeDiscountedAmount,
  toPaystackAmount,
};
