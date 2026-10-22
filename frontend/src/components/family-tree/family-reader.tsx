import { useMemo } from 'react'
import { ArrowRight, Link2, Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { NormalizedPerson } from '@/types'
import { readingFamilies, filterReadingFamilies } from '@/lib/family-reading'
import { personName } from '@/lib/family-model'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FamilyReaderProps {
  people: NormalizedPerson[]
  visibleIds: Set<string>
  filtered: boolean
  selectedId: string | null
  readOnly: boolean
  onSelect: (id: string) => void
  onAdd: (parentId?: string | null, relType?: string | null, parent2Id?: string | null) => void
  onLink?: (ids: string[]) => void
}

export function FamilyReader({ people, visibleIds, filtered, selectedId, readOnly, onSelect, onAdd, onLink }: FamilyReaderProps) {
  const { t } = useTranslation('family')
  const data = useMemo(() => readingFamilies(people), [people])
  const groups = filtered ? filterReadingFamilies(data.groups, visibleIds) : data.groups
  const unlinked = data.unlinked.filter(person => !filtered || visibleIds.has(person.id))
  const personButton = (person: NormalizedPerson) => {
    const count = data.occurrences.get(person.id) || 1
    return <button key={person.id} type="button" data-testid="family-reader-person" data-person-id={person.id}
      aria-label={personName(person)} aria-pressed={selectedId === person.id} onClick={() => onSelect(person.id)}
      className={cn('flex min-h-16 w-full min-w-0 items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === person.id && 'border-primary ring-1 ring-primary')}>
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold" aria-hidden="true">
        {person.photoUrl ? <AuthenticatedImage src={person.photoUrl} alt="" className="size-full object-cover" fallback={<span>{person.given.slice(0, 1)}</span>} /> : person.given.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span data-testid="reader-person-name" className="block text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{personName(person)}</span>
        {person.born != null && <span className="block text-xs leading-5 text-muted-foreground">{person.born}{person.died != null ? ` - ${person.died}` : ''}</span>}
        {count > 1 && <span className="block text-xs leading-5 text-muted-foreground">{t('reader.sharedPerson', { count })}</span>}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  }
  return <div data-testid="family-reader" className="@container h-full overflow-y-auto overscroll-contain bg-muted/20" data-no-pan>
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <header className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="size-5" />{t('reader.title')}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t('reader.help')}</p>
        <p className="text-xs font-medium text-muted-foreground">{t('reader.summary', { people: people.length, groups: data.groups.length })}</p>
        {filtered && <p role="status" className="rounded-md border bg-background p-3 text-sm">{t('reader.filterContext')}</p>}
      </header>
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 @min-[800px]:grid-cols-2">
        {groups.map(group => <section key={group.key} data-testid="reading-family" data-family-key={group.key} aria-labelledby={`family-title-${group.label}`}
          className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
          <header className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
            <h3 id={`family-title-${group.label}`} className="flex items-center gap-2 text-sm font-semibold"><span className="rounded bg-foreground px-2 py-1 text-xs text-background">{group.label}</span>{t(group.partnersOnly ? 'reader.partners' : 'reader.parents')}</h3>
            <span className="text-xs text-muted-foreground">{t('reader.children', { count: group.children.length })}</span>
          </header>
          <div className="flex flex-col gap-4 p-4">
            <div data-testid="reader-parents" className="grid min-w-0 grid-cols-1 gap-2 @min-[440px]:grid-cols-2">
              {group.parents.map(personButton)}
              {!group.partnersOnly && group.parents.length === 1 && <div className="flex min-h-16 items-center rounded-lg border border-dashed p-3 text-sm leading-5 text-muted-foreground">{t('unknownParent')}</div>}
            </div>
            <div className="border-t pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('reader.childrenOfTheseParents')}</h4>
              <div data-testid="reader-children" className="grid gap-2">{group.children.map(personButton)}</div>
              {!group.children.length && <p className="text-sm leading-6 text-muted-foreground">{t('reader.noChildren')}</p>}
            </div>
            {!readOnly && group.parents.length <= 2 && <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button variant="outline" size="sm" className="min-h-10 h-auto whitespace-normal text-left" onClick={() => onAdd(group.parents[0].id, 'child', group.parents[1]?.id)}><Plus className="size-4 shrink-0" />{t('reader.addChild')}</Button>
              {onLink && <Button variant="ghost" size="sm" className="min-h-10 h-auto whitespace-normal" onClick={() => onLink(group.parents.map(p => p.id))}><Link2 className="size-4 shrink-0" />{t('reader.linkChild')}</Button>}
            </div>}
          </div>
        </section>)}
      </div>
      {unlinked.length > 0 && <section data-testid="reader-unlinked" className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold">{t('reader.unlinked')}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{t('reader.unlinkedHelp')}</p>
        <div className="grid grid-cols-1 gap-2 @min-[600px]:grid-cols-2">{unlinked.map(personButton)}</div>
      </section>}
      {!groups.length && !unlinked.length && <p role="status" className="py-8 text-center text-sm text-muted-foreground">{t('reader.empty')}</p>}
    </div>
  </div>
}
