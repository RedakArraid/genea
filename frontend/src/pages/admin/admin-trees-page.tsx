import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink, Trash2, Users } from "lucide-react"
import { formatMediumDate } from "@/lib/format"
import { toast } from "sonner"
import { fetchAdminTrees, deleteAdminTree, type AdminTree } from "@/lib/admin-api"
import { AdminTreeCollaboratorsDialog } from "@/components/admin/admin-tree-collaborators-dialog"
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
  const { t } = useTranslation("admin")
  const [trees, setTrees] = useState<AdminTree[]>([])
  const [loading, setLoading] = useState(true)
  const [demoFilter, setDemoFilter] = useState("all")
  const [visibilityFilter, setVisibilityFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [collabTree, setCollabTree] = useState<AdminTree | null>(null)

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
      toast.error(t("trees.toasts.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [demoFilter, visibilityFilter, page, t])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (tree: AdminTree) => {
    if (tree.isDemo) {
      toast.error(t("trees.toasts.demoUseDemoPage"))
      return
    }
    if (!confirm(t("trees.deleteConfirm", { name: tree.name }))) return
    try {
      await deleteAdminTree(tree.id)
      toast.success(t("trees.toasts.deleteSuccess"))
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("common.toasts.deleteFailed"))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("trees.title")}</h1>
        <p className="text-muted-foreground">{t("trees.subtitle")}</p>
      </div>

      <AdminDataTable
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={demoFilter} onValueChange={(v) => v && (setDemoFilter(v), setPage(1))}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder={t("trees.demoFilter")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.demoFilter.all")}</SelectItem>
                <SelectItem value="true">{t("common.demoFilter.demo")}</SelectItem>
                <SelectItem value="false">{t("common.demoFilter.personal")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={(v) => v && (setVisibilityFilter(v), setPage(1))}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder={t("common.visibility")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.visibilityOptions.all")}</SelectItem>
                <SelectItem value="PRIVATE">{t("common.visibilityOptions.private")}</SelectItem>
                <SelectItem value="SHARED">{t("common.visibilityOptions.shared")}</SelectItem>
                <SelectItem value="PUBLIC">{t("common.visibilityOptions.public")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="rounded-md border min-w-[320px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("common.owner")}</TableHead>
                <TableHead>{t("common.persons")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("common.visibility")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("common.updatedAt")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trees.map((tree) => (
                <TableRow key={tree.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                      <span className="font-medium">{tree.name}</span>
                      {tree.isDemo && <Badge>{t("common.demo")}</Badge>}
                      <span className="text-xs text-muted-foreground md:hidden">{tree.User?.email ?? t("common.dash")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tree.User?.email ?? t("common.dash")}</TableCell>
                  <TableCell>{tree._count?.Person ?? 0}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{tree.visibility}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatMediumDate(tree.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={tree.isDemo}
                      title={t("trees.collaborators.manage")}
                      onClick={() => setCollabTree(tree)}
                    >
                      <Users className="size-4" />
                    </Button>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{t("trees.noTrees")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </div>
      </AdminDataTable>

      <AdminTreeCollaboratorsDialog
        open={!!collabTree}
        treeId={collabTree?.id ?? null}
        treeName={collabTree?.name}
        onClose={() => setCollabTree(null)}
      />
    </div>
  )
}
