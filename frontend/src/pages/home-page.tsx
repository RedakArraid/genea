import { Link } from "react-router-dom"
import { ArrowRight, Users, Share2, Search, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PricingSection } from "@/components/pricing-section"

const featureDefs = [
  { key: "trees", icon: Users },
  { key: "search", icon: Search },
  { key: "share", icon: Share2 },
  { key: "privacy", icon: Shield },
] as const

export default function HomePage() {
  const { t } = useTranslation(["marketing", "common"])
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">{t("hero.badge")}</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className={cn(buttonVariants({ size: "lg" }))}>
              {isAuthenticated ? t("hero.ctaAuth") : t("hero.ctaGuest")}
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link to="/demo" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              {t("hero.ctaDemo")}
            </Link>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          {featureDefs.map((feature) => (
            <Card key={feature.key}>
              <CardHeader>
                <feature.icon className="mb-2 size-8 text-primary" />
                <CardTitle>{t(`features.${feature.key}.title`)}</CardTitle>
                <CardDescription>{t(`features.${feature.key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {t("common:footer")}
      </footer>
    </>
  )
}
