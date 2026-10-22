import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useFamilyTreeStore } from '@/stores/family-tree-store'
import { normalizePersons, computeLayout } from '@/utils/tree-layout'
import { buildCardHeights, getCardDimensions, isFinitePoint, separateOverlappingCards } from '@/lib/tree-geometry'
import type { NormalizedPerson, Person, Position, TreeTweaks } from '@/types'
import { isOrganizationTree } from '@/lib/tree-type'
import type { TreeBackgroundConfig } from '@/lib/tree-background'
import { TreeCanvas } from '@/components/family-tree/tree-canvas'
import { SidePanel } from '@/components/family-tree/side-panel'
import { AddPersonDialog, ShareDialog, TreeSettingsSheet, AddRelationDialog, LinkExistingChildDialog } from '@/components/family-tree/dialogs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button, buttonVariants } from '@/components/ui/button'
import { Eye, Info } from 'lucide-react'
import { uploadPersonPhoto, setPersonPhoto } from '@/lib/upload'
import { exportTreeGedcom, exportTreePdf } from '@/lib/export-api'
import { importTreeGedcom } from '@/lib/import-api'
import { getApiErrorPayload, translateApiError } from '@/lib/translate-error'
import { rememberLastTreeId } from '@/lib/post-login-destination'
import { TreeOnboardingHint } from '@/components/family-tree/tree-onboarding-hint'
import { consumePendingDemoFork } from '@/lib/demo-fork-signal'
import { SOLO_SOFT_WALL_PERSONS, getPlanById } from '@/lib/plans'
import { extractSubtree, pasteSubtree } from '@/lib/subtree-api'
import { loadSubtreeClipboard, saveSubtreeClipboard, type SubtreeClipboardMode, type SubtreeClipboardState } from '@/lib/subtree-clipboard'
import { useTreeKeyboardShortcuts } from '@/hooks/use-tree-keyboard-shortcuts'

