import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
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
      toast.error("Impossible de charger les utilisateurs")
    } finally {
      setLoading(false)
    }
  }, [search, planFilter, page])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
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
      toast.success("Utilisateur mis à jour")
      setEditUser(null)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Erreur de mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Supprimer ${user.email} ?`)) return
    try {
      await deleteAdminUser(user.id)
      toast.success("Utilisateur supprimé")
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Suppression impossible")
    }
  }

  const isSelf = (id: string) => currentUser?.id === id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground">Gestion des comptes et forfaits</p>
      </div>

      <AdminDataTable
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Email ou nom…"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        filters={
          <Select value={planFilter} onValueChange={(v) => v && (setPlanFilter(v), setPage(1))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Forfait" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous forfaits</SelectItem>
              <SelectItem value="SOLO">Solo</SelectItem>
              <SelectItem value="FAMILY">Famille</SelectItem>
              <SelectItem value="PATRIMONY">Patrimoine</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Forfait</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Arbres</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/users/${user.id}`} className="hover:underline">
                      {user.email}
                    </Link>
                  </TableCell>
                  <TableCell>{user.name || "—"}</TableCell>
                  <TableCell>{getPlanById(user.plan).name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.treeCount ?? 0}</TableCell>
                  <TableCell>{formatMediumDate(user.createdAt)}</TableCell>
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
                    Aucun utilisateur
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </AdminDataTable>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {editUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Forfait</Label>
              <Select value={editForm.plan} onValueChange={(v) => v && setEditForm({ ...editForm, plan: v as PlanId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLO">Solo</SelectItem>
                  <SelectItem value="FAMILY">Famille</SelectItem>
                  <SelectItem value="PATRIMONY">Patrimoine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => v && setEditForm({ ...editForm, role: v as "USER" | "ADMIN" })}
                disabled={editUser ? isSelf(editUser.id) : false}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
              {editUser && isSelf(editUser.id) && (
                <p className="text-xs text-muted-foreground">Vous ne pouvez pas retirer votre propre rôle admin.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
