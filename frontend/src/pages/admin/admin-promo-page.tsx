import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation("admin")
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
      toast.error(t("promo.toasts.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

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
        toast.success(t("promo.toasts.updateSuccess"))
      } else {
        await createPromoCode(payload)
        toast.success(t("promo.toasts.createSuccess"))
      }
      setOpen(false)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("promo.toasts.error"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (promo: PromoCode) => {
    if (!confirm(t("promo.deleteConfirm", { code: promo.code }))) return
    try {
      await deletePromoCode(promo.id)
      toast.success(t("promo.toasts.deleteSuccess"))
      load()
    } catch {
      toast.error(t("common.toasts.deleteFailed"))
    }
  }

  const formatDiscount = (promo: PromoCode) =>
    promo.discountType === "PERCENT"
      ? `${promo.discountValue}%`
      : `${promo.discountValue} USD`

  const formatUses = (promo: PromoCode) =>
    `${promo.usedCount}${promo.maxUses != null ? `/${promo.maxUses}` : ""}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("promo.title")}</h1>
          <p className="text-muted-foreground">{t("promo.subtitle")}</p>
        </div>
        <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 size-4" />
          {t("promo.newCode")}
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="rounded-md border min-w-[320px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("promo.table.code")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("promo.table.discount")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("promo.table.uses")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("promo.table.validity")}</TableHead>
              <TableHead>{t("promo.table.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-mono font-medium">
                  {promo.code}
                  <p className="mt-0.5 font-sans text-xs font-normal text-muted-foreground md:hidden">
                    {formatDiscount(promo)}
                    {" · "}
                    {formatUses(promo)} {t("promo.table.usesShort")}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{formatDiscount(promo)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {promo.usedCount}{promo.maxUses != null ? ` / ${promo.maxUses}` : ""}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {promo.validUntil
                    ? formatMediumDate(promo.validUntil)
                    : t("common.dash")}
                </TableCell>
                <TableCell>
                  <Badge variant={promo.active ? "default" : "secondary"}>
                    {promo.active ? t("promo.status.active") : t("promo.status.inactive")}
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
                  {t("promo.noCodes")}
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
            <DialogTitle>{editId ? t("promo.editTitle") : t("promo.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("promo.form.code")}</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                disabled={!!editId}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("promo.form.description")}</Label>
              <Input
                placeholder={t("promo.form.descriptionPlaceholder")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("promo.form.type")}</Label>
                <Select value={form.discountType} onValueChange={(v) => v && setForm({ ...form, discountType: v as "PERCENT" | "FIXED" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">{t("promo.form.typePercent")}</SelectItem>
                    <SelectItem value="FIXED">{t("promo.form.typeFixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("promo.form.value")}</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("promo.form.maxUses")}</Label>
              <Input value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("promo.form.expiresOn")}</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>{t("promo.form.active")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
