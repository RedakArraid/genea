import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ExternalLink, Trash2 } from "lucide-react"
import { formatMediumDate } from "@/lib/format"
import { toast } from "sonner"
import { fetchAdminTrees, deleteAdminTree, type AdminTree } from "@/lib/admin-api"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminTreesPage() {
  const [trees, setTrees] = useState<AdminTree[]>([])
  const [loading, setLoading] = useState(true)
  const [demoFilter, setDemoFilter] = useState("all")
  const [visibilityFilter, setVisibilityFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { trees: list, pagination } = await fetchAdminTrees({
        isDemo: demoFilter === "all" ? undefined : demoFilter,
        visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
        page,
      })
      setTrees(list)
      setTotalPages(pagination.pages)
    } catch {
      toast.error("Impossible de charger les arbres")
    } finally {
      setLoading(false)
    }
  }, [demoFilter, visibilityFilter, page])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (tree: AdminTree) => {
    if (tree.isDemo) {
      toast.error("Utilisez la page Démo pour réinitialiser l'arbre démo")
      return
    }
    if (!confirm(`Supprimer l'arbre "${tree.name}" ?`)) return
    try {
      await deleteAdminTree(tree.id)
      toast.success("Arbre supprimé")
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Suppression impossible")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Arbres</h1>
        <p className="text-muted-foreground">Tous les arbres généalogiques</p>
      </div>

      <AdminDataTable
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        filters={
          <div className="flex gap-2">
            <Select value={demoFilter} onValueChange={(v) => v && (setDemoFilter(v), setPage(1))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Démo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="true">Démo</SelectItem>
                <SelectItem value="false">Perso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={(v) => v && (setVisibilityFilter(v), setPage(1))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Visibilité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="PRIVATE">Privé</SelectItem>
                <SelectItem value="SHARED">Partagé</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Personnes</TableHead>
                <TableHead>Visibilité</TableHead>
                <TableHead>MAJ</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trees.map((tree) => (
                <TableRow key={tree.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tree.name}</span>
                      {tree.isDemo && <Badge>Démo</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{tree.User?.email ?? "—"}</TableCell>
                  <TableCell>{tree._count?.Person ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tree.visibility}</Badge>
                  </TableCell>
                  <TableCell>{formatMediumDate(tree.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={tree.isDemo ? "/demo" : `/tree/${tree.id}`}
                      target="_blank"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <Button variant="ghost" size="icon" disabled={tree.isDemo} onClick={() => handleDelete(tree)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {trees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Aucun arbre</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </AdminDataTable>
    </div>
  )
}
