import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { PLANS } from "@/lib/plans"
import type { PlanId } from "@/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const { isAuthenticated, user, upgradePlan } = useAuthStore()

  const handlePlan = async (planId: PlanId) => {
    if (!isAuthenticated) return
    if (planId === user?.plan) return
    const result = await upgradePlan(planId)
    if (result.success) toast.success(result.message)
    else toast.error(result.message)
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3">Tarifs</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Gratuit pour commencer.</h1>
          <p className="mt-2 text-muted-foreground">
            Pas de carte bancaire requise. Choisissez un forfait quand vous êtes prêt à aller plus loin.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = isAuthenticated && user?.plan === plan.id
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
                    {plan.priceLabel}
                  </CardDescription>
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
                      disabled={isCurrent}
                      onClick={() => handlePlan(plan.id)}
                    >
                      {isCurrent ? "Forfait actuel" : plan.cta}
                    </Button>
                  ) : (
                    <Link
                      to="/register"
                      className={cn(buttonVariants({ variant: plan.featured ? "default" : "outline" }), "w-full")}
                    >
                      {plan.cta}
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
