import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { todayIsoDate, validateBirthDate } from "@/lib/person-dates"
import { Trash2, UserPlus, Link2 } from "lucide-react"
import type { NormalizedPerson, TreeTweaks, TreeType, TreeVisibility, TreeCollaborator, TreeInvite } from "@/types"
import { useTreeLexicon } from "@/hooks/use-tree-lexicon"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { buildInviteUrl } from "@/lib/invite-url"
import { useStorageConfig, photoMaxBytes } from "@/hooks/use-storage-config"
import { resolveMediaUrl } from "@/lib/upload"
import { AuthenticatedImage } from "@/components/ui/authenticated-image"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddPersonDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    data: Record<string, string>,
    relToId?: string | null,
    relType?: string | null,
    relToId2?: string | null,
    photoFile?: File | null
  ) => Promise<void>
  treeName: string
  treeId: string
  parentId?: string | null
  parent2Id?: string | null
  relationType?: string | null
  treeType?: TreeType
}

export function AddPersonDialog({
  open,
  onClose,
  onSubmit,
  treeName,
  parentId,
  parent2Id,
  relationType,
  treeType,
}: AddPersonDialogProps) {
  const { t } = useTranslation("tree")
  const lex = useTreeLexicon(treeType)
  const storageConfig = useStorageConfig()
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: treeName.split(" ").pop() || "",
    birthDate: "",
    birthPlace: "",
    deathDate: "",
    gender: "",
    occupation: "",
    biography: "",
  })

  const handleSubmit = async () => {
    if (!form.firstName.trim()) return
    const birthError = validateBirthDate(form.birthDate)
    if (birthError) {
      toast.error(birthError)
      return
    }
    setLoading(true)
    await onSubmit(form, parentId, relationType, parent2Id, photoFile)
    setLoading(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    setForm({ firstName: "", lastName: treeName.split(" ").pop() || "", birthDate: "", birthPlace: "", deathDate: "", gender: "", occupation: "", biography: "" })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > photoMaxBytes(storageConfig)) {
      toast.error(t("person.photoTooBig", { max: storageConfig.limits?.photoMaxMb ?? 5 }))
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const relLabel =
    relationType === "child"
      ? lex.asTeamMember
      : relationType === "parent"
        ? lex.asManager
        : relationType === "spouse"
          ? t("relations.asSpouse")
          : null

  const maxBirthDate = todayIsoDate()

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lex.addTitle}</DialogTitle>
          {relLabel && <p className="text-sm text-muted-foreground">{t("dialogs.addAs", { relation: relLabel })}</p>}
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{lex.firstNameRequired}</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lex.lastName}</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{lex.joined}</Label>
              <Input type="date" max={maxBirthDate} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lex.left}</Label>
              <Input type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lex.site}</Label>
            <Input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
          </div>
          {!lex.isOrg && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("person.gender")}</Label>
              <Select value={form.gender || undefined} onValueChange={(v) => v && setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder={t("person.genderSelect")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("person.genderMale")}</SelectItem>
                  <SelectItem value="female">{t("person.genderFemale")}</SelectItem>
                  <SelectItem value="other">{t("person.genderOther")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {lex.isOrg && (
            <div className="flex flex-col gap-1.5">
              <Label>{lex.role}</Label>
              <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Directeur commercial" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{lex.biography}</Label>
            <Textarea value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("person.photo")}</Label>
            <div className="flex items-center gap-3">
              {photoPreview && (
                photoPreview.startsWith("blob:") ? (
                  <img src={photoPreview} alt={t("person.photoPreview")} className="size-14 rounded-lg object-cover" />
                ) : (
                  <AuthenticatedImage src={photoPreview} alt={t("person.photoPreview")} className="size-14 rounded-lg object-cover" />
                )
              )}
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
            <p className="text-xs text-muted-foreground">
              {storageConfig.ready
                ? t("person.photoHint", { max: storageConfig.limits?.photoMaxMb ?? 5 })
                : t("person.photoUnavailable")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.firstName.trim()}>
            {loading ? t("dialogs.adding") : t("common:actions.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditPersonDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (personId: string, data: Record<string, string>, photoFile?: File | null) => Promise<void>
  person: { id: string; firstName: string; lastName: string; birthDate?: string | null; birthPlace?: string | null; deathDate?: string | null; gender?: string | null; biography?: string | null; photoUrl?: string | null } | null
  treeId: string
}

export function EditPersonDialog({ open, onClose, onSubmit, person }: EditPersonDialogProps) {
  const { t } = useTranslation("tree")
  const storageConfig = useStorageConfig()
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({ firstName: "", lastName: "", birthDate: "", birthPlace: "", deathDate: "", gender: "", biography: "" })

  useEffect(() => {
    if (person) {
      setForm({
        firstName: person.firstName,
        lastName: person.lastName,
        birthDate: person.birthDate?.split("T")[0] || "",
        birthPlace: person.birthPlace || "",
        deathDate: person.deathDate?.split("T")[0] || "",
        gender: person.gender || "",
        biography: person.biography || "",
      })
      setPhotoFile(null)
      setPhotoPreview(resolveMediaUrl(person.photoUrl))
    }
  }, [person])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > photoMaxBytes(storageConfig)) {
      toast.error(t("person.photoTooBig", { max: storageConfig.limits?.photoMaxMb ?? 5 }))
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const maxBirthDate = todayIsoDate()

  const handleSubmit = async () => {
    if (!person) return
    const birthError = validateBirthDate(form.birthDate)
    if (birthError) {
      toast.error(birthError)
      return
    }
    setLoading(true)
    await onSubmit(person.id, form, photoFile)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.editTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t("person.firstName")}</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("person.lastName")}</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t("person.birthDate")}</Label>
              <Input type="date" max={maxBirthDate} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("person.deathDate")}</Label>
              <Input type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("person.place")}</Label>
            <Input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("person.gender")}</Label>
            <Select value={form.gender || undefined} onValueChange={(v) => v && setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder={t("person.genderSelect")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("person.genderMale")}</SelectItem>
                <SelectItem value="female">{t("person.genderFemale")}</SelectItem>
                <SelectItem value="other">{t("person.genderOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("person.biography")}</Label>
            <Textarea value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("person.photo")}</Label>
            <div className="flex items-center gap-3">
              {photoPreview && (
                photoPreview.startsWith("blob:") ? (
                  <img src={photoPreview} alt={t("person.photoPreview")} className="size-14 rounded-lg object-cover" />
                ) : (
                  <AuthenticatedImage src={photoPreview} alt={t("person.photoPreview")} className="size-14 rounded-lg object-cover" />
                )
              )}
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={loading}>{t("common:actions.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  treeId: string
  visibility: TreeVisibility
  canManage: boolean
}

const VISIBILITY_KEYS: Record<TreeVisibility, { label: string; hint: string }> = {
  PRIVATE: { label: "share.visibilityPrivate", hint: "share.hintPrivate" },
  SHARED: { label: "share.visibilityShared", hint: "share.hintShared" },
  PUBLIC: { label: "share.visibilityPublic", hint: "share.hintPublic" },
}

export function ShareDialog({ open, onClose, treeId, visibility, canManage }: ShareDialogProps) {
  const { t } = useTranslation("tree")
  const { fetchCollaborators, inviteCollaborator, removeCollaborator, revokeInvite, updateVisibility } = useFamilyTreeStore()
  const [currentVisibility, setCurrentVisibility] = useState<TreeVisibility>(visibility)
  const [collaborators, setCollaborators] = useState<TreeCollaborator[]>([])
  const [invites, setInvites] = useState<TreeInvite[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER")
  const [loading, setLoading] = useState(false)

  const url = `${window.location.origin}/tree/${treeId}`

  useEffect(() => {
    setCurrentVisibility(visibility)
  }, [visibility])

  useEffect(() => {
    if (!open || !canManage) return
    fetchCollaborators(treeId).then((data) => {
      if (data) {
        setCollaborators(data.collaborators)
        setInvites(data.invites)
      }
    })
  }, [open, treeId, canManage, fetchCollaborators])

  const handleVisibility = async (v: TreeVisibility) => {
    const result = await updateVisibility(treeId, v)
    if (result.success) {
      setCurrentVisibility(v)
      toast.success(result.message || t("share.visibilityUpdated"))
    } else {
      toast.error(result.message)
    }
  }

  const handleInvite = async () => {
    if (!email.trim()) return
    setLoading(true)
    const result = await inviteCollaborator(treeId, email.trim(), role)
    setLoading(false)
    if (result.success) {
      if (result.invite?.token) {
        const link = buildInviteUrl(result.invite.token)
        await navigator.clipboard.writeText(link)
        toast.success(
          result.emailSent ? t("share.inviteCreatedEmail") : t("share.inviteCreated")
        )
      } else {
        toast.success(
          result.emailSent ? t("share.collaboratorAddedEmail") : (result.message || t("share.collaboratorAdded"))
        )
      }
      setEmail("")
      const data = await fetchCollaborators(treeId)
      if (data) {
        setCollaborators(data.collaborators)
        setInvites(data.invites)
      }
    } else {
      toast.error(result.message)
    }
  }

  const handleCopyInviteLink = async (token: string) => {
    const link = buildInviteUrl(token)
    await navigator.clipboard.writeText(link)
    toast.success(t("share.inviteLinkCopied"))
  }

  const handleRevokeInvite = async (inviteId: string) => {
    const result = await revokeInvite(treeId, inviteId)
    if (result.success) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      toast.success(t("share.inviteRevoked"))
    } else {
      toast.error(result.message)
    }
  }

  const handleRemove = async (userId: string) => {
    const result = await removeCollaborator(treeId, userId)
    if (result.success) {
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId))
      toast.success(t("share.collaboratorRemoved"))
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.shareTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {canManage ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>{t("share.visibility")}</Label>
                <Select value={currentVisibility} onValueChange={(v) => v && handleVisibility(v as TreeVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VISIBILITY_KEYS) as TreeVisibility[]).map((v) => (
                      <SelectItem key={v} value={v}>{t(VISIBILITY_KEYS[v].label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t(VISIBILITY_KEYS[currentVisibility].hint)}</p>
              </div>

              {currentVisibility === "SHARED" && (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <Label className="flex items-center gap-2">
                    <UserPlus className="size-4" />
                    {t("share.inviteCollaborator")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("share.inviteEmailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Select value={role} onValueChange={(v) => v && setRole(v as "VIEWER" | "EDITOR")}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">{t("share.roleViewer")}</SelectItem>
                        <SelectItem value="EDITOR">{t("share.roleEditor")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={handleInvite} disabled={loading || !email.trim()}>
                    {loading ? t("share.sending") : t("share.createInvite")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("share.inviteHint")}
                  </p>

                  {collaborators.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm">
                      {collaborators.map((c) => (
                        <li key={c.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                          <span>{c.User.email} · {c.role === "EDITOR" ? t("share.editor") : t("share.viewer")}</span>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleRemove(c.userId)}>
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {invites.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm">
                      <li className="text-xs font-medium text-muted-foreground">{t("share.pendingInvites")}</li>
                      {invites.map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between gap-2 rounded border border-dashed px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.role === "EDITOR" ? t("share.roleEditor") : t("share.roleViewer")} · {t("share.pending")}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title={t("share.copyLink")}
                              onClick={() => handleCopyInviteLink(inv.token)}
                            >
                              <Link2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title={t("share.revoke")}
                              onClick={() => handleRevokeInvite(inv.id)}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("share.readOnlyNotice")}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>{t("share.publicLink")}</Label>
            {currentVisibility === "PUBLIC" ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("share.publicLinkHint")}
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={url} />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success(t("share.linkCopied")) }}>
                    {t("common:actions.copy")}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("share.publicLinkDisabled")}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TreeSettingsSheetProps {
  open: boolean
  onClose: () => void
  tweaks: TreeTweaks
  onSetTweak: (key: keyof TreeTweaks, val: string | boolean) => void
}

const DENSITY_KEYS: Record<TreeTweaks["density"], string> = {
  spacious: "dialogs.densitySpacious",
  compact: "dialogs.densityCompact",
}

const CONN_STYLE_KEYS: Record<TreeTweaks["connStyle"], string> = {
  elbow: "dialogs.connElbow",
  curve: "dialogs.connCurve",
  straight: "dialogs.connStraight",
}

export function TreeSettingsSheet({ open, onClose, tweaks, onSetTweak }: TreeSettingsSheetProps) {
  const { t } = useTranslation("tree")
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("dialogs.settingsTitle")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">{t("dialogs.darkTheme")}</Label>
            <Switch className="shrink-0" checked={tweaks.theme === "dark"} onCheckedChange={(v) => onSetTweak("theme", v ? "dark" : "light")} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">{t("dialogs.hideDates")}</Label>
            <Switch className="shrink-0" checked={tweaks.hideDates} onCheckedChange={(v) => onSetTweak("hideDates", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">{t("dialogs.hidePlaces")}</Label>
            <Switch className="shrink-0" checked={tweaks.hidePlaces} onCheckedChange={(v) => onSetTweak("hidePlaces", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">{t("dialogs.hidePhotos")}</Label>
            <Switch className="shrink-0" checked={tweaks.hidePhotos} onCheckedChange={(v) => onSetTweak("hidePhotos", v)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("dialogs.density")}</Label>
            <Select value={tweaks.density} onValueChange={(v) => v && onSetTweak("density", v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{t(DENSITY_KEYS[tweaks.density])}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spacious">{t("dialogs.densitySpacious")}</SelectItem>
                <SelectItem value="compact">{t("dialogs.densityCompact")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("dialogs.connStyle")}</Label>
            <Select value={tweaks.connStyle} onValueChange={(v) => v && onSetTweak("connStyle", v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{t(CONN_STYLE_KEYS[tweaks.connStyle])}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elbow">{t("dialogs.connElbow")}</SelectItem>
                <SelectItem value="curve">{t("dialogs.connCurve")}</SelectItem>
                <SelectItem value="straight">{t("dialogs.connStraight")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface PersonPickerProps {
  people: NormalizedPerson[]
  excludeIds: string[]
  value: string
  onChange: (id: string) => void
  id?: string
}

function personLabel(p: NormalizedPerson) {
  return `${p.given}${p.sur && p.sur !== "—" ? ` ${p.sur}` : ""}`
}

function PersonPicker({ people, excludeIds, value, onChange, id }: PersonPickerProps) {
  const { t } = useTranslation("tree")
  const [query, setQuery] = useState("")

  const candidates = useMemo(() => {
    const exclude = new Set(excludeIds)
    return people
      .filter((p) => !exclude.has(p.id))
      .filter((p) => {
        if (!query.trim()) return true
        return personLabel(p).toLowerCase().includes(query.trim().toLowerCase())
      })
      .sort((a, b) => personLabel(a).localeCompare(personLabel(b), undefined, { sensitivity: "base" }))
  }, [people, excludeIds, query])

  const showSearch = people.length > 10

  return (
    <div className="flex flex-col gap-1.5">
      {showSearch && (
        <Input
          id={id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("dialogs.searchPerson")}
        />
      )}
      <Select value={value || undefined} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder={t("dialogs.choosePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {candidates.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("dialogs.noPersonMatch")}</div>
          ) : (
            candidates.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {personLabel(p)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

interface AddRelationDialogProps {
  open: boolean
  onClose: () => void
  person: NormalizedPerson
  people: NormalizedPerson[]
  onSubmit: (sourceId: string, targetId: string, relType: string) => Promise<void>
  treeType?: TreeType
}

export function AddRelationDialog({ open, onClose, person, people, onSubmit, treeType }: AddRelationDialogProps) {
  const { t } = useTranslation("tree")
  const lex = useTreeLexicon(treeType)
  const [targetId, setTargetId] = useState("")
  const [relType, setRelType] = useState("parent")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!targetId) return
    setLoading(true)
    await onSubmit(person.id, targetId, relType)
    setLoading(false)
    setTargetId("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogs.linkTitle", { name: person.given })}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("dialogs.personLabel")}</Label>
            <PersonPicker
              people={people}
              excludeIds={[person.id]}
              value={targetId}
              onChange={setTargetId}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("dialogs.relationLabel")}</Label>
            <Select value={relType} onValueChange={(v) => v && setRelType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">{lex.managerOf(person.given)}</SelectItem>
                <SelectItem value="child">{lex.teamMemberOf(person.given)}</SelectItem>
                {!lex.isOrg && <SelectItem value="spouse">{t("relations.spouse")}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={loading || !targetId}>{t("dialogs.createLink")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface LinkExistingChildDialogProps {
  open: boolean
  onClose: () => void
  parentIds: string[]
  people: NormalizedPerson[]
  onSubmit: (childId: string) => Promise<void>
}

export function LinkExistingChildDialog({
  open,
  onClose,
  parentIds,
  people,
  onSubmit,
}: LinkExistingChildDialogProps) {
  const { t } = useTranslation("tree")
  const [childId, setChildId] = useState("")
  const [loading, setLoading] = useState(false)

  const byId = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])
  const parents = parentIds.map((id) => byId[id]).filter(Boolean)

  const excludeIds = useMemo(() => {
    const ids = new Set(parentIds)
    for (const p of people) {
      if (parentIds.every((pid) => p.parentIds.includes(pid))) {
        ids.add(p.id)
      }
    }
    return Array.from(ids)
  }, [people, parentIds])

  const handleSubmit = async () => {
    if (!childId) return
    setLoading(true)
    try {
      await onSubmit(childId)
      setChildId("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.linkChildTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("dialogs.linkChildParents")}</Label>
            <p className="text-sm text-muted-foreground">
              {parents.map((p) => personLabel(p)).join(" · ") || "—"}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="link-child-select">{t("dialogs.linkChildSelect")}</Label>
            <PersonPicker
              id="link-child-select"
              people={people}
              excludeIds={excludeIds}
              value={childId}
              onChange={setChildId}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={loading || !childId}>
            {t("dialogs.linkChildSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
