import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useReveal } from "@/hooks/use-reveal"

export function FinalCtaSection() {
  const { t } = useTranslation("marketing")
  const { isAuthenticated } = useAuthStore()
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      className={cn(
        "bg-primary py-16 text-primary-foreground",
        visible && "animate-in fade-in duration-700"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("finalCta.title")}</h2>
        <p className="max-w-xl text-primary-foreground/80">{t("finalCta.subtitle")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            )}
          >
            {isAuthenticated ? t("hero.ctaAuth") : t("finalCta.ctaPrimary")}
            <ArrowRight className="ml-2 size-4" />
          </Link>
          <Link
            to="/demo"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            )}
          >
            {t("hero.ctaDemo")}
          </Link>
        </div>
      </div>
    </section>
  )
}
