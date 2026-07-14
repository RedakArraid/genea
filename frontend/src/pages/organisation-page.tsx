import { Link } from "react-router-dom"
import { ArrowRight, Building2, Check, Share2, FileDown, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { AnimatedOrgHero } from "@/components/marketing/animated-org-hero"
import { PricingSection } from "@/components/pricing-section"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ORG_CREATE_PATH = "/dashboard?create=organization"
const ORG_REGISTER_PATH = `/register?redirect=${encodeURIComponent(ORG_CREATE_PATH)}`

export default function OrganisationPage() {
  const { t } = useTranslation("marketing")
  const { isAuthenticated } = useAuthStore()
  const createHref = isAuthenticated ? ORG_CREATE_PATH : ORG_REGISTER_PATH

  const features = [
    { icon: Building2, titleKey: "organisation.features.hierarchy.title", descKey: "organisation.features.hierarchy.description" },
    { icon: Users, titleKey: "organisation.features.collab.title", descKey: "organisation.features.collab.description" },
    { icon: Share2, titleKey: "organisation.features.share.title", descKey: "organisation.features.share.description" },
    { icon: FileDown, titleKey: "organisation.features.export.title", descKey: "organisation.features.export.description" },
  ] as const

  const bullets = t("organisation.bullets", { returnObjects: true }) as string[]

  return (
    <>
      <section className="border-b bg-muted/20 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit">
              {t("organisation.badge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {t("organisation.title")}
            </h1>
            <p className="text-lg text-muted-foreground">{t("organisation.subtitle")}</p>
            <ul className="flex flex-col gap-2 text-sm">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to={createHref} className={cn(buttonVariants({ size: "lg" }))}>
                {t("organisation.ctaPrimary")}
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link to="/pricing" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
                {t("organisation.ctaPricing")}
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatedOrgHero />
            <p className="text-center text-xs text-muted-foreground">{t("organisation.previewCaption")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">
            {t("organisation.featuresTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map(({ icon: Icon, titleKey, descKey }) => (
              <Card key={titleKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-5 text-primary" />
                    {t(titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="border-t py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t("organisation.finalTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("organisation.finalSubtitle")}</p>
          <Link to={createHref} className={cn(buttonVariants({ size: "lg" }))}>
            {t("organisation.ctaPrimary")}
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
