import { useState } from "react"
import { X, MousePointerClick, UserPlus, Pencil } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DISMISS_KEY = "geneamap_tree_hint_dismissed"

interface TreeOnboardingHintProps {
  personCount: number
  canWrite: boolean
  onAddPerson: () => void
  className?: string
}

export function TreeOnboardingHint({
  personCount,
  canWrite,
  onAddPerson,
  className,
}: TreeOnboardingHintProps) {
  const { t } = useTranslation("tree")
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1" || personCount > 2
  )

  if (dismissed || !canWrite) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  return (
    <div
      className={cn(
        "mx-3 mt-3 flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      role="status"
    >
      <div className="flex flex-col gap-2 text-sm">
        <p className="font-medium">{t("onboarding.title")}</p>
        <ul className="flex flex-col gap-1 text-muted-foreground">
          <li className="flex items-center gap-2">
            <MousePointerClick className="size-4 shrink-0" />
            {t("onboarding.stepSelect")}
          </li>
          <li className="flex items-center gap-2">
            <Pencil className="size-4 shrink-0" />
            {t("onboarding.stepEdit")}
          </li>
          <li className="flex items-center gap-2">
            <UserPlus className="size-4 shrink-0" />
            {t("onboarding.stepAdd")}
          </li>
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={onAddPerson}>
          <UserPlus className="mr-1.5 size-4" />
          {t("onboarding.addCta")}
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={dismiss} aria-label={t("onboarding.dismiss")}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
