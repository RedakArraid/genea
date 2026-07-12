import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { PLANS, getPlanById, getPlanIntervals, getPlanPrice, isFreePlan, planPreviewKey } from "@/lib/plans"
import { PlanPriceBlock } from "@/components/pricing-price-block"
import type { BillingInterval } from "@/lib/billing-api"
import type { PlanId } from "@/types"
import { initializeCheckout, previewCheckout } from "@/lib/billing-api"
import { getApiErrorPayload, translateApiError } from "@/lib/translate-error"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const { t } = useTranslation("billing")
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [promoCode, setPromoCode] = useState("")
  const [promoError, setPromoError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, number>>({})
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [familyInterval, setFamilyInterval] = useState<BillingInterval>("yearly")
  const [patrimonyInterval, setPatrimonyInterval] = useState<BillingInterval>("yearly")

  const planActive = user?.planActive ?? false

  const resolveInterval = (planId: PlanId): BillingInterval => {
    if (planId === "FAMILY") return familyInterval
    if (planId === "PATRIMONY") return patrimonyInterval
    return "yearly"
  }

  const previewKey = planPreviewKey

  const basePreviews = useMemo(() => {
    const next: Record<string, number> = {}
    PLANS.forEach((plan) => {
      getPlanIntervals(plan.id).forEach((interval) => {
        next[previewKey(plan.id, interval)] = getPlanPrice(plan, interval)
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
          getPlanIntervals(plan.id).map((interval) => ({ plan, interval }))
        )

        const results = await Promise.all(
          requests.map(async ({ plan, interval }) => {
            try {
              const preview = await previewCheckout(plan.id, trimmedPromo, interval)
              return {
                key: previewKey(plan.id, interval),
                amount: preview.finalAmount,
                promoError: preview.promoError ?? null,
              }
            } catch {
              return {
                key: previewKey(plan.id, interval),
                amount: getPlanPrice(plan, interval),
                promoError: null,
              }
            }
          })
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

  const handleCheckout = async (planId: PlanId, interval: BillingInterval = "yearly") => {
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
    setLoadingPlan(previewKey(planId, interval))
    try {
      const trimmedPromo = promoCode.trim()
      const { authorizationUrl } = await initializeCheckout(
        planId,
        trimmedPromo || undefined,
        interval
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

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isFree = isFreePlan(plan.id)
            const hasIntervals = getPlanIntervals(plan.id).length > 1
            const interval = resolveInterval(plan.id)
            const isCurrent = isAuthenticated && user?.plan === plan.id && planActive
            const basePrice = getPlanPrice(plan, interval)
            const finalAmount = previews[previewKey(plan.id, interval)] ?? basePrice
            const features = t(`plans.${plan.id}.features`, { returnObjects: true }) as string[]

            return (
              <Card
                key={plan.id}
                className={cn(
                  "flex flex-col",
                  plan.featured && "border-primary shadow-md ring-1 ring-primary/20",
                  isCurrent && "ring-2 ring-primary"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.featured && <span className="text-primary">★</span>}
                    {t(`plans.${plan.id}.name`)}
                    {isCurrent && <Badge variant="secondary" className="ml-auto text-xs">{t("pricing.current")}</Badge>}
                  </CardTitle>
                  <PlanPriceBlock
                    planId={plan.id}
                    interval={interval}
                    amountUsd={finalAmount}
                    strikethroughUsd={!isFree && finalAmount < basePrice ? basePrice : undefined}
                  />
                  {hasIntervals && (
                    <div className="mt-2 flex gap-1 rounded-lg border p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={interval === "yearly" ? "default" : "ghost"}
                        className="h-7 flex-1 text-xs"
                        onClick={() => {
                          if (plan.id === "FAMILY") setFamilyInterval("yearly")
                          if (plan.id === "PATRIMONY") setPatrimonyInterval("yearly")
                        }}
                      >
                        {t("pricing.yearly")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={interval === "monthly" ? "default" : "ghost"}
                        className="h-7 flex-1 text-xs"
                        onClick={() => {
                          if (plan.id === "FAMILY") setFamilyInterval("monthly")
                          if (plan.id === "PATRIMONY") setPatrimonyInterval("monthly")
                        }}
                      >
                        {t("pricing.monthly")}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="flex flex-col gap-2 text-sm">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {isAuthenticated ? (
                    <Button
                      className="w-full"
                      variant={isCurrent ? "secondary" : plan.featured ? "default" : "outline"}
                      disabled={isCurrent || loadingPlan === previewKey(plan.id, interval)}
                      onClick={() => handleCheckout(plan.id, interval)}
                    >
                      {loadingPlan === previewKey(plan.id, interval)
                        ? t("pricing.redirecting")
                        : isCurrent
                          ? t("pricing.currentPlan")
                          : interval === "monthly" && getPlanById(plan.id).ctaMonthly
                            ? t(`plans.${plan.id}.ctaMonthly`)
                            : t(`plans.${plan.id}.cta`)}
                    </Button>
                  ) : (
                    <Link
                      to="/register"
                      className={cn(buttonVariants({ variant: plan.featured ? "default" : "outline" }), "w-full")}
                    >
                      {t("pricing.createAccount")}
                    </Link>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
