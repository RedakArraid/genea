import { useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react'
import { Plus, Search, Settings, Share2, LayoutGrid, Maximize2, MoreVertical, FileDown, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PersonCard } from './person-card'
import { FamilyReader } from './family-reader'
import { UnionOverviewLayer, UNION_TONES } from './union-overview-layer'
import { computeUnionOverview } from '@/utils/union-overview'
import { unionReadingView } from '@/utils/union-viewport'
import type { UnionConnection } from '@/utils/union-overview'
import { readableConnections } from '@/utils/readable-connections'
import { readingFamilies } from '@/lib/family-reading'
import { personName } from '@/lib/family-model'
import { hasMultipleFamilies, familyKey } from '@/utils/family-routing'
import { buildConnections, computeLineage, computeLayout } from '@/utils/tree-layout'
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
  treeMeta?: Pick<FamilyTree, 'treeType' | 'orgLexicon'> & { id?: string }; background?: TreeBackgroundConfig | null
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

export function TreeCanvas({ people = [], tweaks, treeMeta, background, positions: savedPositions, setPositions, selectedId, onSelect, hoverId, onHover,
  onOpenAdd, onLinkExistingChild, onOpenShare, onOpenTweaks, onSetTweak, searchQuery, onSearchChange, onReorganize,
  fitRequestId = 0, readOnly = false, canDrag = true, isDemo = false, canShare = true, canExport = false, canExportGedcom = true,
  canImport = false, exportBusy = false, importBusy = false, onExportGedcom, onExportPdf, onImportGedcom,
  onCardDragStateChange, pasteMode = false, onPasteAtCanvas }: TreeCanvasProps) {
  const { t, i18n } = useTranslation(['tree', 'family'])
  const en = i18n.resolvedLanguage?.startsWith('en')
  const wrapRef = useRef<HTMLDivElement>(null), toolbarRef = useRef<HTMLDivElement>(null), importRef = useRef<HTMLInputElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0, top: 56 })
  const [view, setView] = useState<View>({ pan: { x: 40, y: 80 }, scale: 0.85 })
  const viewRef = useRef(view), positionsRef = useRef(savedPositions)
  const updateView = useCallback((next: View) => { viewRef.current = next; setView(next) }, [])
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false)
  const [panning, setPanning] = useState(false), [draggingId, setDraggingId] = useState<string | null>(null)
  const pointers = useRef(new Map<number, Point>()), gesture = useRef<Gesture | null>(null)
  const draggingRef = useRef(false), dragFrame = useRef<number | null>(null), pendingDrag = useRef<{ id: string; x: number; y: number } | null>(null)
  const lastFit = useRef('')
  const focusRequest = useRef<string | null>(null)
  const [focusVersion, setFocusVersion] = useState(0)
  const isOrg = isOrganizationTree(treeMeta)
  const orgLexicon = useMemo(() => isOrg ? resolveOrgLexicon(treeMeta) : null, [isOrg, treeMeta])
  const layout = tweaks.layout || 'vertical', style = tweaks.cardStyle || 'square', genFilter = tweaks.generation || 'all'
  const compact = viewport.width < 1280
  const presentationKey = `geneamap:tree-presentation:v1:${treeMeta?.id || 'preview'}`
  const [presentation, setPresentation] = useState<string | null>(() => {
    try { return localStorage.getItem(presentationKey) } catch { return null }
  })
  const multipleUnions = useMemo(() => hasMultipleFamilies(people), [people])
  const unionModeKey = `geneamap:union-layout:v1:${treeMeta?.id || 'preview'}`
  const [unionMode, setUnionMode] = useState(() => { try { return localStorage.getItem(unionModeKey) !== 'free' } catch { return true } })
  const chooseUnionMode = (enabled: boolean) => {
    setUnionMode(enabled)
    try { localStorage.setItem(unionModeKey, enabled ? 'unions' : 'free') } catch { /* Optional preference only. */ }
    if (enabled && layout === 'radial') onSetTweak('layout', 'vertical')
  }
  const reading = !pasteMode && !isOrg && (presentation === 'families' || presentation !== 'graph' && (viewport.width < 768 && !multipleUnions))
  const choosePresentation = (value: 'families' | 'graph') => {
    setPresentation(value)
    try { localStorage.setItem(presentationKey, value) } catch { /* Private browsing can disable storage. */ }
  }
  const familyData = useMemo(() => readingFamilies(people), [people])
  const [familyScope, setFamilyScope] = useState('all')
  const [activeUnion, setActiveUnion] = useState<string | undefined>()
  const hasLargeSiblings = familyData.groups.some(f => f.children.length >= 5)
  const narrowUnion = viewport.width > 0 && viewport.width < 768
  const scopedFamily = familyData.groups.find(group => group.key === familyScope)
  const scopedIds = useMemo(() => !reading && !pasteMode && scopedFamily ? new Set([...scopedFamily.parents, ...scopedFamily.children].map(p => p.id)) : null, [reading, pasteMode, scopedFamily])
  // The focused family is a temporary projection, not a rewrite of saved coordinates.
  const projection = useMemo(() => scopedIds ? computeLayout(people.filter(p => scopedIds.has(p.id)), layout, tweaks.density, { organization: isOrg, cardStyle: style }).positions : null,
    [scopedIds, people, layout, tweaks.density, isOrg, style])
  const unionScene = useMemo(() => !reading && !pasteMode && !isOrg && !scopedIds && multipleUnions && unionMode
    ? computeUnionOverview(people, layout, style, { narrow: narrowUnion, focusedFamily: activeUnion }) : null, [reading, pasteMode, isOrg, scopedIds, multipleUnions, unionMode, people, layout, style, narrowUnion, activeUnion])
  const positions = projection || unionScene?.positions || savedPositions
  positionsRef.current = positions
  const canMoveCards = canDrag && !projection && !unionScene
  const { w: cardW, h: cardH } = getCardDimensions(style, { organization: isOrg })
  const heights = useMemo(() => buildCardHeights(people, style, isOrg), [people, style, isOrg])
  const matches = useMemo(() => visiblePeople(people, searchQuery, genFilter), [people, searchQuery, genFilter])
  const matchIds = useMemo(() => new Set(matches.map(p => p.id)), [matches])
  const filtering = !!searchQuery.trim() || genFilter !== 'all'
  const visible = useMemo(() => unionScene ? people : matches.filter(p => !scopedIds || scopedIds.has(p.id)), [people, matches, scopedIds, unionScene])
  const visibleIds = useMemo(() => new Set(visible.map(p => p.id)), [visible])
  const routed = useMemo(() => reading ? { connections: [], unresolved: 0 } : unionScene || readableConnections(buildConnections(visible, positions, tweaks.connStyle, layout, cardW, cardH, heights), Object.fromEntries(visible.map(p => [p.id, positions[p.id]]).filter(([, pos]) => !!pos)), cardW, heights), [reading, unionScene, visible, positions, tweaks.connStyle, layout, cardW, cardH, heights])
  const connections = routed.connections
  const bounds = useMemo(() => drawingBounds(unionScene?.bounds || contentBounds(positions, visibleIds, cardW, cardH, heights), connections, 8), [unionScene, positions, visibleIds, cardW, cardH, heights, connections])
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
  const fitKey = `${activeUnion}/${!!unionScene}/${unionMode}/${reading}/${familyScope}/${layout}/${tweaks.density}/${style}/${genFilter}/${searchQuery}/${fitRequestId}/${viewport.width}/${viewport.height}/${viewport.top}/${visible.map(p => `${p.id}:${heights[p.id]}:${!!positions[p.id]}`).sort().join(',')}`
  useLayoutEffect(() => {
    if (reading || draggingRef.current || pointers.current.size || lastFit.current === fitKey || !visible.length || viewport.width <= 0) return
    lastFit.current = fitKey
    const fitted = fitViewport(bounds, viewport.width, viewport.height, viewport.top)
    if (unionScene && hasLargeSiblings) {
      updateView(unionReadingView(unionScene, viewport.width, viewport.height, viewport.top, activeUnion))
    } else if (unionScene && fitted.scale < .85) {
      // Keep names readable. All unions remain present and pannable; overview is an explicit action.
      const first = unionScene.panels[0]
      const scale = .95
      updateView({ scale, pan: { x: viewport.width / 2 - (first.x + first.width / 2) * scale, y: viewport.top + 24 - first.y * scale } })
    } else fitToView()
  }, [fitKey, fitToView, visible.length, viewport, reading, bounds, unionScene, updateView, activeUnion, hasLargeSiblings])

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
      if (reading || (e.target as HTMLElement).closest('[data-no-pan]') || !e.deltaY) return
      e.preventDefault()
      const r = wrap.getBoundingClientRect()
      zoom(e.deltaY > 0 ? 0.92 : 1.08, { x: e.clientX - r.left, y: e.clientY - r.top })
    }
    wrap.addEventListener('wheel', wheel, { passive: false })
    return () => wrap.removeEventListener('wheel', wheel)
  }, [zoom, reading])

  const localPoint = (e: React.PointerEvent): Point => {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const rebaseGesture = (paste = false) => {
    gesture.current = { start: [...pointers.current.values()].slice(0, 2), view: viewRef.current, moved: false, paste }
  }
  const pointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reading || e.button !== 0 || draggingRef.current) return
    // React portals bubble through the component tree, not the DOM tree.
    // Never capture a Select/Menu/Sheet gesture rendered outside this viewport.
    if (!(e.target instanceof Element) || !e.currentTarget.contains(e.target)) return
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
      if (!positionsRef.current[id]) return
      focusRequest.current = id
      setPresentation('graph'); setFamilyScope('all')
      onSearchChange(''); onSetTweak('generation', 'all')
      setFocusVersion(version => version + 1)
    }
    window.__focusOn = focus
    return () => { if (window.__focusOn === focus) window.__focusOn = undefined }
  }, [onSearchChange, onSetTweak])
  // Apply explicit focus after the new mode, filters and toolbar have rendered.
  useLayoutEffect(() => {
    const id = focusRequest.current
    if (!id || reading || !visibleIds.has(id)) return
    const measuredTop = toolbarRef.current?.getBoundingClientRect().height
    if (measuredTop == null || Math.abs(measuredTop - viewport.top) > .5) return
    const pos = positionsRef.current[id], r = wrapRef.current?.getBoundingClientRect()
    if (!pos || !r) return
    focusRequest.current = null
    const scale = Math.max(.9, viewRef.current.scale)
    const size = unionScene?.cardSizes[id] || { w: cardW, h: heights[id] || cardH }
    updateView({ scale, pan: { x: r.width / 2 - (pos.x + size.w / 2) * scale, y: viewport.top + (r.height - viewport.top) / 2 - (pos.y + size.h / 2) * scale } })
  }, [focusVersion, reading, visibleIds, viewport, cardW, cardH, heights, updateView, unionScene])

  const runAction = (action: () => void) => { setMobileToolbarOpen(false); queueMicrotask(action) }
  const canReorganize = !projection && !unionScene && !!onReorganize && people.length > 0 && (!readOnly || isDemo)
  const generationPlaceholder = isOrg ? orgLexicon?.levelTerm || t('org.canvas.levelPlaceholder') : t('canvas.generationPlaceholder')
  const actions = (inMenu: boolean) => <>
    {!reading && <><Button size="sm" variant="outline" disabled={!canReorganize} onClick={() => runAction(() => onReorganize?.())} title={t('canvas.reorganizeTitle')}><LayoutGrid className="mr-1 size-4" />{t('canvas.reorganize')}</Button>
    <Button size="sm" variant="outline" data-testid="tree-fit" disabled={reading} onClick={() => runAction(fitToView)}><Maximize2 className="mr-1 size-4" />{unionScene ? (en ? 'Overview' : 'Vue d’ensemble') : t('canvas.center')}</Button></>}
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

  return <div ref={wrapRef} data-testid="tree-viewport" className={cn('relative size-full overscroll-none overflow-hidden', reading ? 'touch-auto' : 'touch-none', !showBackground && 'bg-muted/20', panning && 'cursor-grabbing', pasteMode && 'cursor-crosshair')}
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}>
    <div ref={toolbarRef} data-no-pan data-testid="tree-toolbar" data-toolbar-mode={compact ? 'compact' : 'full'} className="absolute inset-x-0 top-0 z-10 flex min-w-0 flex-col gap-2 border-b bg-background/95 p-2 backdrop-blur">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className={cn('relative min-w-0 flex-1', !compact && 'min-w-[160px] max-w-[200px]')}>
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input data-testid="tree-search" aria-label={t('canvas.searchPlaceholder')} className="min-w-0 pl-8" placeholder={t('canvas.searchPlaceholder')} value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
      </div>
      {!isOrg && <div role="group" aria-label={t('family:reader.presentation')} className="flex shrink-0 gap-1 rounded-lg bg-muted p-1">
        <Button size="sm" data-testid="view-families" variant={reading ? 'default' : 'ghost'} aria-pressed={reading} onClick={() => choosePresentation('families')}>{t('family:reader.families')}</Button>
        <Button size="sm" data-testid="view-graph" variant={!reading ? 'default' : 'ghost'} aria-pressed={!reading} onClick={() => choosePresentation('graph')}>{t('family:reader.graph')}</Button>
      </div>}
      {compact ? <>
        <Button data-testid="tree-toolbar-menu" size="sm" variant="outline" aria-label={t('canvas.toolbarMenu')} onClick={() => setMobileToolbarOpen(true)}><MoreVertical className="size-4" /></Button>
        <Sheet open={mobileToolbarOpen} onOpenChange={setMobileToolbarOpen}>
          <SheetContent side="bottom" className="max-h-[85svh] gap-0 overflow-y-auto p-0">
            <SheetHeader className="border-b px-4 py-3"><SheetTitle>{t('canvas.toolbarMenu')}</SheetTitle></SheetHeader>
            <div className="grid gap-2 p-4" data-no-pan>
              <p className="text-sm font-medium">{generationPlaceholder}</p>
              <div className="flex flex-wrap gap-1">{generationOptions.map(opt => <Button key={opt.value} size="sm" variant={genFilter === opt.value ? 'default' : 'outline'} onClick={() => runAction(() => onSetTweak('generation', opt.value))}>{opt.label}</Button>)}</div>
              <p className="text-sm font-medium">{t('canvas.layoutLabel')}</p>
              <div className="flex flex-wrap gap-1">{(['vertical','horizontal','radial'] as const).map(l => <Button key={l} data-testid={`layout-${l}`} size="sm" variant={layout === l ? 'default' : 'outline'} onClick={() => runAction(() => { choosePresentation('graph'); onSetTweak('layout', l) })}>{layoutLabels[l]}</Button>)}</div>
              {unionScene && hasLargeSiblings && narrowUnion && <label className="grid gap-1 text-sm">{t('family:reader.familyFilter')}<select data-testid="graph-family-filter-menu" className="h-10 rounded border bg-background px-2" value={familyScope} onChange={e => runAction(() => setFamilyScope(e.target.value))}><option value="all">{t('family:reader.allFamilies')}</option>{familyData.groups.map(f => <option key={f.key} value={f.key}>{f.parents.map(personName).join(' + ')}</option>)}</select></label>}
              {actions(true)}
            </div>
          </SheetContent>
        </Sheet>
      </> : <>
        <Select items={generationOptions} value={genFilter} onValueChange={v => v && onSetTweak('generation', v)}><SelectTrigger data-testid="tree-generation-filter" size="sm" className="w-[200px]" aria-label={generationPlaceholder}><SelectValue placeholder={generationPlaceholder} /></SelectTrigger><SelectContent className="max-h-64">{generationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
        <div className={cn('flex shrink-0 gap-1', reading && 'hidden')}>{(['vertical','horizontal','radial'] as const).map(l => <Button key={l} data-testid={`layout-${l}`} size="sm" aria-label={layoutLabels[l]} title={layoutLabels[l]} variant={layout === l ? 'default' : 'outline'} onClick={() => { choosePresentation('graph'); onSetTweak('layout', l) }}>{l === 'vertical' ? '\u2193' : l === 'horizontal' ? '\u2192' : '\u25ce'}</Button>)}</div>
        {actions(false)}
      </>}
      </div>
      {!reading && !isOrg && multipleUnions && !scopedIds && <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="union-mode-controls">
        <div role="group" aria-label={en ? 'Tree arrangement' : 'Disposition de l’arbre'} className="flex gap-1 rounded-lg bg-muted p-1">
          <Button size="sm" data-testid="graph-unions" variant={unionScene ? 'default' : 'ghost'} aria-pressed={!!unionScene} onClick={() => chooseUnionMode(true)}>{en ? 'By union' : 'Par unions'}</Button>
          <Button size="sm" data-testid="graph-free" variant={!unionScene ? 'default' : 'ghost'} aria-pressed={!unionScene} onClick={() => chooseUnionMode(false)}>{en ? 'Free layout' : 'Placement libre'}</Button>
        </div>
        <span className="hidden text-muted-foreground md:inline">{unionScene ? (en ? 'All unions are connected here. Positions are not chronological.' : 'Toutes les unions sont reliées ici. Leur position ne donne pas leur chronologie.') : (en ? 'Free arrangement, including radial and saved positions.' : 'Disposition libre, dont la vue radiale et vos positions enregistrées.')}</span>
      </div>}
      {!reading && !isOrg && familyData.groups.length > 0 && <div className={cn("flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1", unionScene && hasLargeSiblings && narrowUnion && "hidden")}>
        <label className="flex min-w-0 items-center gap-2 text-xs font-medium">
          <span className="shrink-0">{t('family:reader.familyFilter')}</span>
          <select data-testid="graph-family-filter" className="h-9 min-w-0 max-w-[280px] rounded-md border bg-background px-2 text-sm" value={scopedIds ? familyScope : 'all'} onChange={e => setFamilyScope(e.target.value)}>
            <option value="all">{t('family:reader.allFamilies')}</option>
            {familyData.groups.map(group => <option key={group.key} value={group.key}>{group.label} - {group.parents.map(personName).join(' + ')}</option>)}
          </select>
        </label>
        <p className={cn("text-xs leading-5 text-muted-foreground", unionScene && "hidden md:block")}>{unionScene ? (en ? 'Dotted: parents. Solid: children. Rows in one frame are siblings, not generations.' : 'Pointillés : parents. Traits pleins : enfants. Dans un cadre, les rangées forment une seule fratrie.') : t('family:reader.graphLegend')}{projection && <span className="block">{t('family:reader.projectionHint')}</span>}</p>
      </div>}
    {unionScene && viewport.width < 768 && <div data-no-pan data-testid="union-navigation" className="flex gap-2 overflow-x-auto pb-1">
      {hasLargeSiblings && unionScene.shared.map(({ person }) => <button key={person.id} type="button" data-testid="common-parent-navigation" className="min-h-10 shrink-0 rounded-lg border bg-muted px-3 text-xs font-medium" onClick={() => window.__focusOn?.(person.id)}>{person.given} (parent)</button>)}
      {unionScene.panels.map(panel => <button type="button" key={panel.family.key} className="min-h-10 shrink-0 rounded-lg border bg-background px-3 text-xs font-medium" data-navigate-family={panel.family.key}
        onClick={() => { if (hasLargeSiblings) { setActiveUnion(panel.family.key); updateView(unionReadingView(unionScene, viewport.width, viewport.height, viewport.top, panel.family.key)) } else updateView({ scale: .95, pan: { x: viewport.width / 2 - (panel.x + panel.width / 2) * .95, y: viewport.top + 24 - panel.y * .95 } }) }}>{panel.family.parents.filter(p => !unionScene.shared.some(s => s.person.id === p.id)).map(p => p.given).join(' + ') || (en ? 'Unknown parent' : 'Parent inconnu')}</button>)}
    </div>}
    </div>
    {reading && <div className="absolute inset-x-0 bottom-0 z-[2]" style={{ top: viewport.top }}>
      <FamilyReader hidePhotos={tweaks.hidePhotos} hideDates={tweaks.hideDates} people={people} visibleIds={visibleIds} filtered={!!searchQuery.trim() || genFilter !== 'all'} selectedId={selectedId} readOnly={readOnly} onSelect={onSelect} onAdd={onOpenAdd} onLink={onLinkExistingChild} />
    </div>}
    {!reading && <>
    {showBackground && background && backgroundUrl && <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" style={{ ...buildViewportBackgroundStyle(background, backgroundUrl), top: viewport.top }} />
      {background.overlay && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 bg-background opacity-50" style={{ top: viewport.top }} />}
    </>}
    {/* One world origin for cards, SVG, wheel, focus and paste. No second toolbar offset. */}
    <div data-testid="tree-world" className="absolute inset-0 z-[1]" style={{ transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.scale})`, transformOrigin: '0 0' }}>
      {unionScene && <UnionOverviewLayer scene={unionScene} onSelect={onSelect} />}
      <svg className="tree-connections pointer-events-none absolute z-[1]" viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} width={bounds.width} height={bounds.height} style={{ left: bounds.minX, top: bounds.minY }}>
        {connections.map((c, i) => <g key={i}><path d={c.path} fill="none" stroke="var(--background)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /><path data-connection-kind={c.kind} data-connection-ids={c.ids.join(',')} data-family-key={familyKey(c.parentIds || c.ids)} data-union-role={(c as UnionConnection).role} className={unionScene ? UNION_TONES[unionScene.panels.find(p => p.family.key === familyKey(c.parentIds || c.ids))?.color || 0] : undefined} d={c.path} fill="none" stroke={unionScene ? 'currentColor' : c.kind === 'spouse' ? 'var(--muted-foreground)' : 'var(--primary)'} strokeWidth={lineage && c.ids.every(id => lineage.has(id)) ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={c.kind === 'spouse' ? '6 4' : undefined} opacity={lineage && !c.ids.every(id => lineage.has(id)) ? .5 : .95} /></g>)}
      </svg>
      {visible.map(p => positions[p.id] && <PersonCard key={p.id} person={p} pos={positions[p.id]} scale={view.scale} cardStyle={style} isOrg={isOrg} maxGeneration={maxGens} lexicon={orgLexicon}
        hidePhotos={tweaks.hidePhotos} hideDates={tweaks.hideDates} hidePlaces={tweaks.hidePlaces} selected={selectedId === p.id} dragging={draggingId === p.id}
        dim={!!lineage && !lineage.has(p.id) || !!unionScene && filtering && !matchIds.has(p.id)} highlight={!!lineage?.has(p.id)} onSelect={onSelect} onHover={onHover}
        onDrag={canMoveCards ? onCardDrag : undefined} onDragStart={canMoveCards ? () => { draggingRef.current = true; setDraggingId(p.id); onCardDragStateChange?.(true) } : undefined} onDragEnd={canMoveCards ? onCardDragEnd : undefined} />)}

    </div>
    <div className={cn("absolute bottom-4 right-4 z-20 flex gap-1 rounded-lg border bg-background p-1 shadow", unionScene ? "flex-row items-center" : "flex-col")} data-no-pan data-testid="tree-zoom-controls">
      <Button size="sm" variant="ghost" aria-label={en ? 'Zoom in' : 'Agrandir'} data-testid="tree-zoom-in" onClick={() => zoom(1.15)}>+</Button>
      <span className="px-2 text-center text-xs" data-testid="tree-zoom">{view.scale < .1 ? (view.scale * 100).toFixed(1) : Math.round(view.scale * 100)}%</span>
      <Button size="sm" variant="ghost" aria-label={en ? 'Zoom out' : 'R\u00e9duire'} onClick={() => zoom(1 / 1.15)}>{'\u2212'}</Button>
      <Button size="sm" variant="ghost" aria-label={t('canvas.centerTree')} onClick={fitToView}><Maximize2 className="size-4" /></Button>
    </div>
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground">{unionScene && filtering ? `${matches.length} ${en ? 'matches; family context retained' : 'résultats ; contexte familial conservé'}` : `${visible.length} / ${people.length}`}</div>
    {!visible.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center" style={{ paddingTop: viewport.top }}>
      <div className="rounded-lg bg-background/90 p-4 text-muted-foreground">
        <p className="font-medium">{people.length ? t('canvas.noResults', { defaultValue: en ? 'No matching people' : 'Aucune personne correspondante' }) : t('canvas.emptyTree')}</p>
        {people.length ? <Button className="pointer-events-auto mt-2" variant="outline" size="sm" data-no-pan onClick={() => { onSearchChange(''); onSetTweak('generation', 'all') }}>{en ? 'Clear filters' : 'Effacer les filtres'}</Button> : <p className="text-sm">{readOnly ? t('canvas.emptyReadOnly') : t('canvas.emptyEditable')}</p>}
      </div>
    </div>}
    {routed.unresolved > 0 && <div role="status" className="absolute left-4 right-4 z-10 rounded-lg border bg-background p-3 text-sm" style={{ top: viewport.top + 12 }}>{t('family:reader.routingWarning')}</div>}
    {!unionScene && !isOrg && view.scale < .65 && visible.length > 0 && <div data-no-pan className="absolute bottom-4 left-4 right-20 z-10 max-w-md rounded-lg border bg-background/95 p-3 text-sm shadow"><button type="button" className="text-left underline underline-offset-4" onClick={() => choosePresentation('families')}>{t('family:reader.zoomHint')}</button></div>}
    </>}
    <input ref={importRef} type="file" accept=".ged,text/plain" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) onImportGedcom?.(file); e.target.value = '' }} />
  </div>
}
