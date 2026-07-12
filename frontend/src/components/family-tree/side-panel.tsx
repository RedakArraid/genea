import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { X, Focus, Trash2, Camera, Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { FamilyTree, NormalizedPerson, Person } from "@/types"
import { todayIsoDate, validateBirthDate } from "@/lib/person-dates"
import { formatLongDate } from "@/lib/format"
import { AuthenticatedImage } from "@/components/ui/authenticated-image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PersonDocuments } from "@/components/family-tree/person-documents"
import { PersonHistory } from "@/components/family-tree/person-history"
import { ChildAddMenu } from "@/components/family-tree/child-add-menu"
import { useTreeLexicon } from "@/hooks/use-tree-lexicon"
import { formatGenerationBadge, getMaxGeneration } from "@/lib/generation-level"
import { useIsMobile } from "@/hooks/use-mobile"

interface SidePanelProps {
  person: NormalizedPerson
  people: NormalizedPerson[]
  currentTree: FamilyTree
  onClose: () => void
  onSelect: (id: string) => void
  onSave?: (personId: string, data: Record<string, string>) => Promise<void>
  onChangePhoto?: (personId: string, file: File) => Promise<void>
  onAddRelation: (person: NormalizedPerson) => void
  onAddChildRelation: (parentId: string, relType: string, parent2Id?: string) => void
  onLinkExistingChild: (parentIds: string[]) => void
  onDelete: (id: string) => void
  onDeleteRelation: (relId: string) => void
  readOnly?: boolean
  canEditInfo?: boolean
  canChangePhoto?: boolean
  canVersioning?: boolean
  onPersonRestored?: () => void
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return formatLongDate(dateStr) || null
}

function personToForm(person: NormalizedPerson, raw?: Person) {
  return {
    firstName: person.given || "",
    lastName: person.sur && person.sur !== "-" ? person.sur : "",
    birthDate: person.birthDate?.split("T")[0] || "",
    birthPlace: person.place || "",
    deathDate: person.deathDate?.split("T")[0] || "",
    gender: raw?.gender || "",
    occupation: raw?.occupation || "",
    biography: raw?.biography || person.bio?.fr || "",
  }
}

interface RelSectionProps {
  title: string
  readOnly?: boolean
  onAdd?: () => void
  childAddMenu?: { onNewChild: () => void; onLinkExisting: () => void; newChildLabel?: string; linkExistingLabel?: string }
  children: React.ReactNode
  addButtonLabel: string
}

function RelSection({ title, readOnly, onAdd, childAddMenu, children, addButtonLabel }: RelSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
        {!readOnly && childAddMenu && (
          <ChildAddMenu
            onNewChild={childAddMenu.onNewChild}
            onLinkExisting={childAddMenu.onLinkExisting}
            newChildLabel={childAddMenu.newChildLabel}
            linkExistingLabel={childAddMenu.linkExistingLabel}
          />
        )}
        {onAdd && !readOnly && !childAddMenu && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onAdd}>
            {addButtonLabel}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

interface RelChipProps {
  person: NormalizedPerson
  relative: NormalizedPerson
  relType?: string
  relId: string | null | undefined
  readOnly?: boolean
  onSelect: (id: string) => void
  onDeleteRelation: (relId: string) => void
  onAddChildRelation: (parentId: string, relType: string, parent2Id?: string) => void
  onLinkExistingChild: (parentIds: string[]) => void
}

function RelChip({
  person,
  relative,
  relType,
  relId,
  readOnly,
  onSelect,
  onDeleteRelation,
  onAddChildRelation,
  onLinkExistingChild,
}: RelChipProps) {
  return (
    <div className="inline-flex items-center gap-1">
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onSelect(relative.id)}>
        {relative.given} {relative.sur !== "-" ? relative.sur : ""}
      </Button>
      {!readOnly && relType === "spouse" && (
        <ChildAddMenu
          compact
          onNewChild={() => onAddChildRelation(person.id, "child", relative.id)}
          onLinkExisting={() => onLinkExistingChild([person.id, relative.id])}
        />
      )}
      {!readOnly && relId && (
        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => onDeleteRelation(relId)}>
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}

function SidePanelContent({
  person,
  people,
  currentTree,
  onClose,
  onSelect,
  onSave,
  onChangePhoto,
  onAddRelation,
  onAddChildRelation,
  onLinkExistingChild,
  onDelete,
  onDeleteRelation,
  readOnly = false,
  canEditInfo = true,
  canChangePhoto = false,
  canVersioning = false,
  onPersonRestored,
}: SidePanelProps) {
  const { t } = useTranslation("tree")
  const lex = useTreeLexicon(currentTree)
  const maxGeneration = useMemo(() => getMaxGeneration(people), [people])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => {
    const raw = currentTree.Person?.find((p) => p.id === person.id)
    return personToForm(person, raw)
  })
  const [saving, setSaving] = useState(false)
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const maxBirthDate = todayIsoDate()

  useEffect(() => {
    const raw = currentTree.Person?.find((p) => p.id === person.id)
    setForm(personToForm(person, raw))
  }, [person, currentTree.Person])

  const byId = Object.fromEntries(people.map((p) => [p.id, p]))
  const parents = (person.parentIds || []).map((id) => byId[id]).filter(Boolean)
  const spouses = (person.spouseIds || []).map((id) => byId[id]).filter(Boolean)
  const children = people.filter((p) => p.parentIds.includes(person.id))
  const siblings = people.filter(
    (p) =>
      p.id !== person.id &&
      p.parentIds.length > 0 &&
      p.parentIds.some((pp) => person.parentIds.includes(pp))
  )
  const photoFallback = (
    <div className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
      {(person.given[0] || "?").toUpperCase()}
    </div>
  )

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onChangePhoto) return
    try {
      await onChangePhoto(person.id, file)
      toast.success(t("person.photoUpdated"))
    } catch {
      toast.error(t("person.photoUploadFailed"))
    } finally {
      e.target.value = ""
    }
  }

  const handleSave = async () => {
    if (!onSave || !form.firstName.trim()) return
    const birthError = validateBirthDate(form.birthDate)
    if (birthError) {
      toast.error(birthError)
      return
    }
    setSaving(true)
    try {
      await onSave(person.id, form)
      toast.success(t("person.updated"))
      setHistoryRefresh((n) => n + 1)
    } catch {
      toast.error(t("person.updateFailed"))
    } finally {
      setSaving(false)
    }
  }

  const findRelId = (relativeId: string, relType: string) => {
    const rels = currentTree.Relationship || []
    if (relType === "spouse") {
      return rels.find(
        (r) =>
          r.type === "spouse" &&
          ((r.sourceId === person.id && r.targetId === relativeId) ||
            (r.sourceId === relativeId && r.targetId === person.id))
      )?.id
    }
    if (relType === "parent") {
      return rels.find(
        (r) =>
          (r.type === "parent" && r.sourceId === relativeId && r.targetId === person.id) ||
          (r.type === "child" && r.sourceId === person.id && r.targetId === relativeId)
      )?.id
    }
    if (relType === "child") {
      return rels.find(
        (r) =>
          (r.type === "parent" && r.sourceId === person.id && r.targetId === relativeId) ||
          (r.type === "child" && r.sourceId === relativeId && r.targetId === person.id)
      )?.id
    }
    return null
  }

  const firstSpouseId = spouses[0]?.id
  const handleAddNewChild = useCallback(() => {
    onAddChildRelation(person.id, "child", firstSpouseId)
  }, [person.id, firstSpouseId, onAddChildRelation])

  const handleLinkExistingChildFromSection = useCallback(() => {
    onLinkExistingChild(firstSpouseId ? [person.id, firstSpouseId] : [person.id])
  }, [person.id, firstSpouseId, onLinkExistingChild])

  const childrenAddMenu = useMemo(
    () => ({
      onNewChild: handleAddNewChild,
      onLinkExisting: handleLinkExistingChildFromSection,
      newChildLabel: lex.newTeamMember,
      linkExistingLabel: lex.linkExistingTeamMember,
    }),
    [handleAddNewChild, handleLinkExistingChildFromSection, lex.linkExistingTeamMember, lex.newTeamMember]
  )

  const renderRelChip = (relative: NormalizedPerson, relType?: string) => (
    <RelChip
      key={relative.id}
      person={person}
      relative={relative}
      relType={relType}
      relId={relType ? findRelId(relative.id, relType) : null}
      readOnly={readOnly}
      onSelect={onSelect}
      onDeleteRelation={onDeleteRelation}
      onAddChildRelation={onAddChildRelation}
      onLinkExistingChild={onLinkExistingChild}
    />
  )

  return (
    <>
      <div className="flex items-center justify-between border-b p-4">
        <Badge variant="secondary">
          {formatGenerationBadge(person.generation, { isOrg: lex.isOrg, maxGeneration, lexicon: lex.config })}
        </Badge>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {person.photoUrl ? (
                <AuthenticatedImage
                  src={person.photoUrl}
                  alt={person.given}
                  className="size-full object-cover"
                  fallback={photoFallback}
                />
              ) : (
                photoFallback
              )}
            </div>
            <div className="min-w-0 flex-1">
              {canEditInfo && !readOnly ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="side-first-name" className="text-xs">{lex.firstName}</Label>
                    <Input
                      id="side-first-name"
                      data-testid="edit-first-name"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="side-last-name" className="text-xs">{lex.lastName}</Label>
                    <Input
                      id="side-last-name"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">
                    {person.given}{person.sur && person.sur !== "-" ? ` ${person.sur}` : ""}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {person.born || "?"}–{person.died || ""}
                    {person.place ? ` · ${person.place}` : ""}
                  </p>
                </>
              )}
              {canChangePhoto && onChangePhoto && (
                <>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                  <Button variant="outline" size="sm" className="mt-2 h-7" onClick={() => photoInputRef.current?.click()}>
                    <Camera className="mr-1 size-3.5" />
                    {t("person.changePhoto")}
                  </Button>
                </>
              )}
            </div>
          </div>

          <Separator />

          {canEditInfo && !readOnly ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="side-birth-date" className="text-xs">{lex.joined}</Label>
                  <Input
                    id="side-birth-date"
                    type="date"
                    max={maxBirthDate}
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="side-death-date" className="text-xs">{lex.left}</Label>
                  <Input
                    id="side-death-date"
                    type="date"
                    value={form.deathDate}
                    onChange={(e) => setForm({ ...form, deathDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="side-birth-place" className="text-xs">{lex.site}</Label>
                <Input
                  id="side-birth-place"
                  value={form.birthPlace}
                  onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                />
              </div>
              {!lex.isOrg && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">{t("person.gender")}</Label>
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
                <div className="flex flex-col gap-1">
                  <Label htmlFor="side-occupation" className="text-xs">{lex.role}</Label>
                  <Input
                    id="side-occupation"
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    placeholder="Directeur commercial"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Label htmlFor="side-biography" className="text-xs">{lex.biography}</Label>
                <Textarea
                  id="side-biography"
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {lex.isOrg && currentTree.Person?.find((p) => p.id === person.id)?.occupation && (
                <>
                  <span className="text-muted-foreground">{lex.role}</span>
                  <span>{currentTree.Person?.find((p) => p.id === person.id)?.occupation}</span>
                </>
              )}
              <span className="text-muted-foreground">{lex.joined}</span>
              <span>{formatDate(person.birthDate) || person.born || "?"}</span>
              {(person.deathDate || person.died) && (
                <>
                  <span className="text-muted-foreground">{lex.left}</span>
                  <span>{formatDate(person.deathDate) || person.died}</span>
                </>
              )}
            </div>
          )}

          <Separator />

          <RelSection
            title={lex.managers}
            readOnly={readOnly}
            addButtonLabel={lex.addManager}
            onAdd={readOnly ? undefined : () => onAddChildRelation(person.id, "parent")}
          >
            {parents.length ? parents.map((p) => renderRelChip(p, "parent")) : <span className="text-xs text-muted-foreground">{t("relations.unknown")}</span>}
          </RelSection>

          {!lex.isOrg && (
            <RelSection
              title={t("relations.spouse")}
              readOnly={readOnly}
              addButtonLabel={t("relations.addButton")}
              onAdd={readOnly ? undefined : () => onAddChildRelation(person.id, "spouse")}
            >
              {spouses.length ? spouses.map((p) => renderRelChip(p, "spouse")) : <span className="text-xs text-muted-foreground">{t("relations.none")}</span>}
            </RelSection>
          )}

          <RelSection
            title={lex.team(children.length)}
            readOnly={readOnly}
            addButtonLabel={lex.addTeamMember}
            childAddMenu={readOnly ? undefined : childrenAddMenu}
          >
            {children.length ? children.map((p) => renderRelChip(p, "child")) : <span className="text-xs text-muted-foreground">{t("relations.none")}</span>}
          </RelSection>

          {!lex.isOrg && siblings.length > 0 && (
            <RelSection title={t("relations.siblings", { count: siblings.length })} readOnly addButtonLabel={t("relations.addButton")}>
              {siblings.map((p) => renderRelChip(p))}
            </RelSection>
          )}

          <Separator />

          {canVersioning && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("history.title")}
                </span>
                <PersonHistory personId={person.id} refreshKey={historyRefresh} onRestored={onPersonRestored} />
              </div>
              <Separator />
            </>
          )}

          <PersonDocuments personId={person.id} readOnly={readOnly} />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t p-4">
        <Button variant="outline" className="w-full" onClick={() => window.__focusOn?.(person.id)}>
          <Focus className="mr-1 size-4" />
          {t("relations.focus")}
        </Button>
        {!readOnly && (
          <>
            <div className="flex gap-2">
              {canEditInfo && onSave && (
                <Button
                  className="flex-1"
                  data-testid="save-person-btn"
                  onClick={handleSave}
                  disabled={saving || !form.firstName.trim()}
                >
                  <Save className="mr-1 size-4" />
                  {saving ? t("common:actions.saving") : t("common:actions.save")}
                </Button>
              )}
              <Button
                className={canEditInfo && onSave ? "flex-1" : "w-full"}
                variant={canEditInfo && onSave ? "outline" : "default"}
                onClick={() => onAddRelation(person)}
              >
                {t("relations.link")}
              </Button>
            </div>
            <Button variant="destructive" className="w-full" onClick={() => onDelete(person.id)}>
              <Trash2 className="mr-1 size-4" />
              {t("common:actions.delete")}
            </Button>
          </>
        )}
      </div>
    </>
  )
}

export function SidePanel(props: SidePanelProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && props.onClose()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[85vh] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-full"
        >
          <SidePanelContent {...props} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l bg-background">
      <SidePanelContent {...props} />
    </aside>
  )
}
