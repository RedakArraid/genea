import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
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
        toast.error("Utilisateur introuvable")
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
      toast.success("Utilisateur mis à jour")
      setEditOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Erreur de mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || isSelf) return
    if (!confirm(`Supprimer ${user.email} ?`)) return
    try {
      await deleteAdminUser(user.id)
      toast.success("Utilisateur supprimé")
      navigate("/admin/users")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Suppression impossible")
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
          Liste des utilisateurs
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
            Modifier
          </Button>
          <Button variant="destructive" disabled={isSelf} onClick={handleDelete}>
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forfait</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getPlanById(user.plan).name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rôle</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arbres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user._count?.FamilyTree ?? user.FamilyTree?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user._count?.TreeCollaborator ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Métadonnées du compte</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Inscription</dt>
              <dd>{formatDateTime(user.createdAt)}</dd>
            </div>
            {user.updatedAt && (
              <div>
                <dt className="text-muted-foreground">Dernière MAJ</dt>
                <dd>{formatDateTime(user.updatedAt)}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arbres possédés</CardTitle>
          <CardDescription>{user.FamilyTree?.length ?? 0} arbre(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="rounded-md border min-w-[280px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Personnes</TableHead>
                  <TableHead className="hidden md:table-cell">Visibilité</TableHead>
                  <TableHead className="hidden lg:table-cell">Créé le</TableHead>
                  <TableHead className="text-right">Voir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(user.FamilyTree ?? []).map((tree) => (
                  <TableRow key={tree.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                        <span className="font-medium">{tree.name}</span>
                        {tree.isDemo && <Badge>Démo</Badge>}
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
                      Aucun arbre
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
            <DialogTitle>Modifier {user.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="detail-name">Nom</Label>
              <Input
                id="detail-name"
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
                disabled={isSelf}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
