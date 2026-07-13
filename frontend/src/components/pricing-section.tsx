import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PricingPlanCards } from "@/components/pricing-plan-cards"
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
        visible && "animate-in fade-in slide-in-from-bottom-3 duration-700",
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("pricing.sectionTitle")}</h2>
        </div>

        <PricingPlanCards />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/pricing" className="underline underline-offset-4 hover:text-foreground">
            {t("pricing.seeAllPlans")}
          </Link>
        </p>
      </div>
    </section>
  )
}
