import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchTreeMatches, updateMatchingOptIn, type TreeMatch } from "@/lib/matching-api"
import { getApiErrorPayload, translateApiError } from "@/lib/translate-error"

export default function MatchesPage() {
  const { id: treeId } = useParams<{ id: string }>()
  const { t } = useTranslation("tree")
  const [matches, setMatches] = useState<TreeMatch[]>([])
  const [matchingOptIn, setMatchingOptIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!treeId) return
    setLoading(true)
    fetchTreeMatches(treeId)
      .then((data) => {
        setMatches(data.matches)
        setMatchingOptIn(data.matchingOptIn)
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [treeId])

  const togglePrivacy = async () => {
    if (!treeId) return
    try {
      const next = !matchingOptIn
      const data = await updateMatchingOptIn(treeId, next)
      setMatchingOptIn(data.matchingOptIn)
      toast.success(next ? t("matches.optInEnabled") : t("matches.optInDisabled"))
      const refreshed = await fetchTreeMatches(treeId)
      setMatches(refreshed.matches)
    } catch (err) {
      toast.error(translateApiError(getApiErrorPayload(err)))
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("matches.kicker")}</p>
          <h1 className="text-2xl font-bold">{t("matches.title")}</h1>
          <p className="mt-1 max-w-lg text-muted-foreground">{t("matches.subtitle")}</p>
        </div>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => void togglePrivacy()}>
          {matchingOptIn ? t("matches.optOut") : t("matches.optIn")}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("matches.loading")}</p>
      ) : matches.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("matches.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((m) => (
            <Card key={m.treeId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{m.treeName}</CardTitle>
                  <Badge variant={m.confidence > 80 ? "default" : m.confidence > 60 ? "secondary" : "outline"}>
                    {m.confidence}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{m.ownerName} · {m.region}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span><strong>{m.sharedCount}</strong> {t("matches.sharedPersons")}</span>
                  <span className="text-muted-foreground">{t("matches.via", { name: m.via })}</span>
                </div>
                <Button className="mt-4 w-full" variant="outline" size="sm" render={<Link to={`/tree/${m.treeId}`} />}>
                  {t("matches.examine")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
