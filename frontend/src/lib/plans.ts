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
  maxFichesTotal: number
  maxPhotosTotal: number
  maxCollaborators: number
  canPublicMatching: boolean
  canExport: boolean
  canImport: boolean
  canVersioning: boolean
  features: string[]
  featured?: boolean
  cta: string
  ctaMonthly?: string
}

/** Tarifs internationaux - synchronisés avec backend/src/lib/plans.js */
export const FX_USD_XOF = 650

export const PRICE_XOF: Record<PlanId, number> & { FAMILY_MONTHLY: number; PATRIMONY_MONTHLY: number } = {
  SOLO: 0,
  FAMILY: 15600,
  FAMILY_MONTHLY: 1625,
  PATRIMONY: 27300,
  PATRIMONY_MONTHLY: 2925,
}

const MONTHLY_BILLING_PLANS: PlanId[] = ["FAMILY", "PATRIMONY"]

export const PLANS: PlanDefinition[] = [
  {
    id: "SOLO",
    name: "Découverte",
    priceUsd: 0,
    priceLabel: "Gratuit",
    billingPeriod: "free",
    durationDays: null,
    maxTrees: 1,
    maxPersonsPerTree: 10,
    maxCollaborators: 2,
    maxFichesTotal: 0,
    maxPhotosTotal: Infinity,
    canPublicMatching: false,
    canExport: false,
    canImport: false,
    canVersioning: false,
    cta: "Commencer gratuitement",
    features: [
      "1 arbre, jusqu'à 10 personnes",
      "Photos de profil incluses",
      "Pas de fiches (documents)",
      "Partage privé (2 collaborateurs)",
      "Pas de correspondances avec les arbres publics",
    ],
  },
  {
    id: "FAMILY",
    name: "Famille",
    priceUsd: 24,
    priceMonthlyUsd: 2.5,
    priceLabel: "15 600 FCFA ($24) / an",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: 3,
    maxPersonsPerTree: 50,
    maxFichesTotal: 100,
    maxPhotosTotal: Infinity,
    maxCollaborators: 10,
    canPublicMatching: false,
    canExport: true,
    canImport: false,
    canVersioning: false,
    featured: true,
    cta: "Choisir annuel",
    ctaMonthly: "Choisir mensuel",
    features: [
      "3 arbres, 50 personnes max par arbre",
      "100 fiches (documents) au total",
      "Organigrammes & lexique personnalisé",
      "10 collaborateurs par arbre",
      "Export GEDCOM & PDF",
    ],
  },
  {
    id: "PATRIMONY",
    name: "Patrimoine",
    priceUsd: 42,
    priceMonthlyUsd: 4.5,
    priceLabel: "27 300 FCFA ($42) / an",
    billingPeriod: "yearly",
    durationDays: 365,
    maxTrees: 5,
    maxPersonsPerTree: 200,
    maxCollaborators: 30,
    maxFichesTotal: Infinity,
    maxPhotosTotal: Infinity,
    canPublicMatching: true,
    canExport: true,
    canImport: true,
    canVersioning: true,
    cta: "Choisir annuel",
    ctaMonthly: "Choisir mensuel",
    features: [
      "5 arbres, 200 personnes max par arbre",
      "30 collaborateurs par arbre",
      "Grands organigrammes & arrière-plans",
      "Photos & fiches (documents) illimités",
      "Export & import GEDCOM, PDF",
      "Historique des modifications",
      "Support prioritaire",
    ],
  },
]

export function getPlanById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

export function isFreePlan(planId: PlanId) {
  return getPlanById(planId).priceUsd === 0
}

/** Compte autorisé à modifier (essai actif ou forfait payant valide). */
export function isPlanWriteAllowed(
  user: { plan?: string; planActive?: boolean; planExpiresAt?: string | null; createdAt?: string } | null | undefined,
) {
  if (!user?.planActive) return false
  if (user.planExpiresAt) {
    return new Date(user.planExpiresAt) > new Date()
  }
  if (user.plan === "SOLO" && user.createdAt) {
    const trialEnd = new Date(user.createdAt)
    trialEnd.setDate(trialEnd.getDate() + 30)
    return trialEnd > new Date()
  }
  return true
}

export function normalizeBillingInterval(_planId: PlanId, interval: BillingInterval = "yearly"): BillingInterval {
  return interval
}

export function getPlanIntervals(planId: PlanId): BillingInterval[] {
  if (planId === "PATRIMONY" || planId === "FAMILY") return ["yearly", "monthly"]
  return ["yearly"]
}

export function planPreviewKey(planId: PlanId, interval: BillingInterval) {
  if (getPlanIntervals(planId).length > 1) return `${planId}:${interval}`
  return planId
}

export function getPlanPrice(plan: PlanDefinition, interval: BillingInterval = "yearly") {
  const resolved = normalizeBillingInterval(plan.id, interval)
  if (MONTHLY_BILLING_PLANS.includes(plan.id) && resolved === "monthly" && plan.priceMonthlyUsd != null) {
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
  const resolved = normalizeBillingInterval(planId, interval)
  if (planId === "FAMILY" && resolved === "monthly") return PRICE_XOF.FAMILY_MONTHLY
  if (planId === "PATRIMONY" && resolved === "monthly") return PRICE_XOF.PATRIMONY_MONTHLY
  return PRICE_XOF[planId]
}

export function formatAmountDual(amountUsd: number, amountXof?: number) {
  const xof = amountXof ?? Math.round(amountUsd * FX_USD_XOF)
  return `${formatXof(xof)} (${formatPrice(amountUsd)})`
}

export function formatDualPrice(planId: PlanId, interval: BillingInterval = "yearly") {
  const plan = getPlanById(planId)
  if (isFreePlan(planId)) return formatAmountDual(0, 0)
  const resolved = normalizeBillingInterval(planId, interval)
  const usd = getPlanPrice(plan, resolved)
  const xof = getPlanPriceXof(planId, resolved)
  return formatAmountDual(usd, xof)
}

export function formatDualPriceFromUsd(amountUsd: number) {
  return formatAmountDual(amountUsd)
}

export function isMonthlyPlanDisplay(planId: PlanId, interval: BillingInterval = "yearly") {
  return normalizeBillingInterval(planId, interval) === "monthly"
}
