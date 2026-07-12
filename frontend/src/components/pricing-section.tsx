import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PLANS, getPlanIntervals } from "@/lib/plans"
import { PlanPriceBlock } from "@/components/pricing-price-block"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useReveal } from "@/hooks/use-reveal"

export function PricingSection() {
  const { t } = useTranslation("billing")
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section
      id="prix"
      ref={ref}
      className={cn(
        "scroll-mt-20 border-t bg-muted/20 py-20",
        visible && "animate-in fade-in slide-in-from-bottom-3 duration-700"
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("pricing.sectionTitle")}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const features = t(`plans.${plan.id}.features`, { returnObjects: true }) as string[]
            return (
              <Card
                key={plan.id}
                className={cn(
                  "flex flex-col",
                  plan.featured && "border-primary shadow-md ring-1 ring-primary/20"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.featured && <span className="text-primary">★</span>}
                    {t(`plans.${plan.id}.name`)}
                  </CardTitle>
                  <PlanPriceBlock
                    planId={plan.id}
                    showBothIntervals={getPlanIntervals(plan.id).length > 1}
                  />
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
                <CardFooter>
                  <Link
                    to="/pricing"
                    className={cn(buttonVariants({ variant: plan.featured ? "default" : "outline" }), "w-full")}
                  >
                    {t(`plans.${plan.id}.cta`)}
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/pricing" className="underline underline-offset-4 hover:text-foreground">
            {t("pricing.seeAllPlans")}
          </Link>
        </p>
      </div>
    </section>
  )
}
