import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { toast } from "sonner"
import { fetchDemoInfo, resetDemoTree, type AdminTree } from "@/lib/admin-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDemoPage() {
  const { t } = useTranslation("admin")
  const [tree, setTree] = useState<AdminTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchDemoInfo()
      .then(({ tree: demoTree }) => setTree(demoTree))
      .catch(() => toast.error(t("demo.toasts.loadFailed")))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleReset = async () => {
    if (!confirm(t("demo.resetConfirm"))) return
    setResetting(true)
    try {
      const { tree: demoTree } = await resetDemoTree()
      setTree(demoTree)
      toast.success(t("demo.toasts.resetSuccess"))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("demo.toasts.resetFailed"))
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("demo.title")}</h1>
        <p className="text-muted-foreground">{t("demo.subtitle")}</p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-600" />
            {t("demo.warning.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("demo.warning.description")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("demo.card.title")}
            <Badge>{t("common.demo")}</Badge>
          </CardTitle>
          <CardDescription>{t("demo.card.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : tree ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("demo.fields.id")}</dt>
                <dd className="font-mono text-xs">{tree.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("demo.fields.persons")}</dt>
                <dd>{tree._count?.Person ?? 0}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("demo.fields.owner")}</dt>
                <dd>{tree.User?.email ?? t("common.dash")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("demo.fields.lastUpdated")}</dt>
                <dd>{formatDateTime(tree.updatedAt)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground">{t("demo.notFound")}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleReset} disabled={resetting}>
              <RefreshCw className={`mr-2 size-4 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? t("demo.resetting") : t("demo.reset")}
            </Button>
            <Link to="/demo" target="_blank" className={buttonVariants({ variant: "outline" })}>
              <ExternalLink className="mr-2 size-4" />
              {t("demo.viewDemo")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
