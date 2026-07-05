import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Check, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { PLANS, formatXof } from "@/lib/plans"
import type { PlanId } from "@/types"
import { initializeCheckout, previewCheckout } from "@/lib/billing-api"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [promoCode, setPromoCode] = useState("")
  const [previews, setPreviews] = useState<Record<string, number>>({})
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)

  const planActive = user?.planActive ?? false

  useEffect(() => {
    PLANS.forEach((plan) => {
      previewCheckout(plan.id, promoCode || undefined)
        .then((p) => setPreviews((prev) => ({ ...prev, [plan.id]: p.finalAmount })))
        .catch(() => setPreviews((prev) => ({ ...prev, [plan.id]: plan.priceXof })))
    })
  }, [promoCode])

  const handleCheckout = async (planId: PlanId) => {
    if (!isAuthenticated) return
    setLoadingPlan(planId)
    try {
      const { authorizationUrl } = await initializeCheckout(planId, promoCode || undefined)
      window.location.href = authorizationUrl
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Impossible d'initialiser le paiement")
      setLoadingPlan(null)
    }
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3">Côte d'Ivoire · FCFA</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Tarifs adaptés à la réalité locale
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pas de freemium — un petit montant pour tester, un forfait annuel pour aller plus loin.
            Orange Money, MTN, Wave et cartes via Paystack (CinetPay en secours).
          </p>
          <div className="mx-auto mt-6 flex max-w-sm items-end gap-2">
            <div className="flex-1 text-left">
              <Label htmlFor="promo">Code promo</Label>
              <Input
                id="promo"
                placeholder="GENEA2026"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="size-4" />
          Paiement Mobile Money et carte — sécurisé
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = isAuthenticated && user?.plan === plan.id && planActive
            const finalAmount = previews[plan.id] ?? plan.priceXof
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
                    {plan.name}
                    {isCurrent && <Badge variant="secondary" className="ml-auto text-xs">Actuel</Badge>}
                  </CardTitle>
                  <CardDescription className="text-2xl font-semibold text-foreground">
                    {formatXof(finalAmount)}
                    {finalAmount < plan.priceXof && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                        {formatXof(plan.priceXof)}
                      </span>
                    )}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">{plan.priceLabel}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="flex flex-col gap-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isAuthenticated ? (
                    <Button
                      className="w-full"
                      variant={isCurrent ? "secondary" : plan.featured ? "default" : "outline"}
                      disabled={isCurrent || loadingPlan === plan.id}
                      onClick={() => handleCheckout(plan.id)}
                    >
                      {loadingPlan === plan.id
                        ? "Redirection…"
                        : isCurrent
                          ? "Forfait actuel"
                          : plan.cta}
                    </Button>
                  ) : (
                    <Link
                      to="/register"
                      className={cn(buttonVariants({ variant: plan.featured ? "default" : "outline" }), "w-full")}
                    >
                      Créer un compte
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
