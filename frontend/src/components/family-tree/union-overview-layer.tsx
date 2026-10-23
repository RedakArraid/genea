import { useTranslation } from 'react-i18next'
import type { UnionOverview } from '@/utils/union-overview'
import { personName } from '@/lib/family-model'

/** Color complements the person cards and family enclosure. No extra union card. */
export const UNION_TONES = [
  'text-sky-700 dark:text-sky-300', 'text-violet-700 dark:text-violet-300',
  'text-amber-800 dark:text-amber-300', 'text-teal-700 dark:text-teal-300',
  'text-rose-700 dark:text-rose-300', 'text-slate-700 dark:text-slate-300',
]

export function UnionOverviewLayer({ scene }: { scene: UnionOverview; onSelect: (id: string) => void }) {
  const { i18n } = useTranslation()
  const en = i18n.resolvedLanguage?.startsWith('en')
  return <>
    {scene.panels.map(panel => {
      const f = panel.family
      const parents = f.parents.map(personName).join(' + ')
      const children = f.children.map(personName).join(', ')
      const description = `Parents : ${parents}. ${en ? 'Children' : 'Enfants'} : ${children || (en ? 'None recorded' : 'Aucun enfant renseign\u00e9')}`
      return <div key={f.key} className={UNION_TONES[panel.color]}>
        <div data-testid="union-lane" data-family-key={f.key} data-parent-ids={f.parents.map(p => p.id).join(',')} data-child-ids={f.children.map(p => p.id).join(',')}
          data-junction-x={panel.junction.x} data-junction-y={panel.junction.y} role="group" aria-label={description}
          className="pointer-events-none absolute z-0 rounded-2xl border" style={{ left: panel.x, top: panel.y, width: panel.width, height: panel.height, borderColor: 'color-mix(in srgb, currentColor 30%, transparent)', background: 'color-mix(in srgb, currentColor 5%, var(--background))' }} />
        {panel.unknown && <div data-testid="unknown-coparent" className="pointer-events-none absolute z-[2] flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background p-3 text-center text-muted-foreground" style={{ left: panel.unknown.x, top: panel.unknown.y, width: panel.unknown.width, height: panel.unknown.height }}>
          <span className="text-2xl" aria-hidden="true">?</span><span className="text-xs leading-5">{en ? 'Other parent not recorded' : 'Autre parent non renseign\u00e9'}</span>
        </div>}
      </div>
    })}
    {scene.shared.map(({ person, count }) => {
      const p = scene.positions[person.id]
      return <div key={person.id} data-testid="shared-parent-label" className="pointer-events-none absolute z-[3] w-[220px] rounded-full border bg-background px-3 py-1 text-center text-[11px] font-medium text-foreground" style={{ left: p.x - 12, top: p.y - 32 }}>{en ? `Shared parent in ${count} groups` : `Parent commun \u00e0 ${count} groupes`}</div>
    })}
    {scene.unlinkedBox && <div className="pointer-events-none absolute z-0 rounded-xl border border-dashed border-muted-foreground/40" style={{ left: scene.unlinkedBox.x, top: scene.unlinkedBox.y, width: scene.unlinkedBox.width, height: scene.unlinkedBox.height }}>
      <p className="absolute inset-x-2 top-2 text-center text-[10px] font-medium text-muted-foreground">{en ? 'No recorded links' : 'Sans lien renseign\u00e9'}</p>
    </div>}
  </>
}
