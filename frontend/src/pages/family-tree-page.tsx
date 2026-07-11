import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { normalizePersons, computeLayout } from "@/utils/tree-layout"
import type { NormalizedPerson, Person, Position, TreeTweaks } from "@/types"
import { TreeCanvas } from "@/components/family-tree/tree-canvas"
import { SidePanel } from "@/components/family-tree/side-panel"
import {
  AddPersonDialog,
  ShareDialog,
  TreeSettingsSheet,
  AddRelationDialog,
  LinkExistingChildDialog,
} from "@/components/family-tree/dialogs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { uploadPersonPhoto, setPersonPhoto } from "@/lib/upload"
import { exportTreeGedcom, exportTreePdf } from "@/lib/export-api"
import { importTreeGedcom } from "@/lib/import-api"
import { getApiErrorPayload, translateApiError } from "@/lib/translate-error"

interface FamilyTreePageProps {
  treeIdOverride?: string
  publicDemo?: boolean
}

function personForEdit(person: NormalizedPerson, treeId: string, raw?: Person): Person {
  if (raw) return raw
  return {
    id: person.id,
    firstName: person.given,
    lastName: person.sur !== "—" ? person.sur : "",
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthPlace: person.place || null,
    gender: null,
    biography: person.bio?.fr || "",
    photoUrl: person.photoUrl ?? null,
    treeId,
  }
}

