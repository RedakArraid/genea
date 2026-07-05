import api from "@/lib/api"
import type { PlanId } from "@/types"

export interface BillingConfig {
  currency: string
  country: string
  providers: { paystack: boolean; cinetpay: boolean }
  paystackPublicKey: string | null
}

export interface CheckoutPreview {
  plan: PlanId
  currency: string
  baseAmount: number
  finalAmount: number
  promo: { code: string; discountType: string; discountValue: number } | null
}

export async function fetchBillingConfig(): Promise<BillingConfig> {
  const { data } = await api.get<BillingConfig>("/billing/config")
  return data
}

export async function previewCheckout(plan: PlanId, promoCode?: string): Promise<CheckoutPreview> {
  const { data } = await api.post<CheckoutPreview>("/billing/preview", { plan, promoCode: promoCode || undefined })
  return data
}

export async function initializeCheckout(plan: PlanId, promoCode?: string): Promise<{
  provider: string
  authorizationUrl: string
  reference: string
  amount: number
  currency: string
}> {
  const { data } = await api.post("/billing/initialize", { plan, promoCode: promoCode || undefined })
  return data
}

export async function verifyCheckout(reference: string): Promise<{
  status: string
  plan?: PlanId
  user?: { plan: PlanId; planActive: boolean; planExpiresAt?: string | null }
  message?: string
}> {
  const { data } = await api.get(`/billing/verify/${reference}`)
  return data
}
