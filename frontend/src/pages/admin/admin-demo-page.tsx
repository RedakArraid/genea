import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { fetchDemoInfo, resetDemoTree, type AdminTree } from "@/lib/admin-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDemoPage() {
  const [tree, setTree] = useState<AdminTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const load = () => {
    setLoading(true)
    fetchDemoInfo()
      .then(({ tree: t }) => setTree(t))
      .catch(() => toast.error("Impossible de charger l'arbre démo"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleReset = async () => {
    if (!confirm("Réinitialiser l'arbre démo Famille Dupont ? Toutes les modifications seront perdues.")) return
    setResetting(true)
    try {
      const { tree: t } = await resetDemoTree()
      setTree(t)
      toast.success("Arbre démo réinitialisé")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Échec de la réinitialisation")
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Arbre démo</h1>
        <p className="text-muted-foreground">Famille Dupont — environnement partagé</p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-600" />
            Mutations partagées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            L'arbre démo est modifiable par tous les visiteurs. Utilisez la réinitialisation pour restaurer l'état initial.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Famille Dupont
            <Badge>Démo</Badge>
          </CardTitle>
          <CardDescription>Arbre public de démonstration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : tree ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs">{tree.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Personnes</dt>
                <dd>{tree._count?.Person ?? 0}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Propriétaire</dt>
                <dd>{tree.User?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dernière MAJ</dt>
                <dd>{format(new Date(tree.updatedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground">Aucun arbre démo trouvé. Lancez le seed ou réinitialisez.</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleReset} disabled={resetting}>
              <RefreshCw className={`mr-2 size-4 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Réinitialisation…" : "Réinitialiser la démo"}
            </Button>
            <Link to="/demo" target="_blank" className={buttonVariants({ variant: "outline" })}>
              <ExternalLink className="mr-2 size-4" />
              Voir /demo
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
