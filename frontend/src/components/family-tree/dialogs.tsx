import { useEffect, useState } from "react"
import { toast } from "sonner"
import { todayIsoDate, validateBirthDate } from "@/lib/person-dates"
import { Trash2, UserPlus, Link2 } from "lucide-react"
import type { NormalizedPerson, TreeTweaks, TreeVisibility, TreeCollaborator, TreeInvite } from "@/types"
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
}

export function AddPersonDialog({
  open,
  onClose,
  onSubmit,
  treeName,
  parentId,
  parent2Id,
  relationType,
}: AddPersonDialogProps) {
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
    setForm({ firstName: "", lastName: treeName.split(" ").pop() || "", birthDate: "", birthPlace: "", deathDate: "", gender: "", biography: "" })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > photoMaxBytes(storageConfig)) {
      toast.error(`Photo trop volumineuse (max ${storageConfig.limits?.photoMaxMb ?? 5} Mo)`)
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const relLabel =
    relationType === "child" ? "enfant" : relationType === "parent" ? "parent" : relationType === "spouse" ? "conjoint·e" : null

  const maxBirthDate = todayIsoDate()

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une personne</DialogTitle>
          {relLabel && <p className="text-sm text-muted-foreground">En tant que {relLabel}</p>}
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Prénom *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nom</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Naissance</Label>
              <Input type="date" max={maxBirthDate} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Décès</Label>
              <Input type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Lieu de naissance</Label>
            <Input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Genre</Label>
            <Select value={form.gender || undefined} onValueChange={(v) => v && setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Homme</SelectItem>
                <SelectItem value="female">Femme</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Biographie</Label>
            <Textarea value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              {photoPreview && (
                photoPreview.startsWith("blob:") ? (
                  <img src={photoPreview} alt="Aperçu" className="size-14 rounded-lg object-cover" />
                ) : (
                  <AuthenticatedImage src={photoPreview} alt="Aperçu" className="size-14 rounded-lg object-cover" />
                )
              )}
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
            <p className="text-xs text-muted-foreground">
              {storageConfig.ready
                ? `JPEG, PNG, WebP — max ${storageConfig.limits?.photoMaxMb ?? 5} Mo (MinIO)`
                : "Stockage MinIO indisponible — photo ignorée à l'enregistrement"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.firstName.trim()}>
            {loading ? "Ajout..." : "Ajouter"}
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
      toast.error(`Photo trop volumineuse (max ${storageConfig.limits?.photoMaxMb ?? 5} Mo)`)
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
          <DialogTitle>Modifier la personne</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Prénom</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nom</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Naissance</Label>
              <Input type="date" max={maxBirthDate} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Décès</Label>
              <Input type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Lieu</Label>
            <Input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Genre</Label>
            <Select value={form.gender || undefined} onValueChange={(v) => v && setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Homme</SelectItem>
                <SelectItem value="female">Femme</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Biographie</Label>
            <Textarea value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              {photoPreview && (
                photoPreview.startsWith("blob:") ? (
                  <img src={photoPreview} alt="Aperçu" className="size-14 rounded-lg object-cover" />
                ) : (
                  <AuthenticatedImage src={photoPreview} alt="Aperçu" className="size-14 rounded-lg object-cover" />
                )
              )}
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading}>Enregistrer</Button>
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

const VISIBILITY_LABELS: Record<TreeVisibility, string> = {
  PRIVATE: "Privé — compte requis pour accéder",
  SHARED: "Partagé — collaborateurs invités uniquement",
  PUBLIC: "Public — visible sans compte (lecture seule)",
}

const VISIBILITY_HINTS: Record<TreeVisibility, string> = {
  PRIVATE: "Seul le propriétaire et les collaborateurs invités peuvent voir l'arbre.",
  SHARED: "Seuls les collaborateurs invités peuvent voir l'arbre. Le lien public ne fonctionne pas.",
  PUBLIC: "Toute personne avec le lien peut consulter l'arbre sans compte. La modification nécessite un compte autorisé.",
}

export function ShareDialog({ open, onClose, treeId, visibility, canManage }: ShareDialogProps) {
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
      toast.success(result.message || "Visibilité mise à jour")
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
        toast.success("Invitation créée — lien copié dans le presse-papier")
      } else {
        toast.success(result.message || "Collaborateur ajouté")
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
    toast.success("Lien d'invitation copié")
  }

  const handleRevokeInvite = async (inviteId: string) => {
    const result = await revokeInvite(treeId, inviteId)
    if (result.success) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      toast.success("Invitation révoquée")
    } else {
      toast.error(result.message)
    }
  }

  const handleRemove = async (userId: string) => {
    const result = await removeCollaborator(treeId, userId)
    if (result.success) {
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId))
      toast.success("Collaborateur retiré")
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partager l'arbre</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {canManage ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Visibilité</Label>
                <Select value={currentVisibility} onValueChange={(v) => v && handleVisibility(v as TreeVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VISIBILITY_LABELS) as TreeVisibility[]).map((v) => (
                      <SelectItem key={v} value={v}>{VISIBILITY_LABELS[v]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{VISIBILITY_HINTS[currentVisibility]}</p>
              </div>

              {currentVisibility === "SHARED" && (
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <Label className="flex items-center gap-2">
                    <UserPlus className="size-4" />
                    Inviter un collaborateur
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Select value={role} onValueChange={(v) => v && setRole(v as "VIEWER" | "EDITOR")}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Lecture</SelectItem>
                        <SelectItem value="EDITOR">Édition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={handleInvite} disabled={loading || !email.trim()}>
                    {loading ? "Envoi…" : "Créer l'invitation"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Compte existant : ajout immédiat. Sinon, un lien d'invitation sera copié.
                  </p>

                  {collaborators.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm">
                      {collaborators.map((c) => (
                        <li key={c.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                          <span>{c.User.email} · {c.role === "EDITOR" ? "Éditeur" : "Lecteur"}</span>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleRemove(c.userId)}>
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {invites.length > 0 && (
                    <ul className="flex flex-col gap-1 text-sm">
                      <li className="text-xs font-medium text-muted-foreground">Invitations en attente</li>
                      {invites.map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between gap-2 rounded border border-dashed px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.role === "EDITOR" ? "Édition" : "Lecture"} · en attente
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="Copier le lien"
                              onClick={() => handleCopyInviteLink(inv.token)}
                            >
                              <Link2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="Révoquer"
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
              Vous consultez cet arbre en lecture seule.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Lien de consultation publique</Label>
            {currentVisibility === "PUBLIC" ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Partagez ce lien pour permettre la lecture sans compte.
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={url} />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Lien copié") }}>
                    Copier
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Passez la visibilité sur « Public » pour activer un lien de consultation sans compte.
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

const DENSITY_LABELS: Record<TreeTweaks["density"], string> = {
  spacious: "Aérée",
  compact: "Compacte",
}

const CONN_STYLE_LABELS: Record<TreeTweaks["connStyle"], string> = {
  elbow: "Équerre",
  curve: "Courbe",
  straight: "Droite",
}

export function TreeSettingsSheet({ open, onClose, tweaks, onSetTweak }: TreeSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Réglages d'affichage</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">Thème sombre</Label>
            <Switch className="shrink-0" checked={tweaks.theme === "dark"} onCheckedChange={(v) => onSetTweak("theme", v ? "dark" : "light")} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">Masquer les dates</Label>
            <Switch className="shrink-0" checked={tweaks.hideDates} onCheckedChange={(v) => onSetTweak("hideDates", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">Masquer les lieux</Label>
            <Switch className="shrink-0" checked={tweaks.hidePlaces} onCheckedChange={(v) => onSetTweak("hidePlaces", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">Masquer les photos</Label>
            <Switch className="shrink-0" checked={tweaks.hidePhotos} onCheckedChange={(v) => onSetTweak("hidePhotos", v)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Densité</Label>
            <Select value={tweaks.density} onValueChange={(v) => v && onSetTweak("density", v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{DENSITY_LABELS[tweaks.density]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spacious">Aérée</SelectItem>
                <SelectItem value="compact">Compacte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Style de connexion</Label>
            <Select value={tweaks.connStyle} onValueChange={(v) => v && onSetTweak("connStyle", v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{CONN_STYLE_LABELS[tweaks.connStyle]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elbow">Équerre</SelectItem>
                <SelectItem value="curve">Courbe</SelectItem>
                <SelectItem value="straight">Droite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface AddRelationDialogProps {
  open: boolean
  onClose: () => void
  person: NormalizedPerson
  people: NormalizedPerson[]
  onSubmit: (sourceId: string, targetId: string, relType: string) => Promise<void>
}

export function AddRelationDialog({ open, onClose, person, people, onSubmit }: AddRelationDialogProps) {
  const [targetId, setTargetId] = useState("")
  const [relType, setRelType] = useState("parent")
  const [loading, setLoading] = useState(false)

  const others = people.filter((p) => p.id !== person.id)

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
          <DialogTitle>Lier {person.given} à un proche</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Personne</Label>
            <Select value={targetId || undefined} onValueChange={(v) => v && setTargetId(v)}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {others.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.given} {p.sur}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Relation</Label>
            <Select value={relType} onValueChange={(v) => v && setRelType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent de {person.given}</SelectItem>
                <SelectItem value="child">Enfant de {person.given}</SelectItem>
                <SelectItem value="spouse">Conjoint·e</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading || !targetId}>Créer le lien</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
