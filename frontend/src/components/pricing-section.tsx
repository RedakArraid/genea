import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PricingSection() {
  return (
    <section id="prix" className="border-t bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-3">Tarifs</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Gratuit pour commencer.</h2>
          <p className="mt-2 text-muted-foreground">
            Pas de carte bancaire requise. Vos données vous appartiennent, exportables à tout moment.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
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
                  {plan.name}
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
                <Link
                  to="/register"
                  className={cn(buttonVariants({ variant: plan.featured ? "default" : "outline" }), "w-full")}
                >
                  {plan.cta}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/pricing" className="underline underline-offset-4 hover:text-foreground">
            Voir tous les détails des forfaits →
          </Link>
        </p>
      </div>
    </section>
  )
}
