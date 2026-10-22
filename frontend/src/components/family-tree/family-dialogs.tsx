import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FamilyTree, NormalizedPerson } from '@/types'
import { useTreeLexicon } from '@/hooks/use-tree-lexicon'
import { useStorageConfig, photoMaxBytes } from '@/hooks/use-storage-config'
import { todayIsoDate, validateBirthDate } from '@/lib/person-dates'
import { canLinkChild, personName } from '@/lib/family-model'
import { familyErrorMessage } from '@/lib/family-api'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const NONE = '__unknown__'
const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm'
function OtherParent({ people, parentId, value, onChange }: {
  people: NormalizedPerson[]; parentId: string; value: string; onChange: (id: string) => void
}) {
  const { t } = useTranslation('family')
  const parent = people.find(p => p.id === parentId)
  const candidates = [...people].filter(p => p.id !== parentId).sort((a, b) =>
    Number(parent?.spouseIds.includes(b.id)) - Number(parent?.spouseIds.includes(a.id)) || personName(a).localeCompare(personName(b)))
  return <div className="flex flex-col gap-1.5">
    <Label htmlFor="family-other-parent">{t('otherParent')}</Label>
    <select id="family-other-parent" data-testid="family-other-parent" className={selectClass} value={value} onChange={e => onChange(e.target.value)} required>
      <option value="" disabled>{t('chooseParent')}</option>
      <option value={NONE}>{t('unknownParent')}</option>
      {candidates.map(p => <option key={p.id} value={p.id}>{personName(p)}</option>)}
    </select>
    <p className="text-xs text-muted-foreground">{t('parentChoiceHelp')}</p>
  </div>
}
function ParentSummary({ ids, people }: { ids: string[]; people: NormalizedPerson[] }) {
  const { t } = useTranslation('family')
  return <p data-testid="family-parent-summary" className="rounded-md bg-muted p-2 text-sm">
    {t('selectedParents')}: {ids.map(id => { const p = people.find(p => p.id === id); return p ? personName(p) : '?' }).join(' + ')}
    {ids.length === 1 ? ` (${t('oneKnownParent')})` : ''}
  </p>
}
interface AddPersonDialogProps {
  open: boolean; onClose: () => void
  onSubmit: (data: Record<string, string>, relToId?: string | null, relType?: string | null, relToId2?: string | null, photoFile?: File | null) => Promise<void>
  treeName: string; treeId: string; people: NormalizedPerson[]
  parentId?: string | null; parent2Id?: string | null; relationType?: string | null
  treeLexicon?: Pick<FamilyTree, 'treeType' | 'orgLexicon'>
}
export function AddPersonDialog({ open, onClose, onSubmit, treeName, treeId, people, parentId, parent2Id, relationType, treeLexicon }: AddPersonDialogProps) {
  const { t } = useTranslation(['tree', 'family', 'common'])
  const lex = useTreeLexicon(treeLexicon), storage = useStorageConfig()
  const [form, setForm] = useState<Record<string, string>>({})
  const [otherParent, setOtherParent] = useState('')
  const [photo, setPhoto] = useState<File | null>(null), [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const needsParents = relationType === 'child' && !!parentId && !lex.isOrg
  useEffect(() => {
    if (!open) return
    setForm({ firstName: '', lastName: treeName.split(' ').pop() || '', birthDate: '', deathDate: '', birthPlace: '', occupation: '', biography: '', gender: '', clientRequestId: crypto.randomUUID() })
    setOtherParent(parent2Id || ''); setPhoto(null); setError('')
  }, [open, treeId, parentId, parent2Id, relationType, treeName])
  useEffect(() => {
    if (!photo) { setPreview(null); return }
    const url = URL.createObjectURL(photo); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])
  const chosenParents = parentId ? [parentId, ...(otherParent && otherParent !== NONE ? [otherParent] : [])] : []
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current || !form.firstName?.trim() || needsParents && !otherParent) return
    const birthError = validateBirthDate(form.birthDate || '')
    if (birthError) { setError(birthError); return }
    submitting.current = true; setBusy(true); setError('')
    try {
      await onSubmit(form, parentId, relationType, needsParents && otherParent !== NONE ? otherParent : null, photo)
    } catch (err) { setError(familyErrorMessage(err)) }
    finally { submitting.current = false; setBusy(false) }
  }
  const field = (name: string, label: string, type = 'text') => <div className="flex flex-col gap-1.5">
    <Label htmlFor={`family-${name}`}>{label}</Label>
    <Input id={`family-${name}`} data-testid={`family-${name}`} type={type} max={name === 'birthDate' ? todayIsoDate() : undefined}
      required={name === 'firstName'} value={form[name] || ''} onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))} />
  </div>
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose() }}>
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{lex.addTitle}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-3">
          {needsParents && <>
            <OtherParent people={people} parentId={parentId!} value={otherParent} onChange={setOtherParent} />
            {otherParent && <ParentSummary ids={chosenParents} people={people} />}
          </>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field('firstName', lex.firstNameRequired)}{field('lastName', lex.lastName)}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field('birthDate', lex.joined, 'date')}{field('deathDate', lex.left, 'date')}</div>
          {field('birthPlace', lex.site)}
          {!lex.isOrg && <div className="flex flex-col gap-1.5">
            <Label htmlFor="family-gender">{t('person.gender')}</Label>
            <select id="family-gender" className={selectClass} value={form.gender || ''} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}>
              <option value="">{t('person.genderSelect')}</option>
              <option value="male">{t('person.genderMale')}</option><option value="female">{t('person.genderFemale')}</option><option value="other">{t('person.genderOther')}</option>
            </select>
          </div>}
          {lex.isOrg && <div className="flex flex-col gap-1.5"><Label htmlFor="family-occupation">{lex.role}</Label><Textarea id="family-occupation" value={form.occupation || ''} onChange={e => setForm(prev => ({ ...prev, occupation: e.target.value }))} /></div>}
          <div className="flex flex-col gap-1.5"><Label htmlFor="family-biography">{lex.biography}</Label><Textarea id="family-biography" value={form.biography || ''} onChange={e => setForm(prev => ({ ...prev, biography: e.target.value }))} /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="family-photo">{t('person.photo')}</Label>
            {preview && <img src={preview} alt={t('person.photoPreview')} className="size-14 rounded object-cover" />}
            <Input id="family-photo" type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0] || null
              if (file && file.size > photoMaxBytes(storage)) { setError(t('person.photoTooBig', { max: storage.limits?.photoMaxMb ?? 5 })); e.target.value = ''; return }
              setPhoto(file); setError('')
            }} />
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" data-testid="family-save" disabled={busy || !form.firstName?.trim() || needsParents && !otherParent}>{busy ? t('dialogs.adding') : t('common:actions.add')}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}

