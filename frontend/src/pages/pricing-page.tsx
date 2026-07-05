import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Check, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { PLANS, formatPrice, getPlanPrice } from "@/lib/plans"
import type { BillingInterval } from "@/lib/billing-api"
import type { PlanId } from "@/types"
import { initializeCheckout, previewCheckout } from "@/lib/billing-api"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const { t, i18n } = useTranslation("billing")
  const { isAuthenticated, user } = useAuthStore()
  const [promoCode, setPromoCode] = useState("")
  const [previews, setPreviews] = useState<Record<string, number>>({})
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [patrimonyInterval, setPatrimonyInterval] = useState<BillingInterval>("yearly")

  const planActive = user?.planActive ?? false
  const locale = i18n.language

  const previewKey = (planId: PlanId, interval: BillingInterval = "yearly") =>
    planId === "PATRIMONY" ? `${planId}:${interval}` : planId

  useEffect(() => {
    PLANS.forEach((plan) => {
      const intervals: BillingInterval[] =
        plan.id === "PATRIMONY" ? ["yearly", "monthly"] : ["yearly"]
      intervals.forEach((interval) => {
        previewCheckout(plan.id, promoCode || undefined, interval)
          .then((p) => setPreviews((prev) => ({ ...prev, [previewKey(plan.id, interval)]: p.finalAmount })))
          .catch(() =>
            setPreviews((prev) => ({
              ...prev,
              [previewKey(plan.id, interval)]: getPlanPrice(plan, interval),
            }))
          )
      })
    })
  }, [promoCode])

  const handleCheckout = async (planId: PlanId, interval: BillingInterval = "yearly") => {
    if (!isAuthenticated) return
    setLoadingPlan(previewKey(planId, interval))
    try {
      const { authorizationUrl } = await initializeCheckout(planId, promoCode || undefined, interval)
      window.location.href = authorizationUrl
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("pricing.checkoutError"))
      setLoadingPlan(null)
    }
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3">{t("pricing.badge")}</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("pricing.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
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
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="size-4" />
          {t("pricing.securePayment")}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isPatrimony = plan.id === "PATRIMONY"
            const interval = isPatrimony ? patrimonyInterval : "yearly"
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
                  <CardDescription className="text-2xl font-semibold text-foreground">
                    {formatPrice(finalAmount, locale)}
                    {finalAmount < basePrice && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                        {formatPrice(basePrice, locale)}
                      </span>
                    )}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">
                    {isPatrimony
                      ? interval === "monthly"
                        ? t(`plans.${plan.id}.priceLabelMonthly`)
                        : t(`plans.${plan.id}.priceLabel`)
                      : t(`plans.${plan.id}.priceLabel`)}
                  </p>
                  {isPatrimony && (
                    <div className="mt-2 flex gap-1 rounded-lg border p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={interval === "yearly" ? "default" : "ghost"}
                        className="h-7 flex-1 text-xs"
                        onClick={() => setPatrimonyInterval("yearly")}
                      >
                        {t("pricing.yearly")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={interval === "monthly" ? "default" : "ghost"}
                        className="h-7 flex-1 text-xs"
                        onClick={() => setPatrimonyInterval("monthly")}
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
                          : isPatrimony && interval === "monthly"
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