interface FamilyTreePageProps { treeIdOverride?: string; publicDemo?: boolean }
const DEFAULT_TWEAKS: TreeTweaks = { layout: 'vertical', density: 'spacious', cardStyle: 'square', connStyle: 'elbow', generation: 'all', hideDates: false, hidePlaces: false, hidePhotos: false }
function readTweaks(treeId?: string): TreeTweaks {
  try {
    const raw = JSON.parse(localStorage.getItem(`geneamap:tree-view:v1:${treeId}`) || '{}')
    return { ...DEFAULT_TWEAKS,
      layout: ['vertical','horizontal','radial'].includes(raw.layout) ? raw.layout : 'vertical',
      density: ['spacious','compact'].includes(raw.density) ? raw.density : 'spacious',
      cardStyle: ['square','round','horizontal','minimal'].includes(raw.cardStyle) ? raw.cardStyle : 'square',
      connStyle: ['elbow','curve','straight'].includes(raw.connStyle) ? raw.connStyle : 'elbow',
      hideDates: raw.hideDates === true, hidePlaces: raw.hidePlaces === true, hidePhotos: raw.hidePhotos === true,
    }
  } catch { return { ...DEFAULT_TWEAKS } }
}
function personForEdit(person: NormalizedPerson, treeId: string, raw?: Person): Person {
  return raw || { id: person.id, firstName: person.given, lastName: person.sur !== '-' ? person.sur : '', birthDate: person.birthDate,
    deathDate: person.deathDate, birthPlace: person.place || null, gender: null, biography: person.bio?.fr || '', photoUrl: person.photoUrl ?? null, occupation: person.occupation || null, treeId }
}
export default function FamilyTreePage({ treeIdOverride, publicDemo = false }: FamilyTreePageProps = {}) {
  const { t } = useTranslation(['tree', 'common'])
  const { id: paramTreeId } = useParams<{ id: string }>()
  const treeId = treeIdOverride ?? paramTreeId
  const navigate = useNavigate(), location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const isPublicRoute = location.pathname.startsWith('/tree/')
  const { currentTree, treeAccess, isLoading, error, fetchTreeById, resetState, updateNodePositions, addPerson, updatePerson, deletePerson, addRelationship, deleteRelationship } = useFamilyTreeStore()
  const [exportBusy, setExportBusy] = useState(false), [importBusy, setImportBusy] = useState(false)
  const [subtreeClipboard, setSubtreeClipboard] = useState<SubtreeClipboardState | null>(() => loadSubtreeClipboard())
  const [subtreeBusy, setSubtreeBusy] = useState(false), [pasteMode, setPasteMode] = useState(false)
  const isDemo = publicDemo || treeAccess?.isDemo || currentTree?.isDemo
  const canWrite = treeAccess?.canWrite ?? false
  const canEditPerson = treeAccess?.canEditPerson ?? (canWrite && !isDemo)
  const canDrag = isDemo || canWrite, readOnly = !canWrite
  const canChangePhoto = canWrite && (treeAccess?.canUploadPhotos ?? true)
  const canManageCollaborators = !isDemo && !!treeAccess?.canManageCollaborators
  const canManageVisibility = !isDemo && treeAccess?.role === 'owner' && canWrite
  const canShare = canManageCollaborators || canManageVisibility
  const isOrg = isOrganizationTree(currentTree)
  const canExport = !!isAuthenticated && !!treeAccess?.canExport && !isDemo
  const canImport = !!isAuthenticated && !!treeAccess?.canImport && canWrite && !isOrg
  const canExportGedcom = canExport && !isOrg
  const canVersioning = !!isAuthenticated && !!treeAccess?.canVersioning && !isDemo
  const canCopySubtree = !!treeAccess?.canRead, canPasteSubtree = canWrite && !!subtreeClipboard
  const pageHeight = publicDemo || isPublicRoute ? 'flex min-h-0 flex-1 flex-col' : 'h-full min-h-0'
  const [selectedId, setSelectedId] = useState<string | null>(null), [hoverId, setHoverId] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, Position>>({})
  const [searchQuery, setSearchQuery] = useState(''), [fitRequestId, setFitRequestId] = useState(0)
  const isDraggingCardRef = useRef(false), positionsRef = useRef(positions), positionsDirtyRef = useRef(false)
  const positionsBootstrappedRef = useRef<string | null>(null)
  positionsRef.current = positions
  const [isAddOpen, setIsAddOpen] = useState(false), [isShareOpen, setIsShareOpen] = useState(false), [isTweaksOpen, setIsTweaksOpen] = useState(false)
  const [isRelationOpen, setIsRelationOpen] = useState(false), [relationPersonData, setRelationPersonData] = useState<Person | null>(null)
  const [isLinkChildOpen, setIsLinkChildOpen] = useState(false), [linkChildParentIds, setLinkChildParentIds] = useState<string[]>([])
  const [addPersonRelData, setAddPersonRelData] = useState({ parentId: null as string | null, parent2Id: null as string | null, relType: null as string | null })
  const [tweaks, setTweaks] = useState<TreeTweaks>(() => readTweaks(treeId))

  const refreshOrRedirectAfterWrite = (fallbackTreeId: string, options?: { silent?: boolean }) => {
    const forkedTreeId = consumePendingDemoFork()
    if (forkedTreeId && forkedTreeId !== treeId) { toast.success(t('page.demoForked')); navigate(`/family-tree/${forkedTreeId}`, { replace: true }); return }
    fetchTreeById(fallbackTreeId, options ?? { silent: true })
  }
  const redirectIfForked = () => {
    const forkedTreeId = consumePendingDemoFork()
    if (forkedTreeId && forkedTreeId !== treeId) { toast.success(t('page.demoForked')); navigate(`/family-tree/${forkedTreeId}`, { replace: true }) }
  }
  const handleOpenAddModal = (parentId: string | null = null, relType: string | null = null, parent2Id: string | null = null) => {
    setAddPersonRelData({ parentId, parent2Id, relType }); setIsAddOpen(true)
  }
  useEffect(() => {
    positionsBootstrappedRef.current = null; positionsDirtyRef.current = false
    setPositions({}); setSelectedId(null); setHoverId(null); setSearchQuery(''); setPasteMode(false); setTweaks(readTweaks(treeId))
    if (!treeId) return () => resetState()
    if (!publicDemo && !isPublicRoute) rememberLastTreeId(treeId)
    void (async () => {
      const result = await fetchTreeById(treeId)
      const forkedTreeId = consumePendingDemoFork()
      if (forkedTreeId && forkedTreeId !== treeId) { navigate(`/family-tree/${forkedTreeId}`, { replace: true }); return }
      if (result?.notFound && !publicDemo && !isPublicRoute) {
        await useFamilyTreeStore.getState().fetchTrees()
        const fallback = useFamilyTreeStore.getState().trees.find(tree => tree.name === 'Challenge Family')
        if (fallback) { toast.info(t('page.treeMoved', { name: fallback.name })); navigate(`/family-tree/${fallback.id}`, { replace: true }) }
      }
    })()
    return () => resetState()
  }, [treeId, fetchTreeById, resetState, publicDemo, isPublicRoute, navigate, t])

  useEffect(() => {
    if (!currentTree || currentTree.id !== treeId || isDraggingCardRef.current) return
    const normalized = normalizePersons(currentTree.Person || [], currentTree.Relationship)
    const org = isOrganizationTree(currentTree)
    const options = { organization: org, cardStyle: tweaks.cardStyle }
    const heights = buildCardHeights(normalized, tweaks.cardStyle, org)
    const rels = (currentTree.Relationship || []).map(r => `${r.id}:${r.type}:${r.sourceId}:${r.targetId}`).sort().join('|')
    const bootstrapKey = `${currentTree.id}:${rels}:${normalized.map(p => `${p.id}:${heights[p.id]}`).sort().join(',')}:${tweaks.cardStyle}`
    if (positionsBootstrappedRef.current === bootstrapKey) return
    const db: Record<string, Position> = {}
    currentTree.NodePosition?.forEach(p => { if (isFinitePoint(p)) db[p.nodeId] = { x: p.x, y: p.y } })
    // Retain current manual edits across a refresh. Additions/deletions must still be reconciled.
    const source = positionsBootstrappedRef.current && positionsDirtyRef.current ? { ...db, ...positionsRef.current } : db
    const missing = normalized.some(p => !isFinitePoint(source[p.id]))
    const computed: Record<string, Position> = missing ? computeLayout(normalized, tweaks.layout, tweaks.density, options).positions : {}
    let next = Object.fromEntries(normalized.map(p => [p.id, isFinitePoint(source[p.id]) ? source[p.id] : computed[p.id]]))
    // Fix genuine collisions caused by taller text/new cards, not harmless translations or distant spouses.
    const { w } = getCardDimensions(tweaks.cardStyle, options)
    next = separateOverlappingCards(normalized, next, w, heights, tweaks.layout)
    setPositions(next)
    positionsBootstrappedRef.current = bootstrapKey
  }, [currentTree, treeId, tweaks.layout, tweaks.density, tweaks.cardStyle])

  useEffect(() => {
    const selected = new URLSearchParams(location.search).get('select')
    if (!selected || !positions[selected]) return
    setSelectedId(selected)
    const timer = setTimeout(() => window.__focusOn?.(selected), 300)
    return () => clearTimeout(timer)
  }, [location.search, positions])
  useEffect(() => {
    if (!canWrite || !Object.keys(positions).length || !currentTree || currentTree.id !== treeId || isDraggingCardRef.current) return
    const handler = setTimeout(() => {
      if (isDraggingCardRef.current) return
      const db = Object.fromEntries((currentTree.NodePosition || []).map(p => [p.nodeId, p]))
      const changed = Object.entries(positions).some(([id, p]) => !db[id] || Math.abs(db[id].x - p.x) > 1 || Math.abs(db[id].y - p.y) > 1)
      if (changed) updateNodePositions(Object.entries(positions).map(([id, position]) => ({ id, position }))).then(redirectIfForked)
    }, 1000)
    return () => clearTimeout(handler)
  }, [positions, currentTree, treeId, updateNodePositions, canWrite])

  const people = useMemo(() => currentTree?.Person ? normalizePersons(currentTree.Person, currentTree.Relationship) : [], [currentTree])
  const soloSoftWall = useMemo(() => {
    if (publicDemo || isPublicRoute || isDemo || isOrg || !canWrite || treeAccess?.role !== 'owner' || (user?.plan ?? 'SOLO') !== 'SOLO') return false
    return people.length >= SOLO_SOFT_WALL_PERSONS && people.length < getPlanById('SOLO').maxPersonsPerTree
  }, [publicDemo, isPublicRoute, isDemo, isOrg, canWrite, treeAccess?.role, user?.plan, people.length])
  const selectedPerson = useMemo(() => selectedId ? people.find(p => p.id === selectedId) ?? null : null, [selectedId, people])
  const treeBackground = useMemo<TreeBackgroundConfig | null>(() => currentTree && isOrg ? {
    imageUrl: currentTree.backgroundImageUrl ?? null, mode: currentTree.backgroundMode ?? 'NONE', opacity: currentTree.backgroundOpacity ?? .35,
    overlay: currentTree.backgroundOverlay ?? true, tileSize: currentTree.backgroundTileSize ?? 160,
  } : null, [currentTree, isOrg])

  const handleSetTweak = (key: keyof TreeTweaks, val: string | boolean) => {
    const next = { ...tweaks, [key]: val } as TreeTweaks
    // Event side effects do not belong in a React state updater (which StrictMode can replay).
    setTweaks(next)
    try { localStorage.setItem(`geneamap:tree-view:v1:${treeId}`, JSON.stringify(next)) } catch { /* Storage can be disabled. */ }
    if (key === 'layout' || key === 'density' || key === 'cardStyle') {
      const result = computeLayout(people, next.layout, next.density, { organization: isOrg, cardStyle: next.cardStyle })
      setPositions(result.positions); positionsDirtyRef.current = true; setFitRequestId(id => id + 1)
    }
  }
  const applyReorganize = () => {
    const result = computeLayout(people, tweaks.layout, tweaks.density, { organization: isOrg, cardStyle: tweaks.cardStyle })
    setPositions(result.positions); positionsDirtyRef.current = true; setFitRequestId(id => id + 1)
    toast.success(t('page.reorganized'))
  }
  const handleReorganize = () => {
    if (!people.length || positionsDirtyRef.current && !confirm(t('page.reorganizeConfirm'))) return
    applyReorganize()
  }

  const handleAddPerson = async (formData: Record<string, string>, relToId?: string | null, relType?: string | null, relToId2?: string | null, photoFile?: File | null) => {
    if (!treeId) return
    let photoUrl: string | null = null
    if (photoFile) { try { const { url } = await uploadPersonPhoto(photoFile, treeId); photoUrl = url } catch { toast.error(t('person.photoUploadFailed')); return } }
    const result = await addPerson(treeId, { firstName: formData.firstName, lastName: formData.lastName || '-', birthDate: formData.birthDate || undefined,
      birthPlace: formData.birthPlace || undefined, deathDate: formData.deathDate || undefined, occupation: formData.occupation || undefined,
      biography: formData.biography || undefined, gender: formData.gender || undefined, photoUrl: photoUrl ?? undefined, position: { x: 300, y: 200 } })
    if (result.success && result.person) {
      if (relToId && relType) await addRelationship({ sourceId: relType === 'parent' ? result.person.id : relToId, targetId: relType === 'parent' ? relToId : result.person.id, type: relType === 'spouse' ? 'spouse' : 'parent' })
      if (relToId2 && relType === 'child') await addRelationship({ sourceId: relToId2, targetId: result.person.id, type: 'parent' })
      toast.success(t('page.personAdded', { name: result.person.firstName })); refreshOrRedirectAfterWrite(treeId); setIsAddOpen(false)
    } else toast.error(result.message)
  }
  const handleSidePanelSave = async (personId: string, formData: Record<string, string>) => {
    if (!canEditPerson) return
    const result = await updatePerson(personId, formData)
    if (result.success) { if (treeId) fetchTreeById(treeId, { silent: true }) }
    else { toast.error(result.message); throw new Error(result.message) }
  }
  const handleChangePhoto = async (personId: string, file: File) => {
    if (!treeId) return
    try { const { url } = await uploadPersonPhoto(file, treeId, personId); await setPersonPhoto(personId, url); refreshOrRedirectAfterWrite(treeId) }
    catch { toast.error(t('person.photoUploadFailed')); throw new Error('photo upload failed') }
  }
  const handleDeletePerson = async (personId: string) => {
    const person = people.find(p => p.id === personId)
    if (!confirm(t('page.deletePersonConfirm', { name: `${person?.given} ${person?.sur}` }))) return
    const result = await deletePerson(personId)
    if (result.success) { toast.success(t('page.personDeleted')); setSelectedId(null); if (treeId) refreshOrRedirectAfterWrite(treeId) }
    else toast.error(result.message)
  }
  const handleOpenLinkChildModal = (parentIds: string[]) => { setLinkChildParentIds(parentIds.filter(Boolean)); setIsLinkChildOpen(true) }
  const handleAddRelationSubmit = async (contextId: string, selectedId: string, relType: string) => {
    const payload = relType === 'spouse' ? { sourceId: contextId, targetId: selectedId, type: 'spouse' } : { sourceId: relType === 'parent' ? selectedId : contextId, targetId: relType === 'parent' ? contextId : selectedId, type: 'parent' }
    const result = await addRelationship(payload)
    if (result.success) { toast.success(t('page.linkCreated')); if (treeId) refreshOrRedirectAfterWrite(treeId); setIsRelationOpen(false) }
    else toast.error(result.message)
  }
  const handleLinkExistingChild = async (childId: string) => {
    if (!treeId || !linkChildParentIds.length) return
    let linked = false, hadExisting = false
    for (const parentId of linkChildParentIds) {
      const result = await addRelationship({ sourceId: parentId, targetId: childId, type: 'parent' })
      if (result.success) linked = true
      else if (result.statusCode === 409) hadExisting = true
      else { toast.error(result.message); return }
    }
    const child = people.find(p => p.id === childId), name = child ? `${child.given}${child.sur && child.sur !== '-' ? ` ${child.sur}` : ''}` : ''
    if (linked) toast.success(t('page.childLinked', { name: name || '?' }))
    else if (hadExisting) toast.info(t('page.linkAlreadyExists'))
    refreshOrRedirectAfterWrite(treeId); setIsLinkChildOpen(false); setLinkChildParentIds([])
  }
  const handleDeleteRelation = async (relId: string) => {
    if (!confirm(t('page.deleteLinkConfirm'))) return
    const result = await deleteRelationship(relId)
    if (result.success) { toast.success(t('page.linkDeleted')); if (treeId) refreshOrRedirectAfterWrite(treeId) } else toast.error(result.message)
  }
  const runExport = async (kind: 'gedcom' | 'pdf') => {
    if (!treeId || !currentTree?.name) return
    setExportBusy(true)
    try { if (kind === 'gedcom') await exportTreeGedcom(treeId, currentTree.name); else await exportTreePdf(treeId, currentTree.name); toast.success(kind === 'gedcom' ? t('page.exportGedcomSuccess') : t('page.exportPdfSuccess')) }
    catch (err) { toast.error(translateApiError(getApiErrorPayload(err), 'page.exportFailed')) } finally { setExportBusy(false) }
  }
  const runImportGedcom = async (file: File) => {
    if (!treeId) return
    setImportBusy(true)
    try { const result = await importTreeGedcom(treeId, file); await fetchTreeById(treeId); toast.success(t('page.importGedcomSuccess', { count: result.importedPersons })) }
    catch (err) { toast.error(translateApiError(getApiErrorPayload(err), 'page.importFailed')) } finally { setImportBusy(false) }
  }
  const persistSubtreeClipboard = (state: SubtreeClipboardState) => { saveSubtreeClipboard(state); setSubtreeClipboard(state) }
  const handleCopySubtree = useCallback(async (mode: SubtreeClipboardMode) => {
    if (!treeId || !selectedId) return
    setSubtreeBusy(true)
    try {
      const data = await extractSubtree(treeId, selectedId, mode)
      persistSubtreeClipboard({ sourceTreeId: data.sourceTreeId, sourceTreeName: currentTree?.name, rootPersonId: data.rootPersonId, mode: data.mode, personCount: data.personCount, clipboard: data.clipboard })
      toast.success(t(mode === 'entire' ? 'subtree.copyEntireSuccess' : 'subtree.copySuccess', { count: data.personCount }))
    } catch (err) { toast.error(translateApiError(getApiErrorPayload(err), 'subtree.copyFailed')) } finally { setSubtreeBusy(false) }
  }, [treeId, selectedId, currentTree?.name, t])
  const runPasteSubtree = useCallback(async (options: { attachToPersonId?: string; attachAs?: 'child' | 'spouse'; anchor?: Position }) => {
    if (!treeId || !subtreeClipboard) { toast.error(t('subtree.emptyClipboard')); return }
    setSubtreeBusy(true)
    try {
      const result = await pasteSubtree(treeId, { clipboard: subtreeClipboard.clipboard, rootPersonId: subtreeClipboard.rootPersonId, sourceTreeId: subtreeClipboard.sourceTreeId, ...options })
      toast.success(t('subtree.pasteSuccess', { count: result.pastedPersonCount })); setPasteMode(false)
      if (result.pastedRootId) setSelectedId(result.pastedRootId)
      refreshOrRedirectAfterWrite(treeId); setFitRequestId(n => n + 1)
    } catch (err) { toast.error(translateApiError(getApiErrorPayload(err), 'subtree.pasteFailed')) } finally { setSubtreeBusy(false) }
  }, [treeId, subtreeClipboard, t])
  const modalOpen = isAddOpen || isShareOpen || isTweaksOpen || isRelationOpen || isLinkChildOpen
  useTreeKeyboardShortcuts({ enabled: !!currentTree && !isLoading, blocked: modalOpen || subtreeBusy, pasteMode,
    canCopy: canCopySubtree && !!selectedId, canPaste: canPasteSubtree, hasSelection: !!selectedId,
    onCopyBranch: () => void handleCopySubtree('branch'), onCopyEntire: () => void handleCopySubtree('entire'),
    onPasteAsChild: () => { if (selectedId) void runPasteSubtree({ attachToPersonId: selectedId, attachAs: 'child' }) },
    onPasteAsSpouse: () => { if (selectedId && !isOrg) void runPasteSubtree({ attachToPersonId: selectedId, attachAs: 'spouse' }) },
    onStartCanvasPaste: () => setPasteMode(true), onCancelPasteMode: () => setPasteMode(false), onDeselect: () => setSelectedId(null) })
  if (isLoading) return <div className={`flex ${pageHeight} items-center justify-center`}><Skeleton className="size-12 rounded-full" /></div>
  if (error || !currentTree) return <div className={`flex ${pageHeight} flex-col items-center justify-center gap-4`}><p className="text-muted-foreground">{error || t('page.treeNotFound')}</p><Button onClick={() => navigate(publicDemo ? '/' : '/dashboard')}>{t('common:actions.back')}</Button></div>
  return <div className={`flex ${pageHeight} w-full flex-col`}>
    {(isDemo || readOnly) && <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <Eye className="size-4 shrink-0" /><span>{isDemo ? canWrite ? t('page.demoSharedWrite') : t('page.demoReadOnly') : treeAccess?.planExpired && treeAccess?.role === 'owner' ? t('page.trialExpired') : isPublicRoute && !isAuthenticated ? t('page.publicReadOnly') : readOnly && isAuthenticated ? t('page.authReadOnly') : t('page.guestReadOnly')}</span>
      {treeAccess?.planExpired && treeAccess?.role === 'owner' && <Link to="/pricing" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-7 border-amber-300 bg-background' })}>{t('page.upgradePlan')}</Link>}
      {(publicDemo || readOnly && !isAuthenticated) && <>
        <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate('/login')}>{t('page.login')}</Button>
        <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate('/register')}>{t('page.createAccount')}</Button>
      </>}
      {publicDemo && canWrite && <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate('/register')}>{t('page.createMyTree')}</Button>}
    </div>}
    {soloSoftWall && <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b bg-sky-50 px-4 py-2 text-sm text-sky-950 dark:bg-sky-950/40 dark:text-sky-100">
      <Info className="size-4 shrink-0" /><span>{t('page.soloSoftWall', { count: people.length, max: getPlanById('SOLO').maxPersonsPerTree })}</span>
      <Link to="/pricing" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-7 border-sky-300 bg-background' })}>{t('page.upgradePlan')}</Link>
    </div>}
    {!publicDemo && !isPublicRoute && <TreeOnboardingHint personCount={people.length} canWrite={canWrite && !isDemo} onAddPerson={() => handleOpenAddModal()} />}
    <div className="flex min-h-0 flex-1"><div className="relative min-w-0 flex-1">
      {pasteMode && <div className="absolute inset-x-0 top-14 z-20 flex items-center justify-center gap-2 px-4"><div className="flex items-center gap-2 rounded-md border bg-background/95 px-3 py-2 text-sm shadow-sm backdrop-blur">
        <span>{t('canvas.pasteModeHint')} - {t('subtree.shortcuts.cancel')}</span><Button size="sm" variant="outline" onClick={() => setPasteMode(false)}>{t('canvas.pasteModeCancel')}</Button>
      </div></div>}
      <TreeCanvas key={treeId} people={people} tweaks={tweaks} treeMeta={currentTree} background={treeBackground} positions={positions} setPositions={setPositions}
        selectedId={selectedId} onSelect={id => setSelectedId(prev => prev === id ? null : id)} hoverId={hoverId} onHover={setHoverId}
        onOpenAdd={handleOpenAddModal} onLinkExistingChild={handleOpenLinkChildModal} onOpenShare={() => setIsShareOpen(true)} onOpenTweaks={() => setIsTweaksOpen(true)}
        onSetTweak={handleSetTweak} searchQuery={searchQuery} onSearchChange={setSearchQuery} onReorganize={handleReorganize} fitRequestId={fitRequestId}
        readOnly={readOnly} canDrag={canDrag} isDemo={isDemo} canShare={canShare} canExport={canExport} canExportGedcom={canExportGedcom} canImport={canImport}
        exportBusy={exportBusy} importBusy={importBusy} onExportGedcom={() => void runExport('gedcom')} onExportPdf={() => void runExport('pdf')} onImportGedcom={file => void runImportGedcom(file)}
        pasteMode={pasteMode} onPasteAtCanvas={anchor => void runPasteSubtree({ anchor })}
        onCardDragStateChange={dragging => { isDraggingCardRef.current = dragging; if (dragging) positionsDirtyRef.current = true }} />
    </div>
    {selectedPerson && <SidePanel person={selectedPerson} people={people} currentTree={currentTree} onClose={() => setSelectedId(null)}
      onSelect={id => { setSelectedId(id); window.__focusOn?.(id) }} onSave={canEditPerson ? handleSidePanelSave : undefined}
      onAddRelation={p => { setRelationPersonData(currentTree.Person?.find(x => x.id === p.id) || personForEdit(p, currentTree.id)); setIsRelationOpen(true) }}
      onAddChildRelation={handleOpenAddModal} onLinkExistingChild={handleOpenLinkChildModal} onDelete={handleDeletePerson} onDeleteRelation={handleDeleteRelation}
      readOnly={readOnly} canEditInfo={canEditPerson} canChangePhoto={canChangePhoto} canVersioning={canVersioning}
      onPersonRestored={() => treeId && void fetchTreeById(treeId)} canUploadDocuments={treeAccess?.canUploadDocuments ?? true} onChangePhoto={handleChangePhoto}
      canCopySubtree={canCopySubtree} canPasteSubtree={canPasteSubtree} subtreeClipboard={subtreeClipboard} subtreeBusy={subtreeBusy}
      onCopyBranch={() => void handleCopySubtree('branch')} onCopyEntireTree={() => void handleCopySubtree('entire')}
      onPasteAsChild={() => selectedId && void runPasteSubtree({ attachToPersonId: selectedId, attachAs: 'child' })}
      onPasteAsSpouse={() => selectedId && !isOrg && void runPasteSubtree({ attachToPersonId: selectedId, attachAs: 'spouse' })} onStartCanvasPaste={() => setPasteMode(true)} />}
    </div>
    <AddPersonDialog open={isAddOpen} onClose={() => { setIsAddOpen(false); setAddPersonRelData({ parentId: null, parent2Id: null, relType: null }) }} onSubmit={handleAddPerson}
      treeName={currentTree.name} treeId={currentTree.id} parentId={addPersonRelData.parentId} parent2Id={addPersonRelData.parent2Id} relationType={addPersonRelData.relType} treeLexicon={currentTree} />
    <ShareDialog open={isShareOpen} onClose={() => setIsShareOpen(false)} treeId={currentTree.id} visibility={currentTree.visibility || (currentTree.isPublic ? 'PUBLIC' : 'PRIVATE')}
      canManageCollaborators={canManageCollaborators} canManageVisibility={canManageVisibility} />
    <TreeSettingsSheet open={isTweaksOpen} onClose={() => setIsTweaksOpen(false)} tweaks={tweaks} onSetTweak={handleSetTweak} tree={currentTree} canEditBackground={canWrite && !isDemo} />
    {isRelationOpen && relationPersonData && <AddRelationDialog open={isRelationOpen} onClose={() => { setIsRelationOpen(false); setRelationPersonData(null) }} person={people.find(p => p.id === relationPersonData.id)!} people={people} onSubmit={handleAddRelationSubmit} treeLexicon={currentTree} />}
    {isLinkChildOpen && <LinkExistingChildDialog open={isLinkChildOpen} onClose={() => { setIsLinkChildOpen(false); setLinkChildParentIds([]) }} parentIds={linkChildParentIds} people={people} onSubmit={handleLinkExistingChild} />}
  </div>
}
