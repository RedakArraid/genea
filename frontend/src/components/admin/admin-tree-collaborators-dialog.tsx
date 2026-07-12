import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import {
  fetchAdminTreeCollaborators,
  inviteAdminTreeCollaborator,
  updateAdminTreeCollaborator,
  removeAdminTreeCollaborator,
  revokeAdminTreeInvite,
  type AdminTreeCollaborator,
  type AdminTreeInvite,
} from "@/lib/admin-api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminTreeCollaboratorsDialogProps {
  treeId: string | null
  treeName?: string
  open: boolean
  onClose: () => void
}

export function AdminTreeCollaboratorsDialog({
  treeId,
  treeName,
  open,
  onClose,
}: AdminTreeCollaboratorsDialogProps) {
  const { t } = useTranslation("admin")
  const [loading, setLoading] = useState(false)
  const [collaborators, setCollaborators] = useState<AdminTreeCollaborator[]>([])
  const [invites, setInvites] = useState<AdminTreeInvite[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER")
  const [canManage, setCanManage] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!treeId) return
    setLoading(true)
    try {
      const data = await fetchAdminTreeCollaborators(treeId)
      setCollaborators(data.collaborators)
      setInvites(data.invites)
    } catch {
      toast.error(t("trees.collaborators.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && treeId) load()
  }, [open, treeId])

  const handleInvite = async () => {
    if (!treeId || !email.trim()) return
    setSaving(true)
    try {
      await inviteAdminTreeCollaborator(treeId, {
        email: email.trim(),
        role,
        canManageCollaborators: canManage,
      })
      toast.success(t("trees.collaborators.inviteSuccess"))
      setEmail("")
      setCanManage(false)
      await load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || t("trees.collaborators.inviteFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (
    userId: string,
    data: { role?: "VIEWER" | "EDITOR"; canManageCollaborators?: boolean },
  ) => {
    if (!treeId) return
    try {
      await updateAdminTreeCollaborator(treeId, userId, data)
      await load()
      toast.success(t("trees.collaborators.updateSuccess"))
    } catch {
      toast.error(t("trees.collaborators.updateFailed"))
    }
  }

  const handleRemove = async (userId: string) => {
    if (!treeId || !confirm(t("trees.collaborators.removeConfirm"))) return
    try {
      await removeAdminTreeCollaborator(treeId, userId)
      await load()
      toast.success(t("trees.collaborators.removeSuccess"))
    } catch {
      toast.error(t("trees.collaborators.removeFailed"))
    }
  }

  const handleRevoke = async (inviteId: string) => {
    if (!treeId) return
    try {
      await revokeAdminTreeInvite(treeId, inviteId)
      await load()
      toast.success(t("trees.collaborators.revokeSuccess"))
    } catch {
      toast.error(t("trees.collaborators.revokeFailed"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("trees.collaborators.title", { name: treeName ?? "" })}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <Label className="flex items-center gap-2">
                <UserPlus className="size-4" />
                {t("trees.collaborators.add")}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("trees.collaborators.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Select value={role} onValueChange={(v) => v && setRole(v as "VIEWER" | "EDITOR")}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">{t("trees.collaborators.viewer")}</SelectItem>
                    <SelectItem value="EDITOR">{t("trees.collaborators.editor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">{t("trees.collaborators.canManage")}</Label>
                <Switch checked={canManage} onCheckedChange={setCanManage} />
              </div>
              <Button size="sm" disabled={saving || !email.trim()} onClick={handleInvite}>
                {t("trees.collaborators.invite")}
              </Button>
            </div>

            {collaborators.length > 0 && (
              <ul className="space-y-2 text-sm">
                {collaborators.map((c) => (
                  <li key={c.id} className="flex flex-col gap-2 rounded border p-2">
                    <div className="flex items-center justify-between">
                      <span>{c.User.email}</span>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => handleRemove(c.userId)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={c.role}
                        onValueChange={(v) => v && handleUpdate(c.userId, { role: v as "VIEWER" | "EDITOR" })}
                      >
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEWER">{t("trees.collaborators.viewer")}</SelectItem>
                          <SelectItem value="EDITOR">{t("trees.collaborators.editor")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!c.canManageCollaborators}
                          onCheckedChange={(checked) => handleUpdate(c.userId, { canManageCollaborators: checked })}
                        />
                        <span className="text-xs text-muted-foreground">{t("trees.collaborators.canManageShort")}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {invites.length > 0 && (
              <ul className="space-y-1 text-sm">
                <li className="text-xs font-medium text-muted-foreground">{t("trees.collaborators.pending")}</li>
                {invites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between rounded border border-dashed px-2 py-1">
                    <span className="truncate">{inv.email}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(inv.id)}>
                      {t("trees.collaborators.revoke")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {collaborators.length === 0 && invites.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("trees.collaborators.empty")}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
