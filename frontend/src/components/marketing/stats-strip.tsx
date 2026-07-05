import { GitBranch, Share2, FileDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useReveal } from "@/hooks/use-reveal"

const statKeys = ["canvas", "collaboration", "export"] as const
const statIcons = { canvas: GitBranch, collaboration: Share2, export: FileDown }

export function StatsStrip() {
  const { t } = useTranslation("marketing")
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      className={cn(
        "border-b bg-muted/20 py-8",
        visible && "animate-in fade-in slide-in-from-bottom-3 duration-700"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6">
        {statKeys.map((key, i) => {
          const Icon = statIcons[key]
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm",
                visible && "animate-in fade-in slide-in-from-bottom-2 duration-500"
              )}
              style={visible ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <Icon className="size-4 text-primary" />
              {t(`stats.${key}`)}
            </div>
          )
        })}
      </div>
    </section>
  )
}
