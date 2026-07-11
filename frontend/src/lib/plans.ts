export type PlanId = "SOLO" | "FAMILY" | "PATRIMONY"
export type BillingInterval = "yearly" | "monthly"

export interface PlanDefinition {
  id: PlanId
  name: string
  priceUsd: number
  priceMonthlyUsd?: number
  priceLabel: string
  billingPeriod: "once" | "yearly" | "monthly"
  durationDays?: number
  maxTrees: number
  maxPersonsPerTree: number
  maxCollaborators: number
  maxMediaAssets: number
  canPublicMatching: boolean
  canExport: boolean
  canVersioning: boolean
  features: string[]
  featured?: boolean
  cta: string
  ctaMonthly?: string
}

/** Tarifs internationaux — synchronisés avec backend/src/lib/plans.js */
export const FX_USD_XOF = 650

export const PRICE_XOF: Record<PlanId, number> & { PATRIMONY_MONTHLY: number } = {
  SOLO: 3250,
  FAMILY: 19500,
  PATRIMONY: 32500,
  PATRIMONY_MONTHLY: 3250,
}

export const PLANS: PlanDefinition[] = [
  {
    id: "SOLO",
    name: "Essai",
    priceUsd: 5,
    priceLabel: "$5 — one-time",
    billingPeriod: "once",
    durationDays: 90,
    maxTrees: 1,
    maxPersonsPerTree: 25,
    maxCollaborators: 2,
    maxMediaAssets: 10,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    cta: "Try geneamap",
    features: [
      "1 tree, up to 25 profiles",
      "90 days to explore",
      "Private sharing (2 collaborators)",
      "Secure card payment",
    ],
  },
  {
    id: "FAMILY",
    name: "Famille",
    priceUsd: 30,
    priceLabel: "$30 / year",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: 5,
    maxPersonsPerTree: 500,
    maxCollaborators: Infinity,
    maxMediaAssets: 100,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    featured: true,
    cta: "Choisir Famille",
    features: [
      "5 arbres, 500 fiches par arbre",
      "100 photos & documents inclus",
      "Collaborateurs illimités",
      "Arbres publics en lecture seule",
      "Export GEDCOM & PDF",
    ],
  },
  {
    id: "PATRIMONY",
    name: "Patrimoine",
    priceUsd: 50,
    priceMonthlyUsd: 5,
    priceLabel: "$50 / year",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: Infinity,
    maxPersonsPerTree: Infinity,
    maxCollaborators: Infinity,
    maxMediaAssets: Infinity,
    canPublicMatching: true,
    canExport: true,
    canVersioning: true,
    cta: "Choisir annuel",
    ctaMonthly: "Choisir mensuel",
    features: [
      "Personnes et arbres illimités",
      "Photos & documents illimités",
      "Export & import GEDCOM, PDF",
      "Historique des modifications",
      "Arbres publics en lecture seule",
      "Support prioritaire",
    ],
  },
]

export function getPlanById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

export function getPlanPrice(plan: PlanDefinition, interval: BillingInterval = "yearly") {
  if (plan.id === "PATRIMONY" && interval === "monthly" && plan.priceMonthlyUsd != null) {
    return plan.priceMonthlyUsd
  }
  return plan.priceUsd
}

/** Formate un montant en USD (affichage unique, sans conversion) */
export function formatPrice(amountUsd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountUsd)
}

export function formatXof(amountXof: number) {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountXof)
}

export function getPlanPriceXof(planId: PlanId, interval: BillingInterval = "yearly") {
  if (planId === "PATRIMONY" && interval === "monthly") return PRICE_XOF.PATRIMONY_MONTHLY
  return PRICE_XOF[planId]
}

export function formatDualPrice(planId: PlanId, interval: BillingInterval = "yearly") {
  const plan = getPlanById(planId)
  const usd = getPlanPrice(plan, interval)
  const xof = getPlanPriceXof(planId, interval)
  return `${formatXof(xof)} (${formatPrice(usd)})`
}

export function formatDualPriceFromUsd(amountUsd: number) {
  const xof = Math.round(amountUsd * FX_USD_XOF)
  return `${formatXof(xof)} (${formatPrice(amountUsd)})`
}
