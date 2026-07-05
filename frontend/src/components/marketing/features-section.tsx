import { Users, Search, Share2, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useReveal } from "@/hooks/use-reveal"

const featureDefs = [
  { key: "trees", icon: Users, span: "md:col-span-4 md:row-span-2" },
  { key: "search", icon: Search, span: "md:col-span-2" },
  { key: "share", icon: Share2, span: "md:col-span-2" },
  { key: "privacy", icon: Shield, span: "md:col-span-2" },
] as const

export function FeaturesSection() {
  const { t } = useTranslation("marketing")
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section
      id="fonctionnalites"
      ref={ref}
      className="scroll-mt-20 border-t py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={cn(
            "mb-10 max-w-2xl",
            visible && "animate-in fade-in slide-in-from-bottom-3 duration-700"
          )}
        >
          <h2 className="text-3xl font-bold tracking-tight">{t("featuresSection.title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("featuresSection.subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-6 md:grid-rows-2">
          {featureDefs.map((feature, i) => (
            <Card
              key={feature.key}
              className={cn(
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-md",
                feature.span,
                visible && "animate-in fade-in slide-in-from-bottom-4 duration-700"
              )}
              style={visible ? { animationDelay: `${120 + i * 80}ms` } : { opacity: visible ? 1 : 0 }}
            >
              <CardHeader className={feature.key === "trees" ? "pb-2" : ""}>
                <feature.icon className="mb-2 size-8 text-primary" />
                <CardTitle className={feature.key === "trees" ? "text-xl" : "text-base"}>
                  {t(`features.${feature.key}.title`)}
                </CardTitle>
                <CardDescription className={feature.key === "trees" ? "text-base" : ""}>
                  {t(`features.${feature.key}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
