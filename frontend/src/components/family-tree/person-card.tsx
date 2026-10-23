import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatGenerationBadge } from '@/lib/generation-level'
import { AuthenticatedImage } from '@/components/ui/authenticated-image'
import { getCardDimensions, getPersonCardHeight, getCompactCardDimensions } from '@/lib/tree-geometry'
import type { NormalizedPerson, PersonTone, OrgLexiconConfig } from '@/types'

const TONE_STYLES: Record<PersonTone, { bg: string; fg: string }> = {
  stone: { bg: 'bg-stone-100 dark:bg-stone-800', fg: 'text-stone-700 dark:text-stone-100' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-950', fg: 'text-rose-700 dark:text-rose-100' },
  ocean: { bg: 'bg-sky-100 dark:bg-sky-950', fg: 'text-sky-700 dark:text-sky-100' },
  sage: { bg: 'bg-emerald-100 dark:bg-emerald-950', fg: 'text-emerald-700 dark:text-emerald-100' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-950', fg: 'text-amber-700 dark:text-amber-100' },
  plum: { bg: 'bg-violet-100 dark:bg-violet-950', fg: 'text-violet-700 dark:text-violet-100' },
}
interface PersonCardProps {
  person: NormalizedPerson; pos: { x: number; y: number }; scale: number
  cardStyle?: string; compact?: boolean; isOrg?: boolean; maxGeneration?: number; lexicon?: OrgLexiconConfig | null
  hidePhotos?: boolean; hideDates?: boolean; hidePlaces?: boolean
  selected?: boolean; dragging?: boolean; dim?: boolean; highlight?: boolean
  onSelect?: (id: string) => void
  onDrag?: (id: string, pos: { x: number; y: number }) => void
  onDragStart?: () => void; onDragEnd?: () => void; onHover?: (id: string | null) => void
}
export function PersonCard({ person, pos, scale, cardStyle = 'square', compact = false, isOrg = false, maxGeneration, lexicon,
  hidePhotos = false, hideDates = false, hidePlaces = false, selected = false, dragging = false,
  dim = false, highlight = false, onSelect, onDrag, onDragStart, onDragEnd, onHover }: PersonCardProps) {
  const tone = isOrg ? TONE_STYLES[person.tone] || TONE_STYLES.stone : TONE_STYLES.stone
  const { w } = compact ? getCompactCardDimensions() : getCardDimensions(cardStyle, { organization: isOrg })
  const height = compact ? getCompactCardDimensions().h : getPersonCardHeight(person, cardStyle, isOrg)
  const fullName = `${person.given}${person.sur && person.sur !== '-' ? ` ${person.sur}` : ''}`
  const initials = `${(person.given || '?')[0].toUpperCase()}${person.sur && person.sur !== '-' ? person.sur[0].toUpperCase() : ''}`
  const lifespan = `${person.born ?? '?'}${person.died != null ? `\u2013${person.died}` : person.born != null ? '\u2013' : ''}`
  const role = person.occupation?.trim() || '-'
  const horizontal = cardStyle === 'horizontal', round = cardStyle === 'round', minimal = cardStyle === 'minimal'
  const [photoFailed, setPhotoFailed] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  useEffect(() => { setPhotoFailed(false) }, [person.photoUrl])
  useEffect(() => () => cleanupRef.current?.(), [])

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || !onSelect && !onDrag) return
    cleanupRef.current?.()
    const touch = event.pointerType === 'touch' || event.pointerType === 'pen'
    if (touch && !event.isPrimary) return
    if (!touch) { event.stopPropagation(); event.preventDefault() }
    const id = event.pointerId, x = event.clientX, y = event.clientY
    let moved = false, started = false, cancelled = false
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      if (Math.hypot(e.clientX - x, e.clientY - y) > (touch ? 8 : 4)) moved = true
      if (moved && !touch && onDrag) {
        if (!started) { started = true; onDragStart?.() }
        onDrag(person.id, { x: pos.x + (e.clientX - x) / scale, y: pos.y + (e.clientY - y) / scale })
      }
    }
    const otherPointer = (e: PointerEvent) => { if (e.pointerId !== id) cancelled = true }
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      window.removeEventListener('pointerdown', otherPointer)
      cleanupRef.current = null
      if (started) { started = false; onDragEnd?.() }
    }
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      if (e.type !== 'pointercancel' && !moved && !cancelled) onSelect?.(person.id)
      cleanup()
    }
    cleanupRef.current = cleanup
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    window.addEventListener('pointerdown', otherPointer)
  }
  const badge = !isOrg || lexicon?.showLevelOnCard !== false
  return (
    <div
      data-testid="tree-person-card" data-compact={compact || undefined} data-person-id={person.id} data-card-style={cardStyle} data-generation={person.generation}
      role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}
      aria-label={fullName} aria-pressed={onSelect ? selected : undefined}
      className={cn('tree-person-card absolute z-[2] flex select-none rounded-lg border bg-card text-card-foreground shadow-sm transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-primary',
        horizontal && !compact ? 'flex-row gap-2 p-2' : 'flex-col', onDrag ? 'cursor-grab active:cursor-grabbing' : onSelect ? 'cursor-pointer' : '',
        dragging && 'z-[30]', selected && 'ring-2 ring-primary', highlight && !selected && 'ring-2 ring-primary/50', dim && 'opacity-75')}
      style={{ left: pos.x, top: pos.y, width: w, height, minHeight: height }}
      onPointerDown={onPointerDown} onDragStart={e => e.preventDefault()}
      onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); onSelect(person.id) } }}
      onMouseEnter={() => onHover?.(person.id)} onMouseLeave={() => onHover?.(null)}
    >
      {compact ? <div className="flex h-full items-center gap-2 px-2" title={fullName}>
        <div className={cn('relative size-7 shrink-0 overflow-hidden rounded-full', tone.bg)}>
          {!hidePhotos && person.photoUrl && !photoFailed ? <AuthenticatedImage src={person.photoUrl} alt="" draggable={false} className="size-full object-cover" onError={() => setPhotoFailed(true)} fallback={<span className="flex size-full items-center justify-center text-[10px]">{initials}</span>} />
            : <span className={cn('flex size-full items-center justify-center text-[10px] font-medium', tone.fg)}>{initials}</span>}
        </div>
        <div data-card-content className="min-w-0 flex-1">
          <p data-person-name className="line-clamp-2 text-[13px] font-semibold leading-4 [overflow-wrap:anywhere]">{fullName}</p>
          {badge && <p className="text-[10px] leading-3 text-muted-foreground">{formatGenerationBadge(person.generation, { isOrg, maxGeneration, lexicon })}</p>}
        </div>
      </div> : <>
      {!minimal && (
        <div className={cn('relative shrink-0 overflow-hidden', tone.bg,
          horizontal ? 'size-16 rounded-md' : round ? 'mx-auto mt-2 size-14 rounded-full' : isOrg ? 'h-[128px] rounded-t-lg' : 'h-20 rounded-t-lg')}>
          {badge && <span className="absolute left-1 top-1 z-10 rounded bg-background/90 px-1 text-[10px] font-medium text-foreground">
            {formatGenerationBadge(person.generation, { isOrg, maxGeneration, lexicon })}
          </span>}
          {!hidePhotos && person.photoUrl && !photoFailed ? (
            <AuthenticatedImage src={person.photoUrl} alt={fullName} draggable={false}
              className="pointer-events-none size-full object-cover" onError={() => setPhotoFailed(true)}
              fallback={<div className={cn('flex size-full items-center justify-center text-lg font-semibold', tone.fg)}>{initials}</div>} />
          ) : <div className={cn('flex size-full items-center justify-center text-lg font-semibold', tone.fg)}>{initials}</div>}
        </div>
      )}
      <div data-card-content className={cn('min-w-0 flex-1', horizontal ? 'self-center' : 'p-2', isOrg ? 'flex flex-col gap-0.5' : '')}>
        <p className={cn('text-xs font-semibold leading-4', isOrg ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'truncate')} title={fullName}>{fullName}</p>
        {isOrg ? <p data-card-role className="whitespace-pre-wrap text-[10px] leading-[14px] text-muted-foreground [overflow-wrap:anywhere]" title={role}>{role}</p> : <>
          {!hideDates && <p className="text-[10px] leading-[14px] text-muted-foreground">{lifespan}</p>}
          {!hidePlaces && person.place && <p className="truncate text-[10px] leading-[14px] text-muted-foreground" title={person.place}>{person.place}</p>}
        </>}
      </div>
      </>}
    </div>
  )
}
