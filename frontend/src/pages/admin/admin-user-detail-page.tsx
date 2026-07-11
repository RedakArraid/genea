import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react"
import { formatDateTime, formatMediumDate } from "@/lib/format"
import { toast } from "sonner"
import {
  deleteAdminUser,
  fetchAdminUser,
  updateAdminUser,
  type AdminUserDetail,
} from "@/lib/admin-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getPlanById } from "@/lib/plans"
import { useAuthStore } from "@/stores/auth-store"
import type { PlanId } from "@/types"

export default function AdminUserDetailPage() {
  const { t } = useTranslation("admin")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", plan: "SOLO" as PlanId, role: "USER" as "USER" | "ADMIN" })
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    fetchAdminUser(id)
      .then((u) => {
        setUser(u)
        setEditForm({ name: u.name || "", plan: u.plan, role: u.role })
      })
      .catch(() => {
        toast.error(t("userDetail.toasts.notFound"))
        navigate("/admin/users")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const isSelf = user?.id === currentUser?.id

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await updateAdminUser(user.id, editForm)
      setUser({ ...user, ...updated })
      toast.success(t("users.toasts.updateSuccess"))
      setEditOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("common.toasts.updateFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || isSelf) return
    if (!confirm(t("users.deleteConfirm", { email: user.email }))) return
    try {
      await deleteAdminUser(user.id)
      toast.success(t("users.toasts.deleteSuccess"))
      navigate("/admin/users")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("common.toasts.deleteFailed"))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/users"
          data-testid="admin-users-back"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-1 size-4" />
          {t("userDetail.backToList")}
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            {t("common.edit")}
          </Button>
          <Button variant="destructive" disabled={isSelf} onClick={handleDelete}>
            <Trash2 className="mr-2 size-4" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("common.plan")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getPlanById(user.plan).name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("common.role")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("common.trees")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user._count?.FamilyTree ?? user.FamilyTree?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("userDetail.collaborations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user._count?.TreeCollaborator ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("userDetail.info.title")}</CardTitle>
          <CardDescription>{t("userDetail.info.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("common.registration")}</dt>
              <dd>{formatDateTime(user.createdAt)}</dd>
            </div>
            {user.updatedAt && (
              <div>
                <dt className="text-muted-foreground">{t("common.lastUpdated")}</dt>
                <dd>{formatDateTime(user.updatedAt)}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">{t("userDetail.info.id")}</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("userDetail.ownedTrees.title")}</CardTitle>
          <CardDescription>
            {t("userDetail.ownedTrees.description", { count: user.FamilyTree?.length ?? 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="rounded-md border min-w-[280px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.persons")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.visibility")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("common.registration")}</TableHead>
                  <TableHead className="text-right">{t("common.view")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(user.FamilyTree ?? []).map((tree) => (
                  <TableRow key={tree.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                        <span className="font-medium">{tree.name}</span>
                        {tree.isDemo && <Badge>{t("common.demo")}</Badge>}
                        <span className="text-xs text-muted-foreground md:hidden">{tree.visibility}</span>
                      </div>
                    </TableCell>
                    <TableCell>{tree._count?.Person ?? 0}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{tree.visibility}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell">{formatMediumDate(tree.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={tree.isDemo ? "/demo" : `/tree/${tree.id}`}
                        target="_blank"
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {!user.FamilyTree?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t("userDetail.ownedTrees.noTrees")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editTitle", { email: user.email })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="detail-name">{t("common.name")}</Label>
              <Input
                id="detail-name"
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
                disabled={isSelf}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t("common.roles.user")}</SelectItem>
                  <SelectItem value="ADMIN">{t("common.roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
