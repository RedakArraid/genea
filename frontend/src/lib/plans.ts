export type PlanId = "SOLO" | "FAMILY" | "PATRIMONY"

export interface PlanDefinition {
  id: PlanId
  name: string
  priceXof: number
  priceLabel: string
  billingPeriod: "once" | "yearly"
  durationDays?: number
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

/** Tarifs CI — synchronisés avec backend/src/lib/plans.js */
export const PLANS: PlanDefinition[] = [
  {
    id: "SOLO",
    name: "Essai",
    priceXof: 2500,
    priceLabel: "2 500 FCFA — paiement unique",
    billingPeriod: "once",
    durationDays: 90,
    maxTrees: 1,
    maxPersonsPerTree: 25,
    maxCollaborators: 2,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    cta: "Tester GeneaIA",
    features: [
      "1 arbre, jusqu'à 25 fiches",
      "90 jours pour découvrir l'outil",
      "Partage privé (2 collaborateurs)",
      "Orange Money, MTN, Wave, carte",
    ],
  },
  {
    id: "FAMILY",
    name: "Famille",
    priceXof: 15000,
    priceLabel: "15 000 FCFA / an",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: Infinity,
    maxPersonsPerTree: 500,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    featured: true,
    cta: "Choisir Famille",
    features: [
      "Arbres illimités, 500 fiches par arbre",
      "Collaborateurs illimités",
      "Correspondances publiques",
      "Export GEDCOM & PDF",
    ],
  },
  {
    id: "PATRIMONY",
    name: "Patrimoine",
    priceXof: 35000,
    priceLabel: "35 000 FCFA / an",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: Infinity,
    maxPersonsPerTree: Infinity,
    maxCollaborators: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: true,
    cta: "Choisir Patrimoine",
    features: [
      "Personnes et arbres illimités",
      "Versioning et historique complet",
      "Import multi-formats",
      "Support prioritaire",
    ],
  },
]

export function getPlanById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

export function formatXof(amount: number) {
  return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount)
}
