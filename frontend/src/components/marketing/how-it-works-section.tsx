import { UserPlus, ImagePlus, Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useReveal } from "@/hooks/use-reveal"

const steps = [
  { key: "1", icon: UserPlus },
  { key: "2", icon: ImagePlus },
  { key: "3", icon: Share2 },
] as const

export function HowItWorksSection() {
  const { t } = useTranslation("marketing")
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="border-t bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2
          className={cn(
            "mb-12 text-center text-3xl font-bold tracking-tight",
            visible && "animate-in fade-in slide-in-from-bottom-3 duration-700"
          )}
        >
          {t("howItWorks.title")}
        </h2>
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-px bg-border md:block" />
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.key}
                className={cn(
                  "relative flex flex-col items-center text-center",
                  visible && "animate-in fade-in slide-in-from-bottom-4 duration-700"
                )}
                style={visible ? { animationDelay: `${i * 120}ms` } : undefined}
              >
                <div className="relative z-10 mb-4 flex size-14 items-center justify-center rounded-full border-2 border-primary bg-background shadow-sm">
                  <Icon className="size-6 text-primary" />
                  <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {step.key}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold">{t(`howItWorks.steps.${step.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`howItWorks.steps.${step.key}.description`)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
