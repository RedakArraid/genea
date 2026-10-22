import { useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react'
import { Plus, Search, Settings, Share2, LayoutGrid, Maximize2, MoreVertical, UserPlus, Link2, FileDown, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonCard } from './person-card'
import { buildConnections, computeLineage } from '@/utils/tree-layout'
import { getCardDimensions, buildCardHeights, contentBounds, drawingBounds, fitViewport, zoomAt, screenToWorld, visiblePeople, MIN_ZOOM, MAX_ZOOM } from '@/lib/tree-geometry'
import type { Point, Positions } from '@/lib/tree-geometry'
import type { NormalizedPerson, TreeTweaks, FamilyTree } from '@/types'
import type { TreeBackgroundConfig } from '@/lib/tree-background'
import { isTreeBackgroundActive, buildViewportBackgroundStyle } from '@/lib/tree-background'
import { useProtectedMediaUrl } from '@/hooks/use-protected-media-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { isOrganizationTree } from '@/lib/tree-type'
import { getMaxGeneration, formatLevelFilterLabel } from '@/lib/generation-level'
import { resolveOrgLexicon } from '@/lib/org-lexicon'

interface TreeCanvasProps {
  people: NormalizedPerson[]; tweaks: TreeTweaks
  treeMeta?: Pick<FamilyTree, 'treeType' | 'orgLexicon'>; background?: TreeBackgroundConfig | null
  positions: Positions; setPositions: React.Dispatch<React.SetStateAction<Positions>>
  selectedId: string | null; onSelect: (id: string) => void; hoverId: string | null; onHover: (id: string | null) => void
  canvasW?: number; canvasH?: number
  onOpenAdd: (parentId?: string | null, relType?: string | null, parent2Id?: string | null) => void
  onLinkExistingChild?: (parentIds: string[]) => void
  onOpenShare: () => void; onOpenTweaks: () => void; onSetTweak: (key: keyof TreeTweaks, val: string | boolean) => void
  searchQuery: string; onSearchChange: (q: string) => void; onReorganize?: () => void; fitRequestId?: number
  readOnly?: boolean; canDrag?: boolean; isDemo?: boolean; canShare?: boolean; canExport?: boolean; canExportGedcom?: boolean; canImport?: boolean
  exportBusy?: boolean; importBusy?: boolean; onExportGedcom?: () => void; onExportPdf?: () => void; onImportGedcom?: (file: File) => void
  onCardDragStateChange?: (dragging: boolean, pending?: { id: string; x: number; y: number }) => void
  pasteMode?: boolean; onPasteAtCanvas?: (anchor: Point) => void
}
type View = { pan: Point; scale: number }
type Gesture = { start: Point[]; view: View; moved: boolean; paste: boolean }

export function TreeCanvas({ people = [], tweaks, treeMeta, background, positions, setPositions, selectedId, onSelect, hoverId, onHover,
  onOpenAdd, onLinkExistingChild, onOpenShare, onOpenTweaks, onSetTweak, searchQuery, onSearchChange, onReorganize,
  fitRequestId = 0, readOnly = false, canDrag = true, isDemo = false, canShare = true, canExport = false, canExportGedcom = true,
  canImport = false, exportBusy = false, importBusy = false, onExportGedcom, onExportPdf, onImportGedcom,
  onCardDragStateChange, pasteMode = false, onPasteAtCanvas }: TreeCanvasProps) {
  const { t, i18n } = useTranslation('tree')
  const en = i18n.resolvedLanguage?.startsWith('en')
  const wrapRef = useRef<HTMLDivElement>(null), toolbarRef = useRef<HTMLDivElement>(null), importRef = useRef<HTMLInputElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0, top: 56 })
  const [view, setView] = useState<View>({ pan: { x: 40, y: 80 }, scale: 0.85 })
  const viewRef = useRef(view), positionsRef = useRef(positions)
  positionsRef.current = positions
  const updateView = useCallback((next: View) => { viewRef.current = next; setView(next) }, [])
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false)
  const [panning, setPanning] = useState(false), [draggingId, setDraggingId] = useState<string | null>(null)
  const pointers = useRef(new Map<number, Point>()), gesture = useRef<Gesture | null>(null)
  const draggingRef = useRef(false), dragFrame = useRef<number | null>(null), pendingDrag = useRef<{ id: string; x: number; y: number } | null>(null)
  const lastFit = useRef('')
  const isOrg = isOrganizationTree(treeMeta)
  const orgLexicon = useMemo(() => isOrg ? resolveOrgLexicon(treeMeta) : null, [isOrg, treeMeta])
  const layout = tweaks.layout || 'vertical', style = tweaks.cardStyle || 'square', genFilter = tweaks.generation || 'all'
  const compact = viewport.width < 1120
  const { w: cardW, h: cardH } = getCardDimensions(style, { organization: isOrg })
  const heights = useMemo(() => buildCardHeights(people, style, isOrg), [people, style, isOrg])
  const visible = useMemo(() => visiblePeople(people, searchQuery, genFilter), [people, searchQuery, genFilter])
  const visibleIds = useMemo(() => new Set(visible.map(p => p.id)), [visible])
  const connections = useMemo(() => buildConnections(visible, positions, tweaks.connStyle, layout, cardW, cardH, heights), [visible, positions, tweaks.connStyle, layout, cardW, cardH, heights])
  const bounds = useMemo(() => drawingBounds(contentBounds(positions, visibleIds, cardW, cardH, heights), connections, 8), [positions, visibleIds, cardW, cardH, heights, connections])
  const lineage = useMemo(() => hoverId ? computeLineage(hoverId, people) : null, [hoverId, people])
  const maxGens = useMemo(() => getMaxGeneration(people), [people])
  const generationOptions = useMemo(() => [{ value: 'all', label: isOrg ? t('org.canvas.allLevels') : t('canvas.allGenerations') },
    ...Array.from({ length: maxGens }, (_, i) => ({ value: String(i + 1), label: isOrg && orgLexicon ? formatLevelFilterLabel(i + 1, maxGens, orgLexicon) : t('canvas.generationLabel', { num: i + 1 }) }))], [maxGens, isOrg, orgLexicon, t])
  const layoutLabels = { vertical: t('canvas.layoutVertical'), horizontal: t('canvas.layoutHorizontal'), radial: t('canvas.layoutRadial') }
  const backgroundUrl = useProtectedMediaUrl(isTreeBackgroundActive(background) ? background?.imageUrl : null)
  const showBackground = isTreeBackgroundActive(background) && !!backgroundUrl

  useLayoutEffect(() => {
    const wrap = wrapRef.current, toolbar = toolbarRef.current
    if (!wrap || !toolbar) return
    const measure = () => {
      const rect = wrap.getBoundingClientRect(), top = toolbar.getBoundingClientRect().height
      setViewport(prev => prev.width === rect.width && prev.height === rect.height && prev.top === top ? prev : { width: rect.width, height: rect.height, top })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wrap); observer.observe(toolbar)
    return () => observer.disconnect()
  }, [])
  const fitToView = useCallback(() => {
    if (!visible.length || viewport.width <= 0 || viewport.height <= viewport.top) return
    updateView(fitViewport(bounds, viewport.width, viewport.height, viewport.top))
  }, [bounds, viewport, visible.length, updateView])
  const fitKey = `${layout}/${tweaks.density}/${style}/${genFilter}/${searchQuery}/${fitRequestId}/${viewport.width}/${viewport.height}/${viewport.top}/${visible.map(p => `${p.id}:${heights[p.id]}:${!!positions[p.id]}`).sort().join(',')}`
  useLayoutEffect(() => {
    if (draggingRef.current || pointers.current.size || lastFit.current === fitKey || !visible.length || viewport.width <= 0) return
    lastFit.current = fitKey
    fitToView()
  }, [fitKey, fitToView, visible.length, viewport.width])

  const zoom = useCallback((factor: number, anchor?: Point) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const origin = anchor || { x: rect.width / 2, y: viewport.top + (rect.height - viewport.top) / 2 }
    updateView(zoomAt(viewRef.current.pan, viewRef.current.scale, viewRef.current.scale * factor, origin))
  }, [updateView, viewport.top])
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-no-pan]') || !e.deltaY) return
      e.preventDefault()
      const r = wrap.getBoundingClientRect()
      zoom(e.deltaY > 0 ? 0.92 : 1.08, { x: e.clientX - r.left, y: e.clientY - r.top })
    }
    wrap.addEventListener('wheel', wheel, { passive: false })
    return () => wrap.removeEventListener('wheel', wheel)
  }, [zoom])

  const localPoint = (e: React.PointerEvent): Point => {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const rebaseGesture = (paste = false) => {
    gesture.current = { start: [...pointers.current.values()].slice(0, 2), view: viewRef.current, moved: false, paste }
  }
  const pointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || draggingRef.current) return
    const target = e.target as HTMLElement
    if (target.closest('[data-no-pan],button,input,textarea,a,select,[role="combobox"]')) return
    const onCard = !!target.closest('.tree-person-card')
    if (onCard && e.pointerType === 'mouse') return
    e.preventDefault()
    pointers.current.set(e.pointerId, localPoint(e))
    e.currentTarget.setPointerCapture(e.pointerId)
    rebaseGesture(pasteMode && !onCard && pointers.current.size === 1)
  }
  const pointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, localPoint(e))
    const current = [...pointers.current.values()].slice(0, 2), g = gesture.current
    if (current.length !== g.start.length) { rebaseGesture(); return }
    if (current.length === 1) {
      const dx = current[0].x - g.start[0].x, dy = current[0].y - g.start[0].y
      if (Math.hypot(dx, dy) < 4 && !g.moved) return
      g.moved = true; setPanning(true)
      updateView({ scale: g.view.scale, pan: { x: g.view.pan.x + dx, y: g.view.pan.y + dy } })
    } else if (current.length === 2) {
      const midpoint = (a: Point[]) => ({ x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 })
      const distance = (a: Point[]) => Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y)
      const world = screenToWorld(midpoint(g.start), g.view.pan, g.view.scale)
      const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, g.view.scale * distance(current) / Math.max(1, distance(g.start))))
      const at = midpoint(current)
      g.moved = true; g.paste = false; setPanning(true)
      updateView({ scale, pan: { x: at.x - world.x * scale, y: at.y - world.y * scale } })
    }
  }
  const pointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const g = gesture.current
    if (e.type === 'pointerup' && g?.paste && !g.moved) onPasteAtCanvas?.(screenToWorld(localPoint(e), viewRef.current.pan, viewRef.current.scale))
    pointers.current.delete(e.pointerId)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (pointers.current.size) rebaseGesture()
    else { gesture.current = null; setPanning(false) }
  }
  const onCardDrag = useCallback((id: string, pos: Point) => {
    pendingDrag.current = { id, ...pos }
    if (dragFrame.current !== null) return
    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null
      const p = pendingDrag.current
      if (p) setPositions(prev => ({ ...prev, [p.id]: { x: p.x, y: p.y } }))
    })
  }, [setPositions])
  const onCardDragEnd = useCallback(() => {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current)
    dragFrame.current = null
    const pending = pendingDrag.current
    if (pending) setPositions(prev => ({ ...prev, [pending.id]: { x: pending.x, y: pending.y } }))
    pendingDrag.current = null; draggingRef.current = false; setDraggingId(null)
    onCardDragStateChange?.(false, pending || undefined)
  }, [setPositions, onCardDragStateChange])
  useEffect(() => () => { if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current) }, [])
  useEffect(() => {
    const focus = (id: string) => {
      const pos = positionsRef.current[id], r = wrapRef.current?.getBoundingClientRect()
      if (!pos || !r) return
      const s = viewRef.current.scale
      updateView({ scale: s, pan: { x: r.width / 2 - (pos.x + cardW / 2) * s, y: viewport.top + (r.height - viewport.top) / 2 - (pos.y + (heights[id] || cardH) / 2) * s } })
    }
    window.__focusOn = focus
    return () => { if (window.__focusOn === focus) window.__focusOn = undefined }
  }, [cardW, cardH, heights, viewport.top, updateView])

  const runAction = (action: () => void) => { setMobileToolbarOpen(false); queueMicrotask(action) }
  const canReorganize = !!onReorganize && people.length > 0 && (!readOnly || isDemo)
  const generationPlaceholder = isOrg ? orgLexicon?.levelTerm || t('org.canvas.levelPlaceholder') : t('canvas.generationPlaceholder')
  const actions = (inMenu: boolean) => <>
    <Button size="sm" variant="outline" disabled={!canReorganize} onClick={() => runAction(() => onReorganize?.())} title={t('canvas.reorganizeTitle')}><LayoutGrid className="mr-1 size-4" />{t('canvas.reorganize')}</Button>
    <Button size="sm" variant="outline" data-testid="tree-fit" onClick={() => runAction(fitToView)}><Maximize2 className="mr-1 size-4" />{t('canvas.center')}</Button>
    <Button size="sm" variant="ghost" aria-label={t('canvas.settings')} onClick={() => runAction(onOpenTweaks)}><Settings className="size-4" />{inMenu && t('canvas.settings')}</Button>
    {canImport && onImportGedcom && <Button size="sm" variant="outline" disabled={importBusy} onClick={() => runAction(() => importRef.current?.click())}><Upload className="mr-1 size-4" />{t('canvas.importGedcom')}</Button>}
    {canExport && (onExportPdf || canExportGedcom && onExportGedcom) && (inMenu ? <>
      {canExportGedcom && onExportGedcom && <Button size="sm" variant="outline" disabled={exportBusy} onClick={() => runAction(onExportGedcom)}><FileDown className="mr-1 size-4" />{t('canvas.exportGedcom')}</Button>}
      {onExportPdf && <Button data-testid="tree-export-pdf" size="sm" variant="outline" disabled={exportBusy} onClick={() => runAction(onExportPdf)}><FileDown className="mr-1 size-4" />{t('canvas.exportPdf')}</Button>}
    </> : <DropdownMenu modal={false}>
      <DropdownMenuTrigger data-testid="tree-export-menu" render={<Button size="sm" variant="outline" disabled={exportBusy} />}><FileDown className="mr-1 size-4" />{t('canvas.export')}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" positionMethod="fixed">
        {canExportGedcom && onExportGedcom && <DropdownMenuItem disabled={exportBusy} onClick={onExportGedcom}>{t('canvas.exportGedcom')}</DropdownMenuItem>}
        {onExportPdf && <DropdownMenuItem data-testid="tree-export-pdf" disabled={exportBusy} onClick={onExportPdf}>{t('canvas.exportPdf')}</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>)}
    {!readOnly && canShare && <Button size="sm" variant="outline" onClick={() => runAction(onOpenShare)}><Share2 className="mr-1 size-4" />{t('canvas.share')}</Button>}
    {!readOnly && <Button size="sm" onClick={() => runAction(() => onOpenAdd())}><Plus className="mr-1 size-4" />{t('canvas.add')}</Button>}
  </>

  return <div ref={wrapRef} data-testid="tree-viewport" className={cn('relative size-full touch-none overscroll-none overflow-hidden', !showBackground && 'bg-muted/20', panning && 'cursor-grabbing', pasteMode && 'cursor-crosshair')}
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}>
    <div ref={toolbarRef} data-no-pan data-testid="tree-toolbar" data-toolbar-mode={compact ? 'compact' : 'full'} className="absolute inset-x-0 top-0 z-10 flex min-w-0 items-center gap-2 border-b bg-background/95 p-2 backdrop-blur">
      <div className={cn('relative min-w-0 flex-1', !compact && 'max-w-[180px]')}>
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input data-testid="tree-search" aria-label={t('canvas.searchPlaceholder')} className="min-w-0 pl-8" placeholder={t('canvas.searchPlaceholder')} value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
      </div>
      {compact ? <>
        <Button data-testid="tree-toolbar-menu" size="sm" variant="outline" aria-label={t('canvas.toolbarMenu')} onClick={() => setMobileToolbarOpen(true)}><MoreVertical className="size-4" /></Button>
        <Sheet open={mobileToolbarOpen} onOpenChange={setMobileToolbarOpen}>
          <SheetContent side="bottom" className="max-h-[85svh] gap-0 overflow-y-auto p-0">
            <SheetHeader className="border-b px-4 py-3"><SheetTitle>{t('canvas.toolbarMenu')}</SheetTitle></SheetHeader>
            <div className="grid gap-2 p-4" data-no-pan>
              <p className="text-sm font-medium">{generationPlaceholder}</p>
              <div className="flex flex-wrap gap-1">{generationOptions.map(opt => <Button key={opt.value} size="sm" variant={genFilter === opt.value ? 'default' : 'outline'} onClick={() => runAction(() => onSetTweak('generation', opt.value))}>{opt.label}</Button>)}</div>
              <p className="text-sm font-medium">{t('canvas.layoutLabel')}</p>
              <div className="flex flex-wrap gap-1">{(['vertical','horizontal','radial'] as const).map(l => <Button key={l} data-testid={`layout-${l}`} size="sm" variant={layout === l ? 'default' : 'outline'} onClick={() => runAction(() => onSetTweak('layout', l))}>{layoutLabels[l]}</Button>)}</div>
              {actions(true)}
            </div>
          </SheetContent>
        </Sheet>
      </> : <>
        <Select value={genFilter} onValueChange={v => v && onSetTweak('generation', v)}><SelectTrigger size="sm" className="w-[160px]" aria-label={generationPlaceholder}><SelectValue placeholder={generationPlaceholder} /></SelectTrigger><SelectContent className="max-h-64">{generationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
        <div className="flex shrink-0 gap-1">{(['vertical','horizontal','radial'] as const).map(l => <Button key={l} data-testid={`layout-${l}`} size="sm" aria-label={layoutLabels[l]} title={layoutLabels[l]} variant={layout === l ? 'default' : 'outline'} onClick={() => onSetTweak('layout', l)}>{l === 'vertical' ? '\u2193' : l === 'horizontal' ? '\u2192' : '\u25ce'}</Button>)}</div>
        {actions(false)}
      </>}
    </div>
    {showBackground && background && backgroundUrl && <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" style={{ ...buildViewportBackgroundStyle(background, backgroundUrl), top: viewport.top }} />
      {background.overlay && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 bg-background opacity-50" style={{ top: viewport.top }} />}
    </>}
    {/* One world origin for cards, SVG, wheel, focus and paste. No second toolbar offset. */}
    <div data-testid="tree-world" className="absolute inset-0 z-[1]" style={{ transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.scale})`, transformOrigin: '0 0' }}>
      <svg className="tree-connections pointer-events-none absolute z-[1]" viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} width={bounds.width} height={bounds.height} style={{ left: bounds.minX, top: bounds.minY }}>
        {connections.map((c, i) => <path key={i} data-connection-kind={c.kind} data-connection-ids={c.ids.join(',')} d={c.path} fill="none" stroke={c.kind === 'spouse' ? 'var(--muted-foreground)' : 'var(--primary)'} strokeWidth={lineage && c.ids.every(id => lineage.has(id)) ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={c.kind === 'spouse' ? '6 4' : undefined} opacity={lineage && !c.ids.every(id => lineage.has(id)) ? .2 : .95} />)}
      </svg>
      {visible.map(p => positions[p.id] && <PersonCard key={p.id} person={p} pos={positions[p.id]} scale={view.scale} cardStyle={style} isOrg={isOrg} maxGeneration={maxGens} lexicon={orgLexicon}
        hidePhotos={tweaks.hidePhotos} hideDates={tweaks.hideDates} hidePlaces={tweaks.hidePlaces} selected={selectedId === p.id} dragging={draggingId === p.id}
        dim={!!lineage && !lineage.has(p.id)} highlight={!!lineage?.has(p.id)} onSelect={onSelect} onHover={onHover}
        onDrag={canDrag ? onCardDrag : undefined} onDragStart={canDrag ? () => { draggingRef.current = true; setDraggingId(p.id); onCardDragStateChange?.(true) } : undefined} onDragEnd={canDrag ? onCardDragEnd : undefined} />)}
      {!readOnly && !isOrg && connections.filter(c => c.kind === 'spouse').map((c, i) => <div key={`add-${i}`} className="pointer-events-none absolute z-[10]" style={{ left: c.midX, top: c.midY }} data-no-pan>
        <DropdownMenu modal={false}><DropdownMenuTrigger render={<button type="button" aria-label={t('canvas.addChild')} className="pointer-events-auto flex size-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-primary font-bold text-primary-foreground shadow" />}>+</DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="z-[200]">
            <DropdownMenuItem onClick={() => queueMicrotask(() => onOpenAdd(c.ids[0], 'child', c.ids[1]))}><UserPlus className="size-4" />{t('relations.newChild')}</DropdownMenuItem>
            {onLinkExistingChild && <DropdownMenuItem onClick={() => queueMicrotask(() => onLinkExistingChild([c.ids[0], c.ids[1]]))}><Link2 className="size-4" />{t('relations.linkExistingChild')}</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>)}
    </div>
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-lg border bg-background p-1 shadow" data-no-pan>
      <Button size="sm" variant="ghost" aria-label={en ? 'Zoom in' : 'Agrandir'} data-testid="tree-zoom-in" onClick={() => zoom(1.15)}>+</Button>
      <span className="px-2 text-center text-xs" data-testid="tree-zoom">{view.scale < .1 ? (view.scale * 100).toFixed(1) : Math.round(view.scale * 100)}%</span>
      <Button size="sm" variant="ghost" aria-label={en ? 'Zoom out' : 'R\u00e9duire'} onClick={() => zoom(1 / 1.15)}>{'\u2212'}</Button>
      <Button size="sm" variant="ghost" aria-label={t('canvas.centerTree')} onClick={fitToView}><Maximize2 className="size-4" /></Button>
    </div>
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">{visible.length} / {people.length}</div>
    {!visible.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center" style={{ paddingTop: viewport.top }}>
      <div className="rounded-lg bg-background/90 p-4 text-muted-foreground">
        <p className="font-medium">{people.length ? t('canvas.noResults', { defaultValue: en ? 'No matching people' : 'Aucune personne correspondante' }) : t('canvas.emptyTree')}</p>
        {people.length ? <Button className="pointer-events-auto mt-2" variant="outline" size="sm" data-no-pan onClick={() => { onSearchChange(''); onSetTweak('generation', 'all') }}>{en ? 'Clear filters' : 'Effacer les filtres'}</Button> : <p className="text-sm">{readOnly ? t('canvas.emptyReadOnly') : t('canvas.emptyEditable')}</p>}
      </div>
    </div>}
    <input ref={importRef} type="file" accept=".ged,text/plain" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) onImportGedcom?.(file); e.target.value = '' }} />
  </div>
}
