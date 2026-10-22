import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PersonCard } from '@/components/family-tree/person-card'
import { buildConnections, computeLayout, normalizePersons } from '@/utils/tree-layout'
import { getCardDimensions, buildCardHeights, contentBounds, drawingBounds, fitViewport, isFinitePoint } from '@/lib/tree-geometry'
import type { Positions } from '@/lib/tree-geometry'
import type { Person, Relationship } from '@/types'
import { getMaxGeneration } from '@/lib/generation-level'
import { resolveOrgLexicon } from '@/lib/org-lexicon'
import { cn } from '@/lib/utils'

interface MarketingTreePreviewProps {
  persons: Person[]; relationships: Relationship[]; initialPositions?: Positions
  isOrg?: boolean; highlightPersonId?: string; header?: ReactNode; className?: string
}
export function MarketingTreePreview({ persons, relationships, initialPositions, isOrg = false, highlightPersonId, header, className }: MarketingTreePreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null), headerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0, top: 0 })
  const people = useMemo(() => normalizePersons(persons, relationships), [persons, relationships])
  const { w, h } = getCardDimensions('square', { organization: isOrg })
  const heights = useMemo(() => buildCardHeights(people, 'square', isOrg), [people, isOrg])
  const positions = useMemo(() => {
    const computed = computeLayout(people, 'vertical', 'spacious', { organization: isOrg }).positions
    // Never drop people when a decorative fixed layout is missing an entry.
    return Object.fromEntries(people.map(p => [p.id, isFinitePoint(initialPositions?.[p.id]) ? initialPositions![p.id] : computed[p.id]]))
  }, [people, isOrg, initialPositions])
  const connections = useMemo(() => buildConnections(people, positions, 'elbow', 'vertical', w, h, heights), [people, positions, w, h, heights])
  const bounds = useMemo(() => drawingBounds(contentBounds(positions, people.map(p => p.id), w, h, heights), connections, 8), [people, positions, w, h, heights, connections])
  const view = fitViewport(bounds, size.width || 400, size.height || 300, size.top, 24)
  const lexicon = useMemo(() => isOrg ? resolveOrgLexicon(null) : null, [isOrg])
  const maxGeneration = getMaxGeneration(people)
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const r = wrap.getBoundingClientRect(), top = headerRef.current?.getBoundingClientRect().height || 0
      setSize(prev => prev.width === r.width && prev.height === r.height && prev.top === top ? prev : { width: r.width, height: r.height, top })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [header])
  return <div ref={wrapRef} data-testid="marketing-tree-preview" className={cn('relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/20 shadow-lg', className)} aria-hidden="true">
    {header && <div ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 z-10 border-b bg-background/90 px-3 py-2 text-xs backdrop-blur-sm">{header}</div>}
    <div className="absolute inset-0 z-[1]" style={{ transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.scale})`, transformOrigin: '0 0' }}>
      <svg className="pointer-events-none absolute z-[1]" viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} width={bounds.width} height={bounds.height} style={{ left: bounds.minX, top: bounds.minY }}>
        {connections.map((c, i) => <path key={i} d={c.path} fill="none" stroke={c.kind === 'spouse' ? 'var(--muted-foreground)' : 'var(--primary)'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={c.kind === 'spouse' ? '6 4' : undefined} opacity={.95} />)}
      </svg>
      {people.map(p => positions[p.id] && <PersonCard key={p.id} person={p} pos={positions[p.id]} scale={view.scale} cardStyle="square" isOrg={isOrg} maxGeneration={maxGeneration} lexicon={lexicon} selected={p.id === highlightPersonId} highlight={p.id === highlightPersonId} />)}
    </div>
  </div>
}
