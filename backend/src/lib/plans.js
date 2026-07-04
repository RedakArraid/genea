const PLANS = {
  SOLO: {
    id: 'SOLO',
    name: 'Solo',
    price: 0,
    priceLabel: '0 € / pour toujours',
    maxTrees: 1,
    maxPersonsPerTree: 30,
    maxCollaborators: 5,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    features: [
      '1 arbre, jusqu\'à 30 personnes',
      'Vue canvas complète et interactive',
      'Partage en privé par invitation',
    ],
  },
  FAMILY: {
    id: 'FAMILY',
    name: 'Famille',
    price: 5,
    priceLabel: '5 € / mois — facturé annuellement',
    maxTrees: Infinity,
    maxPersonsPerTree: 1000,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    features: [
      'Arbres illimités, jusqu\'à 1000 personnes',
      'Correspondances publiques activées',
      'Invitations co-éditeur illimitées',
      'Export GEDCOM & PDF',
    ],
  },
  PATRIMONY: {
    id: 'PATRIMONY',
    name: 'Patrimoine',
    price: 12,
    priceLabel: '12 € / mois',
    maxTrees: Infinity,
    maxPersonsPerTree: Infinity,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: true,
    features: [
      'Personnes illimitées',
      'Importations multi-formats (Heredis, etc.)',
      'Historique et versioning complet',
      'Support prioritaire',
    ],
  },
};

function getPlanLimits(plan) {
  return PLANS[plan] || PLANS.SOLO;
}

module.exports = { PLANS, getPlanLimits };
