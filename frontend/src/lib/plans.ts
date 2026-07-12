export type PlanId = "SOLO" | "FAMILY" | "PATRIMONY"
export type BillingInterval = "yearly" | "monthly"

export interface PlanDefinition {
  id: PlanId
  name: string
  priceUsd: number
  priceMonthlyUsd?: number
  priceLabel: string
  billingPeriod: "free" | "once" | "yearly" | "monthly"
  durationDays?: number | null
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
  SOLO: 0,
  FAMILY: 15600,
  PATRIMONY: 27300,
  PATRIMONY_MONTHLY: 2925,
}

export const PLANS: PlanDefinition[] = [
  {
    id: "SOLO",
    name: "Découverte",
    priceUsd: 0,
    priceLabel: "Gratuit",
    billingPeriod: "free",
    durationDays: null,
    maxTrees: 1,
    maxPersonsPerTree: 60,
    maxCollaborators: 2,
    maxMediaAssets: 15,
    canPublicMatching: false,
    canExport: false,
    canVersioning: false,
    cta: "Commencer gratuitement",
    features: [
      "1 tree (genealogy or organization)",
      "Up to 60 profiles",
      "15 photos & documents",
      "Private sharing (2 collaborators)",
    ],
  },
  {
    id: "FAMILY",
    name: "Famille",
    priceUsd: 24,
    priceLabel: "$24 / year",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: 4,
    maxPersonsPerTree: 350,
    maxCollaborators: Infinity,
    maxMediaAssets: 80,
    canPublicMatching: true,
    canExport: true,
    canVersioning: false,
    featured: true,
    cta: "Choisir Famille",
    features: [
      "4 trees, 350 profiles per tree",
      "Org charts & custom lexicon",
      "80 photos & documents included",
      "Unlimited collaborators",
      "GEDCOM & PDF export",
    ],
  },
  {
    id: "PATRIMONY",
    name: "Patrimoine",
    priceUsd: 42,
    priceMonthlyUsd: 4.5,
    priceLabel: "$42 / year",
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
      "Unlimited people and trees",
      "Large org charts & backgrounds",
      "Unlimited photos & documents",
      "GEDCOM & PDF import/export",
      "Edit history",
      "Priority support",
    ],
  },
]

export function getPlanById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

export function isFreePlan(planId: PlanId) {
  return getPlanById(planId).priceUsd === 0
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
  if (plan.priceUsd === 0) return plan.priceLabel
  const usd = getPlanPrice(plan, interval)
  const xof = getPlanPriceXof(planId, interval)
  return `${formatXof(xof)} (${formatPrice(usd)})`
}

export function formatDualPriceFromUsd(amountUsd: number) {
  if (amountUsd === 0) return "Gratuit"
  const xof = Math.round(amountUsd * FX_USD_XOF)
  return `${formatXof(xof)} (${formatPrice(amountUsd)})`
}
