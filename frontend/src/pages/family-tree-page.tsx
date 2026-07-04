import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { normalizePersons, computeLayout } from "@/utils/tree-layout"
import type { NormalizedPerson, Position, TreeTweaks } from "@/types"
import { TreeCanvas } from "@/components/family-tree/tree-canvas"
import { SidePanel } from "@/components/family-tree/side-panel"
import {
  AddPersonDialog,
  EditPersonDialog,
  ShareDialog,
  TreeSettingsSheet,
  AddRelationDialog,
} from "@/components/family-tree/dialogs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { uploadPersonPhoto, setPersonPhoto } from "@/lib/upload"

interface FamilyTreePageProps {
  treeIdOverride?: string
  publicDemo?: boolean
}

export default function FamilyTreePage({ treeIdOverride, publicDemo = false }: FamilyTreePageProps = {}) {
  const { id: paramTreeId } = useParams<{ id: string }>()
  const treeId = treeIdOverride ?? paramTreeId
  const navigate = useNavigate()
  const location = useLocation()

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
  const pageHeight = "h-[calc(100vh-3.5rem)]"

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [lastRelsHash, setLastRelsHash] = useState<string | null>(null)
  const [fitRequestId, setFitRequestId] = useState(0)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isTweaksOpen, setIsTweaksOpen] = useState(false)
  const [isRelationOpen, setIsRelationOpen] = useState(false)
  const [editingPersonData, setEditingPersonData] = useState<import("@/types").Person | null>(null)
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
    if (treeId) fetchTreeById(treeId)
    return () => resetState()
  }, [treeId, fetchTreeById, resetState])

  useEffect(() => {
    if (!currentTree?.Person?.length) return

    const normalizedPeople = normalizePersons(currentTree.Person, currentTree.Relationship)
    const dbPositions: Record<string, { x: number; y: number }> = {}
    currentTree.NodePosition?.forEach((np) => {
      dbPositions[np.nodeId] = { x: np.x, y: np.y }
    })

    const currentRelsHash = (currentTree.Relationship || [])
      .map((r) => `${r.id}-${r.type}-${r.sourceId}-${r.targetId}`)
      .sort()
      .join("|")

    const relsChanged = lastRelsHash !== null && lastRelsHash !== currentRelsHash
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
    setLastRelsHash(currentRelsHash)
  }, [currentTree])

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
    if (!canWrite || Object.keys(positions).length === 0 || !currentTree) return
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

  const handleReorganize = () => {
    if (!people.length) return
    const { positions: computed } = computeLayout(people, tweaks.layout, tweaks.density)
    setPositions(computed)
    if (!readOnly) {
      updateNodePositions(Object.entries(computed).map(([id, pos]) => ({ id, position: pos as Position })))
    }
    setFitRequestId((id) => id + 1)
    toast.success("Arbre réorganisé")
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
        toast.error("Échec de l'upload photo")
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
      toast.success(`${result.person.firstName} ajouté(e)`)
      fetchTreeById(treeId)
      setIsAddOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  const handleEditPerson = (person: NormalizedPerson) => {
    if (!canEditPerson) {
      toast.info("Les fiches personnes ne sont pas modifiables en démo")
      return
    }
    const raw = currentTree?.Person?.find((p) => p.id === person.id)
    if (raw) { setEditingPersonData(raw); setIsEditOpen(true) }
  }

  const handleEditSubmit = async (personId: string, formData: Record<string, string>, photoFile?: File | null) => {
    if (photoFile && treeId) {
      try {
        const { url } = await uploadPersonPhoto(photoFile, treeId, personId)
        await setPersonPhoto(personId, url)
        toast.success("Photo mise à jour")
        fetchTreeById(treeId)
        setIsEditOpen(false)
        if (!canEditPerson) return
      } catch {
        toast.error("Échec de l'upload photo")
        return
      }
    }
    if (!canEditPerson) return
    const result = await updatePerson(personId, formData)
    if (result.success) {
      toast.success("Personne mise à jour")
      if (treeId) fetchTreeById(treeId)
      setIsEditOpen(false)
    } else toast.error(result.message)
  }

  const handleChangePhoto = async (personId: string, file: File) => {
    if (!treeId) return
    const { url } = await uploadPersonPhoto(file, treeId, personId)
    await setPersonPhoto(personId, url)
    fetchTreeById(treeId)
  }

  const handleDeletePerson = async (personId: string) => {
    const person = people.find((p: NormalizedPerson) => p.id === personId)
    if (!confirm(`Supprimer ${person?.given} ${person?.sur} ?`)) return
    const result = await deletePerson(personId)
    if (result.success) {
      toast.success("Personne supprimée")
      setSelectedId(null)
      if (treeId) fetchTreeById(treeId)
    } else toast.error(result.message)
  }

  const handleAddRelationSubmit = async (sourceId: string, targetId: string, relType: string) => {
    const source = relType === "parent" ? sourceId : targetId
    const target = relType === "parent" ? targetId : sourceId
    const type = relType === "spouse" ? "spouse" : "parent"
    const result = await addRelationship({ sourceId: source, targetId: target, type })
    if (result.success) {
      toast.success("Lien créé")
      if (treeId) fetchTreeById(treeId)
      setIsRelationOpen(false)
    } else toast.error(result.message)
  }

  const handleDeleteRelation = async (relId: string) => {
    if (!confirm("Supprimer ce lien ?")) return
    const result = await deleteRelationship(relId)
    if (result.success) {
      toast.success("Lien supprimé")
      if (treeId) fetchTreeById(treeId)
    } else toast.error(result.message)
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
        <p className="text-muted-foreground">{error || "Arbre introuvable"}</p>
        <Button onClick={() => navigate(publicDemo ? "/" : "/dashboard")}>Retour</Button>
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
                ? "Mode démo partagé — structure libre (ajouts, liens, photos, documents). Fiches texte verrouillées. Les changements sont visibles par tous."
                : "Mode démo — déplacez les cartes pour explorer. Connectez-vous pour ajouter, lier et sauvegarder."
              : "Mode lecture seule — vous pouvez explorer l'arbre mais pas le modifier"}
          </span>
          {publicDemo && !canWrite && (
            <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
          )}
          {publicDemo && canWrite && (
            <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-background" onClick={() => navigate("/register")}>
              Créer mon arbre
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
        />
      </div>

      {selectedPerson && currentTree && (
        <SidePanel
          person={selectedPerson}
          people={people}
          currentTree={currentTree}
          onClose={() => setSelectedId(null)}
          onSelect={(id) => { setSelectedId(id); window.__focusOn?.(id) }}
          onEdit={handleEditPerson}
          onAddRelation={(p) => { setEditingPersonData(currentTree.Person?.find((x) => x.id === p.id) || null); setIsRelationOpen(true) }}
          onAddChildRelation={handleOpenAddModal}
          onDelete={handleDeletePerson}
          onDeleteRelation={handleDeleteRelation}
          readOnly={readOnly}
          canEditInfo={canEditPerson}
          canChangePhoto={canChangePhoto}
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

      <EditPersonDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingPersonData(null) }}
        onSubmit={handleEditSubmit}
        person={editingPersonData}
        treeId={currentTree.id}
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

      {isRelationOpen && editingPersonData && (
        <AddRelationDialog
          open={isRelationOpen}
          onClose={() => { setIsRelationOpen(false); setEditingPersonData(null) }}
          person={people.find((p: NormalizedPerson) => p.id === editingPersonData.id)!}
          people={people}
          onSubmit={handleAddRelationSubmit}
        />
      )}
    </div>
  )
}
