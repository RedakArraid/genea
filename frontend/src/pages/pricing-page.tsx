import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { PLANS, getPlanIntervals, getPlanPrice, isFreePlan, planPreviewKey } from "@/lib/plans"
import type { BillingInterval } from "@/lib/billing-api"
import type { PlanId } from "@/types"
import { initializeCheckout, previewCheckout } from "@/lib/billing-api"
import { getApiErrorPayload, translateApiError } from "@/lib/translate-error"
import { PricingPlanCards } from "@/components/pricing-plan-cards"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PricingPage() {
  const { t } = useTranslation("billing")
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [promoCode, setPromoCode] = useState("")
  const [promoError, setPromoError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, number>>({})
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const basePreviews = useMemo(() => {
    const next: Record<string, number> = {}
    PLANS.forEach((plan) => {
      getPlanIntervals(plan.id).forEach((interval) => {
        next[planPreviewKey(plan.id, interval)] = getPlanPrice(plan, interval)
      })
    })
    return next
  }, [])

  useEffect(() => {
    const trimmedPromo = promoCode.trim()
    if (!trimmedPromo) {
      setPromoError(null)
      setPreviews(basePreviews)
      return
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        const requests = PLANS.flatMap((plan) =>
          getPlanIntervals(plan.id).map((interval) => ({ plan, interval })),
        )

        const results = await Promise.all(
          requests.map(async ({ plan, interval }) => {
            try {
              const preview = await previewCheckout(plan.id, trimmedPromo, interval)
              return {
                key: planPreviewKey(plan.id, interval),
                amount: preview.finalAmount,
                promoError: preview.promoError ?? null,
              }
            } catch {
              return {
                key: planPreviewKey(plan.id, interval),
                amount: getPlanPrice(plan, interval),
                promoError: null,
              }
            }
          }),
        )

        setPreviews((prev) => {
          const next = { ...prev }
          results.forEach(({ key, amount }) => {
            next[key] = amount
          })
          return next
        })
        setPromoError(results.find((result) => result.promoError)?.promoError ?? null)
      })()
    }, 400)

    return () => window.clearTimeout(timer)
  }, [promoCode, basePreviews])

  const handleCheckout = async (planId: PlanId, interval: BillingInterval = "monthly") => {
    if (!isAuthenticated) return
    if (isFreePlan(planId)) {
      navigate("/dashboard")
      return
    }
    if (!user?.email?.trim()) {
      toast.error(translateApiError({ code: "EMAIL_REQUIRED_FOR_PAYMENT" }))
      navigate("/profile")
      return
    }
    if (promoError) {
      toast.error(promoError)
      return
    }
    setLoadingPlan(planPreviewKey(planId, interval))
    try {
      const trimmedPromo = promoCode.trim()
      const { authorizationUrl } = await initializeCheckout(
        planId,
        trimmedPromo || undefined,
        interval,
      )
      window.location.href = authorizationUrl
    } catch (err: unknown) {
      toast.error(translateApiError(getApiErrorPayload(err), "billing:pricing.checkoutError"))
      setLoadingPlan(null)
    }
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("pricing.title")}
          </h1>
          <div className="mx-auto mt-6 flex max-w-sm items-end gap-2">
            <div className="flex-1 text-left">
              <Label htmlFor="promo">{t("pricing.promoCode")}</Label>
              <Input
                id="promo"
                placeholder="GENEA2026"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-muted-foreground">{t("pricing.promoHint")}</p>
              {promoError && <p className="text-xs text-destructive">{promoError}</p>}
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="size-4" />
          {t("pricing.securePayment")}
        </div>

        <PricingPlanCards
          previews={previews}
          loadingPlan={loadingPlan}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  )
}