export function LinkExistingChildDialog({ open, onClose, parentIds, people, onSubmit, organization = false }: {
  open: boolean; onClose: () => void; parentIds: string[]; people: NormalizedPerson[]; organization?: boolean
  onSubmit: (childId: string, parents: string[]) => Promise<void>
}) {
  const { t } = useTranslation(['tree', 'family', 'common'])
  const [other, setOther] = useState(parentIds[1] || (organization ? NONE : ''))
  const [child, setChild] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const submitting = useRef(false)
  const parents = useMemo(() => [parentIds[0], ...(other && other !== NONE ? [other] : [])], [parentIds, other])
  const candidates = useMemo(() => people.filter(p => canLinkChild(p, parents, people, organization)), [people, parents, organization])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current || !child || !other || !candidates.some(p => p.id === child)) return
    submitting.current = true; setBusy(true); setError('')
    try { await onSubmit(child, parents) } catch (err) { setError(familyErrorMessage(err)) }
    finally { submitting.current = false; setBusy(false) }
  }
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose() }}><DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
    <DialogHeader><DialogTitle>{t('dialogs.linkChildTitle')}</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="flex flex-col gap-3">
      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-3">
        {!organization && <OtherParent people={people} parentId={parentIds[0]} value={other} onChange={value => { setOther(value); setChild('') }} />}
        {other && <><ParentSummary ids={parents} people={people} /><Label htmlFor="family-existing-child">{t('dialogs.linkChildSelect')}</Label>
          <select id="family-existing-child" data-testid="family-existing-child" className={selectClass} value={child} onChange={e => setChild(e.target.value)} required>
            <option value="" disabled>{t('dialogs.choosePlaceholder')}</option>{candidates.map(p => <option key={p.id} value={p.id}>{personName(p)}</option>)}
          </select><p className="text-xs text-muted-foreground">{t('family:existingChildHelp')}</p></>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>{t('common:actions.cancel')}</Button>
        <Button type="submit" data-testid="family-link-save" disabled={busy || !child || !other}>{t('dialogs.linkChildSubmit')}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}
