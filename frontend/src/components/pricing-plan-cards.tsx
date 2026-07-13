import { useState } from "react"
import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import {
  PLANS,
  getPlanById,
  getPlanIntervals,
  getPlanPrice,
  getAnnualSavingsPercent,
  isFreePlan,
  planPreviewKey,
  type PlanId,
} from "@/lib/plans"
import type { BillingInterval } from "@/lib/billing-api"
import { PlanPriceBlock } from "@/components/pricing-price-block"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PricingPlanCardsProps {
  className?: string
  previews?: Record<string, number>
  loadingPlan?: string | null
  onCheckout?: (planId: PlanId, interval: BillingInterval) => void
}

export function PricingPlanCards({
  className,
  previews,
  loadingPlan,
  onCheckout,
}: PricingPlanCardsProps) {
  const { t } = useTranslation("billing")
  const { isAuthenticated, user } = useAuthStore()
  const [familyInterval, setFamilyInterval] = useState<BillingInterval>("monthly")
  const [patrimonyInterval, setPatrimonyInterval] = useState<BillingInterval>("monthly")
  const planActive = user?.planActive ?? false

  const resolveInterval = (planId: PlanId): BillingInterval => {
    if (planId === "FAMILY") return familyInterval
    if (planId === "PATRIMONY") return patrimonyInterval
    return "yearly"
  }

  return (
    <div className={cn("grid gap-6 md:grid-cols-3", className)}>
      {PLANS.map((plan) => {
        const isFree = isFreePlan(plan.id)
        const hasIntervals = getPlanIntervals(plan.id).length > 1
        const interval = resolveInterval(plan.id)
        const isCurrent = isAuthenticated && user?.plan === plan.id && planActive
        const basePrice = getPlanPrice(plan, interval)
        const finalAmount = previews?.[planPreviewKey(plan.id, interval)] ?? basePrice
        const features = t(`plans.${plan.id}.features`, { returnObjects: true }) as string[]
        const annualSavings = getAnnualSavingsPercent(plan.id)

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col",
              plan.featured && "border-primary shadow-md ring-1 ring-primary/20",
              isCurrent && "ring-2 ring-primary",
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.featured && <span className="text-primary">★</span>}
                {t(`plans.${plan.id}.name`)}
                {isCurrent && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {t("pricing.current")}
                  </Badge>
                )}
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
                    {annualSavings != null && (
                      <span className="ml-1 font-semibold text-primary">
                        {t("pricing.yearlySave", { percent: annualSavings })}
                      </span>
                    )}
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
              {onCheckout && isAuthenticated ? (
                <Button
                  className="w-full"
                  variant={isCurrent ? "secondary" : plan.featured ? "default" : "outline"}
                  disabled={isCurrent || loadingPlan === planPreviewKey(plan.id, interval)}
                  onClick={() => onCheckout(plan.id, interval)}
                >
                  {loadingPlan === planPreviewKey(plan.id, interval)
                    ? t("pricing.redirecting")
                    : isCurrent
                      ? t("pricing.currentPlan")
                      : interval === "monthly" && getPlanById(plan.id).ctaMonthly
                        ? t(`plans.${plan.id}.ctaMonthly`)
                        : t(`plans.${plan.id}.cta`)}
                </Button>
              ) : (
                <Link
                  to={isAuthenticated ? "/pricing" : "/register"}
                  className={cn(buttonVariants({ variant: plan.featured ? "default" : "outline" }), "w-full")}
                >
                  {isAuthenticated
                    ? interval === "monthly" && getPlanById(plan.id).ctaMonthly
                      ? t(`plans.${plan.id}.ctaMonthly`)
                      : t(`plans.${plan.id}.cta`)
                    : t("pricing.createAccount")}
                </Link>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
