import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { formatMediumDate } from "@/lib/format"
import { toast } from "sonner"
import {
  createPromoCode,
  deletePromoCode,
  fetchPromoCodes,
  updatePromoCode,
  type PromoCode,
} from "@/lib/admin-api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import type { PlanId } from "@/types"

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENT" as "PERCENT" | "FIXED",
  discountValue: 10,
  maxUses: "",
  validUntil: "",
  active: true,
  applicablePlans: [] as PlanId[],
}

export default function AdminPromoPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchPromoCodes()
      setCodes(list)
    } catch {
      toast.error("Impossible de charger les codes promo")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (promo: PromoCode) => {
    setEditId(promo.id)
    setForm({
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxUses: promo.maxUses?.toString() || "",
      validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : "",
      active: promo.active,
      applicablePlans: promo.applicablePlans || [],
    })
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      code: form.code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
      validUntil: form.validUntil || undefined,
      active: form.active,
      applicablePlans: form.applicablePlans,
    }
    try {
      if (editId) {
        await updatePromoCode(editId, payload)
        toast.success("Code mis à jour")
      } else {
        await createPromoCode(payload)
        toast.success("Code créé")
      }
      setOpen(false)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (promo: PromoCode) => {
    if (!confirm(`Supprimer le code ${promo.code} ?`)) return
    try {
      await deletePromoCode(promo.id)
      toast.success("Code supprimé")
      load()
    } catch {
      toast.error("Suppression impossible")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Codes promo</h1>
          <p className="text-muted-foreground">
            Réductions par marché ou campagne — créez un code par pays/région (ex. lancement France, partenaire Sénégal).
          </p>
        </div>
        <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 size-4" />
          Nouveau code
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="rounded-md border min-w-[320px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="hidden sm:table-cell">Réduction</TableHead>
              <TableHead className="hidden md:table-cell">Utilisations</TableHead>
              <TableHead className="hidden lg:table-cell">Validité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-mono font-medium">
                  {promo.code}
                  <p className="mt-0.5 font-sans text-xs font-normal text-muted-foreground md:hidden">
                    {promo.discountType === "PERCENT" ? `${promo.discountValue}%` : `${promo.discountValue} USD`}
                    {" · "}
                    {promo.usedCount}{promo.maxUses != null ? `/${promo.maxUses}` : ""} util.
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {promo.discountType === "PERCENT"
                    ? `${promo.discountValue}%`
                    : `${promo.discountValue} USD`}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {promo.usedCount}{promo.maxUses != null ? ` / ${promo.maxUses}` : ""}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {promo.validUntil
                    ? formatMediumDate(promo.validUntil)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={promo.active ? "default" : "secondary"}>
                    {promo.active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(promo)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(promo)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun code promo
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le code" : "Nouveau code promo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                disabled={!!editId}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="ex. Lancement France -50%, Partenaire CI"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.discountType} onValueChange={(v) => v && setForm({ ...form, discountType: v as "PERCENT" | "FIXED" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Pourcentage</SelectItem>
                    <SelectItem value="FIXED">Montant fixe (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Utilisations max (vide = illimité)</Label>
              <Input value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Expire le</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
