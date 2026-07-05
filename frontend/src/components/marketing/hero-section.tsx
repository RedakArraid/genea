import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AnimatedTreeHero } from "@/components/marketing/animated-tree-hero"

export function HeroSection() {
  const { t } = useTranslation("marketing")
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="relative overflow-hidden border-b">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.92_0_0),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit animate-in fade-in slide-in-from-bottom-2 duration-500">
            {t("hero.badge")}
          </Badge>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700 md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {t("hero.title")}
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:100ms]">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms]">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {isAuthenticated ? t("hero.ctaAuth") : t("hero.ctaGuest")}
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link to="/demo" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              {t("hero.ctaDemo")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground animate-in fade-in duration-700 [animation-delay:300ms]">
            <a href="#fonctionnalites" className="underline-offset-4 hover:text-foreground hover:underline">
              {t("hero.anchorFeatures")}
            </a>
            <a href="#prix" className="underline-offset-4 hover:text-foreground hover:underline">
              {t("hero.anchorPricing")}
            </a>
          </div>
        </div>
        <div className="animate-in fade-in zoom-in-95 duration-1000 [animation-delay:150ms] lg:pl-4">
          <AnimatedTreeHero />
        </div>
      </div>
    </section>
  )
}
