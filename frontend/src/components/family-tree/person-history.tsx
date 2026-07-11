import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { formatMediumDate } from "@/lib/format"
import { fetchPersonRevisions, restorePersonRevision, type PersonRevision } from "@/lib/person-history-api"
import { Button } from "@/components/ui/button"

interface PersonHistoryProps {
  personId: string
  onRestored?: () => void
}

export function PersonHistory({ personId, onRestored }: PersonHistoryProps) {
  const { t } = useTranslation("tree")
  const [revisions, setRevisions] = useState<PersonRevision[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchPersonRevisions(personId)
      .then(setRevisions)
      .catch(() => setRevisions([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [personId])

  const handleRestore = async (revisionId: string) => {
    try {
      await restorePersonRevision(personId, revisionId)
      toast.success(t("history.restored"))
      onRestored?.()
      load()
    } catch {
      toast.error(t("history.restoreFailed"))
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("history.loading")}</p>
  if (!revisions.length) return <p className="text-sm text-muted-foreground">{t("history.empty")}</p>

  return (
    <ul className="space-y-2">
      {revisions.map((rev) => {
        const snap = rev.snapshot as { firstName?: string; lastName?: string }
        const label = [snap.firstName, snap.lastName].filter(Boolean).join(" ") || "—"
        return (
          <li key={rev.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                {formatMediumDate(rev.createdAt)} · {rev.action}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void handleRestore(rev.id)}>
              {t("history.restore")}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
