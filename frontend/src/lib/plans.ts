export type PlanId = "SOLO" | "FAMILY" | "PATRIMONY"

export interface PlanDefinition {
  id: PlanId
  name: string
  price: number
  priceLabel: string
  maxTrees: number
  maxPersonsPerTree: number
  maxCollaborators: number
  canPublicMatching: boolean
  canExport: boolean
  canVersioning: boolean
  features: string[]
  featured?: boolean
  cta: string
}

export const PLANS: PlanDefinition[] = [
  {
    id: "SOLO",
    name: "Solo",
    price: 0,
    priceLabel: "0 € / pour toujours",
    maxTrees: 1,
    maxPersonsPerTree: 30,
    maxCollaborators: 5,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    cta: "Commencer",
    features: [
      "1 arbre, jusqu'à 30 personnes",
      "Vue canvas complète et interactive",
      "Partage en privé par invitation",
    ],
  },
  {
    id: "FAMILY",
    name: "Famille",
    price: 5,
    priceLabel: "5 € / mois — facturé annuellement",
    maxTrees: Infinity,
    maxPersonsPerTree: 1000,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    featured: true,
    cta: "Essayer 14 jours",
    features: [
      "Arbres illimités, jusqu'à 1000 personnes",
      "Correspondances publiques activées",
      "Invitations co-éditeur illimitées",
      "Export GEDCOM & PDF",
    ],
  },
  {
    id: "PATRIMONY",
    name: "Patrimoine",
    price: 12,
    priceLabel: "12 € / mois",
    maxTrees: Infinity,
    maxPersonsPerTree: Infinity,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: true,
    cta: "Choisir",
    features: [
      "Personnes illimitées",
      "Importations multi-formats (Heredis, etc.)",
      "Historique et versioning complet",
      "Support prioritaire",
    ],
  },
]

export function getPlanById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}
