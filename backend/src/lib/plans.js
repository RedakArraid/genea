/**
 * Forfaits GeneaIA — Côte d'Ivoire (XOF)
 *
 * Pas de freemium : l'Essai est un petit montant pour tester (1 arbre, 25 fiches).
 * Famille et Patrimoine sont facturés à l'année.
 */

const CURRENCY = 'XOF';

const PLANS = {
  SOLO: {
    id: 'SOLO',
    name: 'Essai',
    billingPeriod: 'once',
    priceXof: 2500,
    priceLabel: '2 500 FCFA — paiement unique',
    durationDays: 90,
    maxTrees: 1,
    maxPersonsPerTree: 25,
    maxCollaborators: 2,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    features: [
      '1 arbre, jusqu\'à 25 fiches',
      '90 jours pour tester GeneaIA',
      'Partage privé (2 collaborateurs)',
      'Mobile Money, Orange Money, Wave, carte',
    ],
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Famille',
    billingPeriod: 'yearly',
    priceXof: 15000,
    priceLabel: '15 000 FCFA / an',
    durationDays: 365,
    maxTrees: Infinity,
    maxPersonsPerTree: 500,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    features: [
      'Arbres illimités, 500 fiches par arbre',
      'Collaborateurs illimités',
      'Correspondances publiques',
      'Export GEDCOM & PDF',
    ],
  },
  PATRIMONY: {
    id: 'PATRIMONY',
    name: 'Patrimoine',
    billingPeriod: 'yearly',
    priceXof: 35000,
    priceLabel: '35 000 FCFA / an',
    durationDays: 365,
    maxTrees: Infinity,
    maxPersonsPerTree: Infinity,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: true,
    features: [
      'Personnes et arbres illimités',
      'Versioning et historique complet',
      'Import multi-formats',
      'Support prioritaire',
    ],
  },
};

function getPlanLimits(plan) {
  return PLANS[plan] || PLANS.SOLO;
}

function getPlanPriceXof(planId) {
  return PLANS[planId]?.priceXof ?? PLANS.SOLO.priceXof;
}

function isPaidPlan(planId) {
  return !!PLANS[planId];
}

function computeDiscountedAmount(baseXof, promo) {
  if (!promo) return baseXof;
  if (promo.discountType === 'PERCENT') {
    return Math.max(0, Math.round(baseXof * (1 - promo.discountValue / 100)));
  }
  return Math.max(0, baseXof - promo.discountValue);
}

/** Paystack exige amount × 100 même pour XOF */
function toPaystackAmount(xof) {
  return Math.round(xof) * 100;
}

module.exports = {
  PLANS,
  CURRENCY,
  getPlanLimits,
  getPlanPriceXof,
  isPaidPlan,
  computeDiscountedAmount,
  toPaystackAmount,
};
