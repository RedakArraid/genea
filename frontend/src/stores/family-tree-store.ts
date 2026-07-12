import { create } from "zustand"
import api from "@/lib/api"
import { getApiErrorPayload, translateApiError } from "@/lib/translate-error"
import type { FamilyTree, Person, Position, TreeAccess, TreeCollaborator, TreeInvite, TreeType, TreeVisibility, TreeBackgroundMode, OrgLexiconConfig, OrgLexiconPreset } from "@/types"

function storeError(error: unknown, fallbackKey: string) {
  return translateApiError(getApiErrorPayload(error), fallbackKey)
}

/** L'API renvoie souvent l'arbre sans Person/Relationship — on fusionne pour ne pas vider le canvas. */
function mergeTreePatch(existing: FamilyTree | null, patch: FamilyTree): FamilyTree {
  if (!existing || existing.id !== patch.id) return patch
  return { ...existing, ...patch }
}

interface FamilyTreeState {
  trees: FamilyTree[]
  sharedTrees: FamilyTree[]
  currentTree: FamilyTree | null
  treeAccess: TreeAccess | null
  isLoading: boolean
  error: string | null
  fetchTrees: () => Promise<void>
  fetchTreeById: (treeId: string, options?: { silent?: boolean }) => Promise<{ notFound?: boolean } | void>
  fetchCollaborators: (treeId: string) => Promise<{ collaborators: TreeCollaborator[]; invites: TreeInvite[] } | null>
  inviteCollaborator: (
    treeId: string,
    email: string,
    role: "VIEWER" | "EDITOR"
  ) => Promise<{
    success: boolean
    message?: string
    invite?: { token: string; email: string; role: string }
    collaborator?: { userId: string; email: string; role: string }
    emailSent?: boolean
  }>
  revokeInvite: (treeId: string, inviteId: string) => Promise<{ success: boolean; message?: string }>
  acceptInvite: (token: string) => Promise<{ success: boolean; message?: string; treeId?: string }>
  removeCollaborator: (treeId: string, userId: string) => Promise<{ success: boolean; message?: string }>
  updateVisibility: (treeId: string, visibility: TreeVisibility) => Promise<{ success: boolean; message?: string }>
  createTree: (data: {
    name: string
    description?: string
    isPublic?: boolean
    treeType?: TreeType
    orgLexiconPreset?: OrgLexiconPreset
  }) => Promise<{ success: boolean; tree?: FamilyTree; message?: string }>
  updateTree: (treeId: string, data: Partial<FamilyTree>) => Promise<{ success: boolean; message?: string }>
  updateTreeBackground: (
    treeId: string,
    data: {
      backgroundImageUrl?: string | null
      backgroundMode?: TreeBackgroundMode
      backgroundOpacity?: number
      backgroundOverlay?: boolean
      backgroundTileSize?: number
    }
  ) => Promise<{ success: boolean; message?: string }>
  updateTreeLexicon: (
    treeId: string,
    data: { orgLexicon?: Partial<OrgLexiconConfig>; orgLexiconPreset?: OrgLexiconPreset }
  ) => Promise<{ success: boolean; message?: string }>
  deleteTree: (treeId: string) => Promise<{ success: boolean; message?: string }>
  addPerson: (treeId: string, personData: Record<string, unknown> & { position?: Position }) => Promise<{ success: boolean; person?: Person; message?: string }>
  updatePerson: (personId: string, personData: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
  deletePerson: (personId: string) => Promise<{ success: boolean; message?: string }>
  addRelationship: (data: { sourceId: string; targetId: string; type: string }) => Promise<{ success: boolean; message?: string; statusCode?: number }>
  deleteRelationship: (relationshipId: string) => Promise<{ success: boolean; message?: string }>
  updateNodePositions: (nodePositions: { id: string; position: Position }[]) => Promise<void>
  resetState: () => void
}

export const useFamilyTreeStore = create<FamilyTreeState>((set, get) => ({
  trees: [],
  sharedTrees: [],
  currentTree: null,
  treeAccess: null,
  isLoading: false,
  error: null,

  fetchTrees: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get("/family-trees")
      set({
        trees: data.trees,
        sharedTrees: data.sharedTrees ?? [],
        isLoading: false,
      })
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.fetchTreesError")
      set({ error: message, isLoading: false })
    }
  },

  fetchTreeById: async (treeId, options) => {
    const silent = options?.silent ?? false
    if (!silent) set({ isLoading: true, error: null })
    try {
      const { data } = await api.get(`/family-trees/${treeId}`)
      set({ currentTree: data.tree, treeAccess: data.access ?? null, isLoading: false, error: null })
    } catch (error: unknown) {
      const statusCode =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined
      const message = storeError(error, "tree:store.fetchTreeError")
      set({ error: message, isLoading: false, currentTree: statusCode === 404 ? null : get().currentTree })
      return { notFound: statusCode === 404 }
    }
  },

  createTree: async (treeData) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post("/family-trees", treeData)
      set((state) => ({ trees: [...state.trees, data.tree], isLoading: false }))
      return { success: true, tree: data.tree }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.createTreeError")
      set({ isLoading: false })
      return { success: false, message }
    }
  },

  updateTree: async (treeId, treeData) => {
    try {
      const { data } = await api.put(`/family-trees/${treeId}`, treeData)
      set((state) => ({
        trees: state.trees.map((t) => (t.id === treeId ? mergeTreePatch(t, data.tree) : t)),
        currentTree:
          state.currentTree?.id === treeId
            ? mergeTreePatch(state.currentTree, data.tree)
            : state.currentTree,
      }))
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.updateTreeError")
      return { success: false, message }
    }
  },

  updateTreeBackground: async (treeId, backgroundData) => {
    try {
      const { data } = await api.patch(`/family-trees/${treeId}/background`, backgroundData)
      set((state) => ({
        trees: state.trees.map((t) => (t.id === treeId ? mergeTreePatch(t, data.tree) : t)),
        currentTree:
          state.currentTree?.id === treeId
            ? mergeTreePatch(state.currentTree, data.tree)
            : state.currentTree,
      }))
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.updateTreeBackgroundError")
      return { success: false, message }
    }
  },

  updateTreeLexicon: async (treeId, lexiconData) => {
    try {
      const { data } = await api.patch(`/family-trees/${treeId}/lexicon`, lexiconData)
      set((state) => ({
        trees: state.trees.map((t) => (t.id === treeId ? mergeTreePatch(t, data.tree) : t)),
        currentTree:
          state.currentTree?.id === treeId
            ? mergeTreePatch(state.currentTree, data.tree)
            : state.currentTree,
      }))
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.updateTreeLexiconError")
      return { success: false, message }
    }
  },

  deleteTree: async (treeId) => {
    try {
      await api.delete(`/family-trees/${treeId}`)
      set((state) => ({
        trees: state.trees.filter((t) => t.id !== treeId),
        currentTree: state.currentTree?.id === treeId ? null : state.currentTree,
      }))
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.deleteTreeError")
      return { success: false, message }
    }
  },

  addPerson: async (treeId, personData) => {
    try {
      const { position, ...raw } = personData
      const payload: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(raw)) {
        if (value === undefined || value === "") continue
        payload[key] = value
      }
      const { data } = await api.post(`/persons/tree/${treeId}`, payload)
      const nodePosition = position || { x: 0, y: 0 }
      await api.post("/node-positions", {
        nodeId: data.person.id,
        treeId,
        x: nodePosition.x,
        y: nodePosition.y,
      })
      return { success: true, person: data.person }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.addPersonError")
      return { success: false, message }
    }
  },

  updatePerson: async (personId, personData) => {
    try {
      const fields: Record<string, unknown> = {}
      Object.entries(personData).forEach(([key, value]) => {
        if (value !== undefined) fields[key] = value
      })
      if (fields.photoUrl && String(fields.photoUrl).startsWith("data:")) {
        delete fields.photoUrl
      }
      await api.put(`/persons/${personId}`, fields)
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.updatePersonError")
      return { success: false, message }
    }
  },

  deletePerson: async (personId) => {
    try {
      await api.delete(`/persons/${personId}`)
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.deletePersonError")
      return { success: false, message }
    }
  },

  addRelationship: async (relationshipData) => {
    try {
      const { data } = await api.post("/relationships", relationshipData)
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const statusCode =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined
      const message = storeError(error, "tree:store.addRelationError")
      return { success: false, message, statusCode }
    }
  },

  deleteRelationship: async (relationshipId) => {
    try {
      await api.delete(`/relationships/${relationshipId}`)
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.deleteRelationError")
      return { success: false, message }
    }
  },

  updateNodePositions: async (nodePositions) => {
    const treeId = get().currentTree?.id
    if (!treeId) return

    try {
      const { data } = await api.get(`/node-positions/tree/${treeId}`)
      const existing = data.nodePositions || []
      const saved: import("@/types").NodePosition[] = []

      for (const pos of nodePositions) {
        const found = existing.find((p: { nodeId: string }) => p.nodeId === pos.id)
        if (found) {
          const { data: updated } = await api.put(`/node-positions/${found.id}`, {
            x: pos.position.x,
            y: pos.position.y,
          })
          if (updated.nodePosition) saved.push(updated.nodePosition)
        } else {
          const { data: created } = await api.post("/node-positions", {
            nodeId: pos.id,
            treeId,
            x: pos.position.x,
            y: pos.position.y,
          })
          if (created.nodePosition) saved.push(created.nodePosition)
        }
      }

      if (saved.length > 0) {
        set((state) => {
          if (!state.currentTree) return {}
          const byNodeId = new Map(
            (state.currentTree.NodePosition || []).map((np) => [np.nodeId, np])
          )
          for (const np of saved) byNodeId.set(np.nodeId, np)
          return {
            currentTree: {
              ...state.currentTree,
              NodePosition: Array.from(byNodeId.values()),
            },
          }
        })
      }
    } catch (error) {
      console.error("Erreur positions:", error)
    }
  },

  resetState: () => set({ currentTree: null, treeAccess: null, isLoading: false, error: null }),

  fetchCollaborators: async (treeId) => {
    try {
      const { data } = await api.get(`/family-trees/${treeId}/collaborators`)
      return { collaborators: data.collaborators, invites: data.invites }
    } catch {
      return null
    }
  },

  inviteCollaborator: async (treeId, email, role) => {
    try {
      const { data } = await api.post(`/family-trees/${treeId}/collaborators`, { email, role })
      return {
        success: true,
        message: data.message,
        invite: data.invite,
        collaborator: data.collaborator,
        emailSent: data.emailSent,
      }
    } catch (error: unknown) {
      const message = storeError(error, "tree:store.inviteError")
      return { success: false, message }
    }
  },

  revokeInvite: async (treeId, inviteId) => {
    try {
      const { data } = await api.delete(`/family-trees/${treeId}/invites/${inviteId}`)
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const message = storeError(error, "errors:GENERIC")
      return { success: false, message }
    }
  },

  acceptInvite: async (token) => {
    try {
      const { data } = await api.post(`/family-trees/invites/${token}/accept`)
      await get().fetchTrees()
      return { success: true, message: data.message, treeId: data.treeId }
    } catch (error: unknown) {
      const message = storeError(error, "tree:invite.invalid")
      return { success: false, message }
    }
  },

  removeCollaborator: async (treeId, userId) => {
    try {
      await api.delete(`/family-trees/${treeId}/collaborators/${userId}`)
      return { success: true }
    } catch (error: unknown) {
      const message = storeError(error, "errors:GENERIC")
      return { success: false, message }
    }
  },

  updateVisibility: async (treeId, visibility) => {
    try {
      const { data } = await api.put(`/family-trees/${treeId}/visibility`, { visibility })
      set((state) => ({
        currentTree:
          state.currentTree?.id === treeId
            ? { ...state.currentTree, visibility, isPublic: visibility === "PUBLIC" }
            : state.currentTree,
      }))
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const message = storeError(error, "errors:GENERIC")
      return { success: false, message }
    }
  },
}))
