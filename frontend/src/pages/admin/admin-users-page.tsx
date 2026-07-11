import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { formatMediumDate } from "@/lib/format"
import { toast } from "sonner"
import {
  fetchAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  type AdminUser,
} from "@/lib/admin-api"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPlanById } from "@/lib/plans"
import { useAuthStore } from "@/stores/auth-store"
import type { PlanId } from "@/types"

export default function AdminUsersPage() {
  const { t } = useTranslation("admin")
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ name: "", plan: "SOLO" as PlanId, role: "USER" as "USER" | "ADMIN" })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { users: list, pagination } = await fetchAdminUsers({
        search: search || undefined,
        plan: planFilter === "all" ? undefined : planFilter,
        page,
      })
      setUsers(list)
      setTotalPages(pagination.pages)
    } catch {
      toast.error(t("users.toasts.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [search, planFilter, page, t])

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const openEdit = (user: AdminUser) => {
    setEditUser(user)
    setEditForm({
      name: user.name || "",
      plan: user.plan,
      role: user.role,
    })
  }

  const handleSave = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      await updateAdminUser(editUser.id, editForm)
      toast.success(t("users.toasts.updateSuccess"))
      setEditUser(null)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("common.toasts.updateFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(t("users.deleteConfirm", { email: user.email }))) return
    try {
      await deleteAdminUser(user.id)
      toast.success(t("users.toasts.deleteSuccess"))
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("common.toasts.deleteFailed"))
    }
  }

  const isSelf = (id: string) => currentUser?.id === id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("users.title")}</h1>
        <p className="text-muted-foreground">{t("users.subtitle")}</p>
      </div>

      <AdminDataTable
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder={t("users.searchPlaceholder")}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={planFilter} onValueChange={(v) => v && (setPlanFilter(v), setPage(1))}>
              <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={t("users.planFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.plans.all")}</SelectItem>
              <SelectItem value="SOLO">{t("common.plans.solo")}</SelectItem>
              <SelectItem value="FAMILY">{t("common.plans.family")}</SelectItem>
              <SelectItem value="PATRIMONY">{t("common.plans.patrimony")}</SelectItem>
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
                <TableHead>{t("common.email")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("common.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("common.plan")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("common.role")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("common.trees")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("common.registration")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/users/${user.id}`} className="hover:underline">
                      {user.email}
                    </Link>
                    <p className="text-xs text-muted-foreground md:hidden">
                      {user.name || t("common.dash")} · {getPlanById(user.plan).name}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.name || t("common.dash")}</TableCell>
                  <TableCell className="hidden md:table-cell">{getPlanById(user.plan).name}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{user.treeCount ?? 0}</TableCell>
                  <TableCell className="hidden xl:table-cell">{formatMediumDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/users/${user.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                      <Eye className="size-4" />
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isSelf(user.id)}
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("users.noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </div>
      </AdminDataTable>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editTitle", { email: editUser?.email })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.plan")}</Label>
              <Select value={editForm.plan} onValueChange={(v) => v && setEditForm({ ...editForm, plan: v as PlanId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLO">{t("common.plans.solo")}</SelectItem>
                  <SelectItem value="FAMILY">{t("common.plans.family")}</SelectItem>
                  <SelectItem value="PATRIMONY">{t("common.plans.patrimony")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.role")}</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => v && setEditForm({ ...editForm, role: v as "USER" | "ADMIN" })}
                disabled={editUser ? isSelf(editUser.id) : false}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t("common.roles.user")}</SelectItem>
                  <SelectItem value="ADMIN">{t("common.roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
              {editUser && isSelf(editUser.id) && (
                <p className="text-xs text-muted-foreground">{t("users.cannotRemoveOwnAdmin")}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
