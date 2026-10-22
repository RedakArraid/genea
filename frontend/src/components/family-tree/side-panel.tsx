import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { X, Focus, Trash2, Camera, Save, Copy, ClipboardPaste } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FamilyTree, NormalizedPerson, Person } from '@/types'
import { todayIsoDate, validateBirthDate } from '@/lib/person-dates'
import { formatLongDate } from '@/lib/format'
import { siblingGroups, childrenByParents, personName } from '@/lib/family-model'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PersonDocuments } from './person-documents'
import { PersonHistory } from './person-history'
import { ChildAddMenu } from './child-add-menu'
import { useTreeLexicon } from '@/hooks/use-tree-lexicon'
import { formatGenerationBadge, getMaxGeneration } from '@/lib/generation-level'
import { useIsMobile } from '@/hooks/use-mobile'
import { FEATURES } from '@/lib/features'
import type { SubtreeClipboardState } from '@/lib/subtree-clipboard'
import { modShortcutLabel } from '@/lib/keyboard'

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
  canUploadDocuments?: boolean
  canCopySubtree?: boolean
  canPasteSubtree?: boolean
  subtreeClipboard?: SubtreeClipboardState | null
  subtreeBusy?: boolean
  onCopyBranch?: () => void
  onCopyEntireTree?: () => void
  onPasteAsChild?: () => void
  onPasteAsSpouse?: () => void
  onStartCanvasPaste?: () => void
}
function personToForm(person: NormalizedPerson, raw?: Person) {
  return {
    firstName: person.given || '', lastName: person.sur && person.sur !== '-' ? person.sur : '',
    birthDate: person.birthDate?.split('T')[0] || '', birthPlace: person.place || '',
    deathDate: person.deathDate?.split('T')[0] || '', gender: raw?.gender || '',
    occupation: raw?.occupation || '', biography: raw?.biography || person.bio?.fr || '',
  }
}
interface RelSectionProps {
  title: string; readOnly?: boolean; onAdd?: () => void; addButtonLabel: string
  childAddMenu?: { onNewChild: () => void; onLinkExisting: () => void; newChildLabel?: string; linkExistingLabel?: string }
  children: React.ReactNode
}
function RelSection({ title, readOnly, onAdd, childAddMenu, children, addButtonLabel }: RelSectionProps) {
  return <div className="flex flex-col gap-2" data-testid={childAddMenu ? 'family-children' : undefined}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
      {!readOnly && childAddMenu && <ChildAddMenu {...childAddMenu} />}
      {!readOnly && onAdd && !childAddMenu && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onAdd}>{addButtonLabel}</Button>}
    </div>
    <div className="flex flex-wrap gap-1">{children}</div>
  </div>
}
interface RelChipProps {
  person: NormalizedPerson; relative: NormalizedPerson; relType?: string; relId?: string | null; readOnly?: boolean
  onSelect: SidePanelProps['onSelect']; onDeleteRelation: SidePanelProps['onDeleteRelation']
  onAddChildRelation: SidePanelProps['onAddChildRelation']; onLinkExistingChild: SidePanelProps['onLinkExistingChild']
}
function RelChip({ person, relative, relType, relId, readOnly, onSelect, onDeleteRelation, onAddChildRelation, onLinkExistingChild }: RelChipProps) {
  const { t } = useTranslation('common')
  return <div className="inline-flex max-w-full items-center gap-1" data-relative-id={relative.id}>
    <Button variant="outline" size="sm" className="min-h-8 h-auto min-w-0 whitespace-normal break-words text-left text-xs" onClick={() => onSelect(relative.id)}>{personName(relative)}</Button>
    {!readOnly && relType === 'spouse' && <ChildAddMenu compact
      onNewChild={() => onAddChildRelation(person.id, 'child', relative.id)}
      onLinkExisting={() => onLinkExistingChild([person.id, relative.id])} />}
    {!readOnly && relId && <Button variant="ghost" size="icon" className="size-7 text-destructive" aria-label={t('actions.delete')} onClick={() => onDeleteRelation(relId)}><X className="size-3" /></Button>}
  </div>
}
function SidePanelContent({
  person, people, currentTree, onClose, onSelect, onSave, onChangePhoto, onAddRelation,
  onAddChildRelation, onLinkExistingChild, onDelete, onDeleteRelation, readOnly = false,
  canEditInfo = true, canChangePhoto = false, canVersioning = false, onPersonRestored,
  canUploadDocuments = true, canCopySubtree = false, canPasteSubtree = false,
  subtreeClipboard = null, subtreeBusy = false, onCopyBranch, onCopyEntireTree,
  onPasteAsChild, onPasteAsSpouse, onStartCanvasPaste,
}: SidePanelProps) {
  const { t } = useTranslation(['tree', 'family', 'common'])
  const lex = useTreeLexicon(currentTree)
  const maxGeneration = useMemo(() => getMaxGeneration(people), [people])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => personToForm(person, currentTree.Person?.find(p => p.id === person.id)))
  const [saving, setSaving] = useState(false), [historyRefresh, setHistoryRefresh] = useState(0)
  useEffect(() => { setForm(personToForm(person, currentTree.Person?.find(p => p.id === person.id))) }, [person, currentTree.Person])
  const byId = Object.fromEntries(people.map(p => [p.id, p]))
  const parents = person.parentIds.map(id => byId[id]).filter(Boolean)
  const spouses = person.spouseIds.map(id => byId[id]).filter(Boolean)
  const children = people.filter(p => p.parentIds.includes(person.id))
  const siblingSets = siblingGroups(person, people)
  const childSets = childrenByParents(person.id, people)
  const photoFallback = <div className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">{(person.given[0] || '?').toUpperCase()}</div>
  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onChangePhoto) return
    try { await onChangePhoto(person.id, file); toast.success(t('person.photoUpdated')) }
    catch { toast.error(t('person.photoUploadFailed')) }
    finally { e.target.value = '' }
  }
  const handleSave = async () => {
    if (!onSave || !form.firstName.trim() || saving) return
    const error = validateBirthDate(form.birthDate)
    if (error) { toast.error(error); return }
    setSaving(true)
    try {
      await onSave(person.id, { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() || '-' })
      toast.success(t('person.updated')); setHistoryRefresh(n => n + 1)
    } catch { toast.error(t('person.updateFailed')) }
    finally { setSaving(false) }
  }
  const findRelId = (relativeId: string, kind: string) => currentTree.Relationship?.find(r => {
    if (kind === 'spouse') return r.type === 'spouse' && (r.sourceId === person.id && r.targetId === relativeId || r.sourceId === relativeId && r.targetId === person.id)
    const parent = kind === 'parent' ? relativeId : person.id
    const child = kind === 'parent' ? person.id : relativeId
    return r.type === 'parent' && r.sourceId === parent && r.targetId === child || r.type === 'child' && r.sourceId === child && r.targetId === parent
  })?.id
  // A generic child action never picks the first spouse; the dialog requires a choice.
  const handleNewChild = useCallback(() => onAddChildRelation(person.id, 'child'), [person.id, onAddChildRelation])
  const handleLinkChild = useCallback(() => onLinkExistingChild([person.id]), [person.id, onLinkExistingChild])
  const childMenu = useMemo(() => ({ onNewChild: handleNewChild, onLinkExisting: handleLinkChild,
    newChildLabel: lex.newTeamMember, linkExistingLabel: lex.linkExistingTeamMember }), [handleNewChild, handleLinkChild, lex.newTeamMember, lex.linkExistingTeamMember])
  const chip = (relative: NormalizedPerson, relType?: string) => <RelChip key={relative.id} person={person} relative={relative}
    relType={relType} relId={relType ? findRelId(relative.id, relType) : null} readOnly={readOnly}
    onSelect={onSelect} onDeleteRelation={onDeleteRelation} onAddChildRelation={onAddChildRelation} onLinkExistingChild={onLinkExistingChild} />
  const editable = canEditInfo && !readOnly
  const textField = (key: keyof typeof form, label: string, type = 'text') => <div className="flex flex-col gap-1">
    <Label htmlFor={`side-${key}`} className="text-xs">{label}</Label>
    <Input id={`side-${key}`} data-testid={key === 'firstName' ? 'edit-first-name' : undefined} type={type}
      max={key === 'birthDate' ? todayIsoDate() : undefined} value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} />
  </div>
  return <>
    <div data-testid="person-panel-heading" className="flex shrink-0 items-center justify-between gap-3 border-b bg-background p-4">
      <div className="min-w-0 flex-1"><h2 className="mb-1 text-sm font-semibold [overflow-wrap:anywhere]">{personName(person)}</h2>
      <Badge variant="secondary">{formatGenerationBadge(person.generation, { isOrg: lex.isOrg, maxGeneration, lexicon: lex.config })}</Badge></div>
      <Button variant="ghost" size="icon" aria-label={t('family:reader.close')} onClick={onClose}><X className="size-4" /></Button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"><div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">{person.photoUrl ? <AuthenticatedImage src={person.photoUrl} alt={person.given} className="size-full object-cover" fallback={photoFallback} /> : photoFallback}</div>
        <div className="min-w-0 flex-1">
          {editable ? <div className="flex flex-col gap-2">{textField('firstName', lex.firstName)}{textField('lastName', lex.lastName)}</div> : <>
            <h2 className="text-lg font-semibold">{personName(person)}</h2>
            <p className="text-sm text-muted-foreground">{person.born || '?'}-{person.died || ''}{person.place ? ` - ${person.place}` : ''}</p>
          </>}
          {canChangePhoto && onChangePhoto && <><input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
            <Button variant="outline" size="sm" className="mt-2 h-7" onClick={() => photoInputRef.current?.click()}><Camera className="mr-1 size-3.5" />{t('person.changePhoto')}</Button></>}
        </div>
      </div>
      <Separator />
      {editable ? <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{textField('birthDate', lex.joined, 'date')}{textField('deathDate', lex.left, 'date')}</div>
        {textField('birthPlace', lex.site)}
        {!lex.isOrg && <div className="flex flex-col gap-1"><Label className="text-xs">{t('person.gender')}</Label>
          <Select value={form.gender || undefined} onValueChange={value => value && setForm(prev => ({ ...prev, gender: value }))}>
            <SelectTrigger><SelectValue placeholder={t('person.genderSelect')} /></SelectTrigger><SelectContent>
              <SelectItem value="male">{t('person.genderMale')}</SelectItem><SelectItem value="female">{t('person.genderFemale')}</SelectItem><SelectItem value="other">{t('person.genderOther')}</SelectItem>
            </SelectContent></Select>
        </div>}
        {lex.isOrg && <div className="flex flex-col gap-1"><Label htmlFor="side-occupation" className="text-xs">{lex.role}</Label>
          <Textarea id="side-occupation" value={form.occupation} onChange={e => setForm(prev => ({ ...prev, occupation: e.target.value }))} className="min-h-10" /></div>}
        <div className="flex flex-col gap-1"><Label htmlFor="side-biography" className="text-xs">{lex.biography}</Label>
          <Textarea id="side-biography" value={form.biography} onChange={e => setForm(prev => ({ ...prev, biography: e.target.value }))} className="min-h-16" /></div>
      </div> : <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {lex.isOrg && person.occupation && <><span className="text-muted-foreground">{lex.role}</span><span>{person.occupation}</span></>}
        <span className="text-muted-foreground">{lex.joined}</span><span>{formatLongDate(person.birthDate || '') || person.born || '?'}</span>
        {(person.deathDate || person.died) && <><span className="text-muted-foreground">{lex.left}</span><span>{formatLongDate(person.deathDate || '') || person.died}</span></>}
      </div>}
      <Separator />
      <RelSection title={lex.managers} readOnly={readOnly} addButtonLabel={lex.addManager} onAdd={() => onAddChildRelation(person.id, 'parent')}>
        {parents.length ? parents.map(p => chip(p, 'parent')) : <span className="text-xs text-muted-foreground">{t('relations.unknown')}</span>}
      </RelSection>
      {!lex.isOrg && <RelSection title={t('relations.spouse')} readOnly={readOnly} addButtonLabel={t('relations.addButton')} onAdd={() => onAddChildRelation(person.id, 'spouse')}>
        {spouses.length ? spouses.map(p => chip(p, 'spouse')) : <span className="text-xs text-muted-foreground">{t('relations.none')}</span>}
      </RelSection>}
      <RelSection title={lex.team(children.length)} readOnly={readOnly} addButtonLabel={lex.addTeamMember} childAddMenu={childMenu}>
        {!children.length ? <span className="text-xs text-muted-foreground">{t('relations.none')}</span> : lex.isOrg ? children.map(p => chip(p, 'child')) :
          childSets.map(group => <div key={JSON.stringify(group.otherParentIds)} className="flex w-full flex-col gap-1" data-testid="family-child-group">
            <span className="text-xs text-muted-foreground">{group.otherParentIds.length ? t('family:withParent', { name: group.otherParentIds.map(id => byId[id] ? personName(byId[id]) : '?').join(' + ') }) : t('family:unknownParent')}</span>
            <div className="flex flex-wrap gap-1">{group.children.map(p => chip(p, 'child'))}</div>
          </div>)}
      </RelSection>
      {!lex.isOrg && (['full', 'half', 'uncertain'] as const).map(kind => siblingSets[kind].length ?
        <div key={kind} data-testid={`siblings-${kind}`}><RelSection title={t(`family:${kind}`)} readOnly addButtonLabel={t('relations.addButton')}>
          {siblingSets[kind].map(p => chip(p))}
        </RelSection></div> : null)}
      <Separator />
      {canVersioning && <><div className="flex flex-col gap-2"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('history.title')}</span>
        <PersonHistory personId={person.id} refreshKey={historyRefresh} onRestored={onPersonRestored} /></div><Separator /></>}
      {FEATURES.documentsEnabled && <><PersonDocuments personId={person.id} readOnly={readOnly || !canUploadDocuments} />
        {!readOnly && !canUploadDocuments && <p className="text-xs text-muted-foreground">{t('documents.planUpgradeHint')}</p>}</>}
    </div></div>
    <div className="flex max-h-[40%] shrink-0 flex-col gap-2 overflow-y-auto border-t p-4">
      {(canCopySubtree || canPasteSubtree) && <div className="flex flex-col gap-2">
        {subtreeClipboard && <p className="text-center text-xs text-muted-foreground">{t('subtree.clipboardLabel', { count: subtreeClipboard.personCount })}</p>}
        {canCopySubtree && <div className="grid min-w-0 grid-cols-1 gap-2">
          <Button variant="outline" className="min-h-10 h-auto w-full min-w-0 whitespace-normal text-left" disabled={subtreeBusy} title={`${t('subtree.shortcuts.copyBranch')} (${modShortcutLabel('c')})`} onClick={onCopyBranch}><Copy className="mr-1 size-4" />{t('subtree.copyBranch')}</Button>
          <Button variant="outline" className="min-h-10 h-auto w-full min-w-0 whitespace-normal text-left" disabled={subtreeBusy} title={`${t('subtree.shortcuts.copyEntire')} (${modShortcutLabel('c', { shift: true })})`} onClick={onCopyEntireTree}><Copy className="mr-1 size-4" />{t('subtree.copyEntire')}</Button>
        </div>}
        {canPasteSubtree && subtreeClipboard && <><div className="grid min-w-0 grid-cols-1 gap-2">
          <Button variant="secondary" className="min-h-10 h-auto w-full min-w-0 whitespace-normal text-left" disabled={subtreeBusy} onClick={onPasteAsChild}><ClipboardPaste className="mr-1 size-4" />{t('subtree.pasteAsChild')}</Button>
          {!lex.isOrg && <Button variant="secondary" className="min-h-10 h-auto w-full min-w-0 whitespace-normal text-left" disabled={subtreeBusy} onClick={onPasteAsSpouse}><ClipboardPaste className="mr-1 size-4" />{t('subtree.pasteAsSpouse')}</Button>}
        </div><Button variant="outline" className="w-full" disabled={subtreeBusy} onClick={onStartCanvasPaste}>{t('subtree.pasteOnCanvas')}</Button></>}
      </div>}
      <Button variant="outline" className="w-full" onClick={() => window.__focusOn?.(person.id)}><Focus className="mr-1 size-4" />{t('relations.focus')}</Button>
      {!readOnly && <><div className="flex gap-2">
        {canEditInfo && onSave && <Button className="flex-1" data-testid="save-person-btn" onClick={handleSave} disabled={saving || !form.firstName.trim()}><Save className="mr-1 size-4" />{saving ? t('common:actions.saving') : t('common:actions.save')}</Button>}
        <Button className={canEditInfo && onSave ? 'flex-1' : 'w-full'} variant={canEditInfo && onSave ? 'outline' : 'default'} onClick={() => onAddRelation(person)}>{t('relations.link')}</Button>
      </div><Button variant="destructive" className="w-full" onClick={() => onDelete(person.id)}><Trash2 className="mr-1 size-4" />{t('common:actions.delete')}</Button></>}
    </div>
  </>
}
export function SidePanel(props: SidePanelProps) {
  const isMobile = useIsMobile()
  return isMobile ? <Sheet open onOpenChange={open => !open && props.onClose()}>
    <SheetContent side="bottom" showCloseButton={false} className="flex h-[85vh] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-full"><SidePanelContent {...props} /></SheetContent>
  </Sheet> : <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l bg-background"><SidePanelContent {...props} /></aside>
}