export default function FamilyTreePage({ treeIdOverride, publicDemo = false }: FamilyTreePageProps = {}) {
  const { t } = useTranslation(["tree", "common"])
  const { id: paramTreeId } = useParams<{ id: string }>()
  const treeId = treeIdOverride ?? paramTreeId
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const isPublicRoute = location.pathname.startsWith("/tree/")

  const {
    currentTree,
    treeAccess,
    isLoading,
    error,
    fetchTreeById,
    resetState,
    updateNodePositions,
    addPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    deleteRelationship,
  } = useFamilyTreeStore()

  const isDemo = publicDemo || treeAccess?.isDemo || currentTree?.isDemo
  const canWrite = treeAccess?.canWrite ?? false
  const canEditPerson = treeAccess?.canEditPerson ?? (canWrite && !isDemo)
  const canDrag = isDemo || canWrite
  const readOnly = !canWrite
  const canChangePhoto = canWrite
  const canShare = !isDemo && treeAccess?.role === "owner"
  const canExport = !!isAuthenticated && !!treeAccess?.canExport && !isDemo
  const canImport = canExport && canWrite
  const canVersioning = !!isAuthenticated && !!treeAccess?.canVersioning && !isDemo
  const pageHeight = publicDemo || isPublicRoute ? "flex min-h-0 flex-1 flex-col" : "h-full min-h-0"

  const [exportBusy, setExportBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const lastRelsHashRef = useRef<string | null>(null)
  const [fitRequestId, setFitRequestId] = useState(0)
  const isDraggingCardRef = useRef(false)
  const positionsRef = useRef(positions)
  const positionsDirtyRef = useRef(false)
  const positionsBootstrappedRef = useRef<string | null>(null)

  positionsRef.current = positions

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isTweaksOpen, setIsTweaksOpen] = useState(false)
  const [isRelationOpen, setIsRelationOpen] = useState(false)
  const [relationPersonData, setRelationPersonData] = useState<Person | null>(null)
  const [isLinkChildOpen, setIsLinkChildOpen] = useState(false)
  const [linkChildParentIds, setLinkChildParentIds] = useState<string[]>([])
  const [addPersonRelData, setAddPersonRelData] = useState({ parentId: null as string | null, parent2Id: null as string | null, relType: null as string | null })

  const [tweaks, setTweaks] = useState<TreeTweaks>({
    theme: "light",
    layout: "vertical",
    density: "spacious",
    cardStyle: "square",
    connStyle: "elbow",
    generation: "all",
    hideDates: false,
    hidePlaces: false,
    hidePhotos: false,
  })

  const handleOpenAddModal = (parentId: string | null = null, relType: string | null = null, parent2Id: string | null = null) => {
    setAddPersonRelData({ parentId, parent2Id, relType })
    setIsAddOpen(true)
  }

  useEffect(() => {
    positionsBootstrappedRef.current = null
    positionsDirtyRef.current = false
    lastRelsHashRef.current = null
    setPositions({})
    if (treeId) fetchTreeById(treeId)
    return () => resetState()
  }, [treeId, fetchTreeById, resetState])

  useEffect(() => {
    if (!currentTree?.Person?.length || isDraggingCardRef.current) return

    const normalizedPeople = normalizePersons(currentTree.Person, currentTree.Relationship)
    const dbPositions: Record<string, { x: number; y: number }> = {}
    currentTree.NodePosition?.forEach((np) => {
      dbPositions[np.nodeId] = { x: np.x, y: np.y }
    })

    const currentRelsHash = (currentTree.Relationship || [])
      .map((r) => `${r.id}-${r.type}-${r.sourceId}-${r.targetId}`)
      .sort()
      .join("|")

    const personIds = normalizedPeople.map((p) => p.id).sort().join(",")
    const bootstrapKey = `${currentTree.id}:${currentRelsHash}:${personIds}`
    const relsChanged = lastRelsHashRef.current !== null && lastRelsHashRef.current !== currentRelsHash

    if (positionsBootstrappedRef.current === bootstrapKey) {
      lastRelsHashRef.current = currentRelsHash
      return
    }

    if (positionsDirtyRef.current && !relsChanged) {
      lastRelsHashRef.current = currentRelsHash
      return
    }

    const hasAllPositions = normalizedPeople.every((p: NormalizedPerson) => dbPositions[p.id])
    const needsLayout = relsChanged || !hasAllPositions || Object.keys(dbPositions).length === 0

    if (!needsLayout) {
      setPositions(dbPositions)
    } else {
      const { positions: computed } = computeLayout(normalizedPeople, tweaks.layout, tweaks.density)
      setPositions(computed)
      if (canWrite) {
        updateNodePositions(Object.entries(computed).map(([id, pos]) => ({ id, position: pos as Position })))
      }
    }

    positionsBootstrappedRef.current = bootstrapKey
    positionsDirtyRef.current = false
    lastRelsHashRef.current = currentRelsHash
  }, [currentTree, tweaks.layout, tweaks.density, canWrite, updateNodePositions])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tweaks.theme === "dark")
  }, [tweaks.theme])

  useEffect(() => {
    const selectParam = new URLSearchParams(location.search).get("select")
    if (selectParam && positions[selectParam]) {
      setSelectedId(selectParam)
      setTimeout(() => window.__focusOn?.(selectParam), 300)
    }
  }, [location.search, positions])

  useEffect(() => {
    if (!canWrite || Object.keys(positions).length === 0 || !currentTree || isDraggingCardRef.current) return
    const handler = setTimeout(() => {
      const dbPositions: Record<string, { x: number; y: number }> = {}
      currentTree.NodePosition?.forEach((np) => {
        dbPositions[np.nodeId] = { x: np.x, y: np.y }
      })
      let hasChanged = false
      const toSave = Object.entries(positions).map(([id, pos]) => {
        const dbPos = dbPositions[id]
        if (!dbPos || Math.abs(dbPos.x - pos.x) > 1 || Math.abs(dbPos.y - pos.y) > 1) hasChanged = true
        return { id, position: pos }
      })
      if (hasChanged) updateNodePositions(toSave)
    }, 1000)
    return () => clearTimeout(handler)
  }, [positions, currentTree, updateNodePositions, canWrite])

  const people = useMemo(() => {
    if (!currentTree?.Person) return []
    return normalizePersons(currentTree.Person, currentTree.Relationship)
  }, [currentTree])

  const selectedPerson = useMemo(
    () => (selectedId ? people.find((p: NormalizedPerson) => p.id === selectedId) ?? null : null),
    [selectedId, people]
  )

  const handleSetTweak = (key: keyof TreeTweaks, val: string | boolean) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: val }
      if ((key === "layout" || key === "density") && !readOnly) {
        const { positions: computed } = computeLayout(people, next.layout, next.density)
        setPositions(computed)
        updateNodePositions(Object.entries(computed).map(([id, pos]) => ({ id, position: pos as import("@/types").Position })))
        setFitRequestId((id) => id + 1)
      } else if (key === "layout" || key === "density") {
        const { positions: computed } = computeLayout(people, next.layout, next.density)
        setPositions(computed)
        setFitRequestId((id) => id + 1)
      }
      return next
    })
  }

  const applyReorganize = () => {
    const { positions: computed } = computeLayout(people, tweaks.layout, tweaks.density)
    setPositions(computed)
    positionsDirtyRef.current = false
    if (!readOnly) {
      updateNodePositions(Object.entries(computed).map(([id, pos]) => ({ id, position: pos as Position })))
    }
    setFitRequestId((id) => id + 1)
    toast.success(t("page.reorganized"))
  }

  const handleReorganize = () => {
    if (!people.length) return
    if (positionsDirtyRef.current && !confirm(t("page.reorganizeConfirm"))) {
      return
    }
    applyReorganize()
  }

  const handleAddPerson = async (
    formData: Record<string, string>,
    relToId?: string | null,
    relType?: string | null,
    relToId2?: string | null,
    photoFile?: File | null
  ) => {
    if (!treeId) return
    let photoUrl: string | null = null
    if (photoFile) {
      try {
        const { url } = await uploadPersonPhoto(photoFile, treeId)
        photoUrl = url
      } catch {
        toast.error(t("person.photoUploadFailed"))
        return
      }
    }
    const result = await addPerson(treeId, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate || null,
      birthPlace: formData.birthPlace || null,
      deathDate: formData.deathDate || null,
      gender: formData.gender || null,
      biography: formData.biography || null,
      photoUrl,
      position: { x: 300, y: 200 },
    })
    if (result.success && result.person) {
      if (relToId && relType) {
        await addRelationship({
          sourceId: relType === "parent" ? result.person.id : relToId,
          targetId: relType === "parent" ? relToId : result.person.id,
          type: relType === "spouse" ? "spouse" : "parent",
        })
      }
      if (relToId2 && relType === "child") {
        await addRelationship({ sourceId: relToId2, targetId: result.person.id, type: "parent" })
      }
      toast.success(t("page.personAdded", { name: result.person.firstName }))
      fetchTreeById(treeId, { silent: true })
      setIsAddOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  const handleSidePanelSave = async (personId: string, formData: Record<string, string>) => {
    if (!canEditPerson) return
    const result = await updatePerson(personId, formData)
    if (result.success) {
      if (treeId) fetchTreeById(treeId, { silent: true })
    } else {
      toast.error(result.message)
      throw new Error(result.message)
    }
  }

  const handleChangePhoto = async (personId: string, file: File) => {
    if (!treeId) return
    try {
      const { url } = await uploadPersonPhoto(file, treeId, personId)
      await setPersonPhoto(personId, url)
      await fetchTreeById(treeId, { silent: true })
    } catch {
      toast.error(t("person.photoUploadFailed"))
      throw new Error("photo upload failed")
    }
  }

  const handleDeletePerson = async (personId: string) => {
    const person = people.find((p: NormalizedPerson) => p.id === personId)
    if (!confirm(t("page.deletePersonConfirm", { name: `${person?.given} ${person?.sur}` }))) return
    const result = await deletePerson(personId)
    if (result.success) {
      toast.success(t("page.personDeleted"))
      setSelectedId(null)
      if (treeId) fetchTreeById(treeId, { silent: true })
    } else toast.error(result.message)
  }

  const handleOpenLinkChildModal = (parentIds: string[]) => {
    setLinkChildParentIds(parentIds.filter(Boolean))
    setIsLinkChildOpen(true)
  }

  const handleAddRelationSubmit = async (contextId: string, selectedId: string, relType: string) => {
    let payload: { sourceId: string; targetId: string; type: string }
    if (relType === "spouse") {
      payload = { sourceId: contextId, targetId: selectedId, type: "spouse" }
    } else {
      const parentId = relType === "parent" ? selectedId : contextId
      const childId = relType === "parent" ? contextId : selectedId
      payload = { sourceId: parentId, targetId: childId, type: "parent" }
    }
    const result = await addRelationship(payload)
    if (result.success) {
      toast.success(t("page.linkCreated"))
      if (treeId) fetchTreeById(treeId, { silent: true })
      setIsRelationOpen(false)
    } else toast.error(result.message)
  }

  const handleLinkExistingChild = async (childId: string) => {
    if (!treeId || linkChildParentIds.length === 0) return
    let linked = false
    let hadExisting = false

    for (const parentId of linkChildParentIds) {
      const result = await addRelationship({ sourceId: parentId, targetId: childId, type: "parent" })
      if (result.success) {
        linked = true
      } else if (result.statusCode === 409) {
        hadExisting = true
      } else {
        toast.error(result.message)
        return
      }
    }

    const child = people.find((p) => p.id === childId)
    const name = child ? `${child.given}${child.sur && child.sur !== "—" ? ` ${child.sur}` : ""}` : ""

    if (linked) {
      toast.success(t("page.childLinked", { name: name || "?" }))
    } else if (hadExisting) {
      toast.info(t("page.linkAlreadyExists"))
    }

    await fetchTreeById(treeId, { silent: true })
    setIsLinkChildOpen(false)
    setLinkChildParentIds([])
  }

  const handleDeleteRelation = async (relId: string) => {
    if (!confirm(t("page.deleteLinkConfirm"))) return
    const result = await deleteRelationship(relId)
    if (result.success) {
      toast.success(t("page.linkDeleted"))
      if (treeId) fetchTreeById(treeId, { silent: true })
    } else toast.error(result.message)
  }

  const runExport = async (kind: "gedcom" | "pdf") => {
    if (!treeId || !currentTree?.name) return
    setExportBusy(true)
    try {
      if (kind === "gedcom") await exportTreeGedcom(treeId, currentTree.name)
      else await exportTreePdf(treeId, currentTree.name)
      toast.success(kind === "gedcom" ? t("page.exportGedcomSuccess") : t("page.exportPdfSuccess"))
    } catch (err) {
      toast.error(translateApiError(getApiErrorPayload(err), "page.exportFailed"))
    } finally {
      setExportBusy(false)
    }
  }

  const runImportGedcom = async (file: File) => {
    if (!treeId) return
    setImportBusy(true)
    try {
      const result = await importTreeGedcom(treeId, file)
      await fetchTreeById(treeId)
      toast.success(t("page.importGedcomSuccess", { count: result.importedPersons }))
    } catch (err) {
      toast.error(translateApiError(getApiErrorPayload(err), "page.importFailed"))
    } finally {
      setImportBusy(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex ${pageHeight} items-center justify-center`}>
        <Skeleton className="size-12 rounded-full" />
      </div>
    )
  }

  if (error || !currentTree) {
    return (
      <div className={`flex ${pageHeight} flex-col items-center justify-center gap-4`}>
        <p className="text-muted-foreground">{error || t("page.treeNotFound")}</p>
        <Button onClick={() => navigate(publicDemo ? "/" : "/dashboard")}>{t("common:actions.back")}</Button>
      </div>
    )
  }

  return (
    <div className={`flex ${pageHeight} w-full flex-col`}>
      {(isDemo || readOnly) && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <Eye className="size-4 shrink-0" />
          <span>
            {isDemo
              ? canWrite
                ? t("page.demoSharedWrite")
                : t("page.demoReadOnly")
              : isPublicRoute && !isAuthenticated
                ? t("page.publicReadOnly")
                : readOnly && isAuthenticated
                  ? t("page.authReadOnly")
                  : t("page.guestReadOnly")}
          </span>
          {(publicDemo || (readOnly && !isAuthenticated)) && (
            <>
              <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate("/login")}>
                {t("page.login")}
              </Button>
              <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate("/register")}>
                {t("page.createAccount")}
              </Button>
            </>
          )}
          {publicDemo && canWrite && (
            <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate("/register")}>
              {t("page.createMyTree")}
            </Button>
          )}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
      <div className="relative min-w-0 flex-1">
        <TreeCanvas
          people={people}
          tweaks={tweaks}
          positions={positions}
          setPositions={setPositions}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
          hoverId={hoverId}
          onHover={setHoverId}
          onOpenAdd={handleOpenAddModal}
          onLinkExistingChild={handleOpenLinkChildModal}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenTweaks={() => setIsTweaksOpen(true)}
          onSetTweak={handleSetTweak}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReorganize={handleReorganize}
          fitRequestId={fitRequestId}
          readOnly={readOnly}
          canDrag={canDrag}
          isDemo={isDemo}
          canShare={canShare}
          canExport={canExport}
          canImport={canImport}
          exportBusy={exportBusy}
          importBusy={importBusy}
          onExportGedcom={() => void runExport("gedcom")}
          onExportPdf={() => void runExport("pdf")}
          onImportGedcom={(file) => void runImportGedcom(file)}
          onCardDragStateChange={(dragging, pending) => {
            isDraggingCardRef.current = dragging
            if (dragging) {
              positionsDirtyRef.current = true
              return
            }
            if (!canWrite) return
            const snapshot = pending
              ? { ...positionsRef.current, [pending.id]: { x: pending.x, y: pending.y } }
              : positionsRef.current
            if (Object.keys(snapshot).length === 0) return
            updateNodePositions(
              Object.entries(snapshot).map(([id, position]) => ({ id, position }))
            )
          }}
        />
      </div>

      {selectedPerson && currentTree && (
        <SidePanel
          person={selectedPerson}
          people={people}
          currentTree={currentTree}
          onClose={() => setSelectedId(null)}
          onSelect={(id) => { setSelectedId(id); window.__focusOn?.(id) }}
          onSave={canEditPerson ? handleSidePanelSave : undefined}
          onAddRelation={(p) => {
            setRelationPersonData(currentTree.Person?.find((x) => x.id === p.id) || personForEdit(p, currentTree.id))
            setIsRelationOpen(true)
          }}
          onAddChildRelation={handleOpenAddModal}
          onLinkExistingChild={handleOpenLinkChildModal}
          onDelete={handleDeletePerson}
          onDeleteRelation={handleDeleteRelation}
          readOnly={readOnly}
          canEditInfo={canEditPerson}
          canChangePhoto={canChangePhoto}
          canVersioning={canVersioning}
          onPersonRestored={() => treeId && void fetchTreeById(treeId)}
          onChangePhoto={handleChangePhoto}
        />
      )}
      </div>

      <AddPersonDialog
        open={isAddOpen}
        onClose={() => { setIsAddOpen(false); setAddPersonRelData({ parentId: null, parent2Id: null, relType: null }) }}
        onSubmit={handleAddPerson}
        treeName={currentTree.name}
        treeId={currentTree.id}
        parentId={addPersonRelData.parentId}
        parent2Id={addPersonRelData.parent2Id}
        relationType={addPersonRelData.relType}
      />

      <ShareDialog
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        treeId={currentTree.id}
        visibility={currentTree.visibility || (currentTree.isPublic ? "PUBLIC" : "PRIVATE")}
        canManage={!isDemo && !readOnly && treeAccess?.role === "owner"}
      />

      <TreeSettingsSheet
        open={isTweaksOpen}
        onClose={() => setIsTweaksOpen(false)}
        tweaks={tweaks}
        onSetTweak={handleSetTweak}
      />

      {isRelationOpen && relationPersonData && (
        <AddRelationDialog
          open={isRelationOpen}
          onClose={() => { setIsRelationOpen(false); setRelationPersonData(null) }}
          person={people.find((p: NormalizedPerson) => p.id === relationPersonData.id)!}
          people={people}
          onSubmit={handleAddRelationSubmit}
        />
      )}

      {isLinkChildOpen && (
        <LinkExistingChildDialog
          open={isLinkChildOpen}
          onClose={() => { setIsLinkChildOpen(false); setLinkChildParentIds([]) }}
          parentIds={linkChildParentIds}
          people={people}
          onSubmit={handleLinkExistingChild}
        />
      )}
    </div>
  )
}
