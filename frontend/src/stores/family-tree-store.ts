import { create } from "zustand"
import api from "@/lib/api"
import type { FamilyTree, Person, Position, TreeAccess, TreeCollaborator, TreeInvite, TreeVisibility } from "@/types"

interface FamilyTreeState {
  trees: FamilyTree[]
  sharedTrees: FamilyTree[]
  currentTree: FamilyTree | null
  treeAccess: TreeAccess | null
  isLoading: boolean
  error: string | null
  fetchTrees: () => Promise<void>
  fetchTreeById: (treeId: string) => Promise<void>
  fetchCollaborators: (treeId: string) => Promise<{ collaborators: TreeCollaborator[]; invites: TreeInvite[] } | null>
  inviteCollaborator: (treeId: string, email: string, role: "VIEWER" | "EDITOR") => Promise<{ success: boolean; message?: string }>
  removeCollaborator: (treeId: string, userId: string) => Promise<{ success: boolean; message?: string }>
  updateVisibility: (treeId: string, visibility: TreeVisibility) => Promise<{ success: boolean; message?: string }>
  createTree: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<{ success: boolean; tree?: FamilyTree; message?: string }>
  updateTree: (treeId: string, data: Partial<FamilyTree>) => Promise<{ success: boolean; message?: string }>
  deleteTree: (treeId: string) => Promise<{ success: boolean; message?: string }>
  addPerson: (treeId: string, personData: Record<string, unknown> & { position?: Position }) => Promise<{ success: boolean; person?: Person; message?: string }>
  updatePerson: (personId: string, personData: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
  deletePerson: (personId: string) => Promise<{ success: boolean; message?: string }>
  addRelationship: (data: { sourceId: string; targetId: string; type: string }) => Promise<{ success: boolean; message?: string }>
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
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors du chargement des arbres"
      set({ error: message, isLoading: false })
    }
  },

  fetchTreeById: async (treeId) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get(`/family-trees/${treeId}`)
      set({ currentTree: data.tree, treeAccess: data.access ?? null, isLoading: false })
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors du chargement de l'arbre"
      set({ error: message, isLoading: false })
    }
  },

  createTree: async (treeData) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post("/family-trees", treeData)
      set((state) => ({ trees: [...state.trees, data.tree], isLoading: false }))
      return { success: true, tree: data.tree }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de la création"
      set({ isLoading: false })
      return { success: false, message }
    }
  },

  updateTree: async (treeId, treeData) => {
    try {
      const { data } = await api.put(`/family-trees/${treeId}`, treeData)
      set((state) => ({
        trees: state.trees.map((t) => (t.id === treeId ? data.tree : t)),
        currentTree: state.currentTree?.id === treeId ? data.tree : state.currentTree,
      }))
      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de la mise à jour"
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
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de la suppression"
      return { success: false, message }
    }
  },

  addPerson: async (treeId, personData) => {
    try {
      const { data } = await api.post(`/persons/tree/${treeId}`, personData)
      const position = personData.position || { x: 0, y: 0 }
      await api.post("/node-positions", {
        nodeId: data.person.id,
        treeId,
        x: position.x,
        y: position.y,
      })
      return { success: true, person: data.person }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de l'ajout"
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
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de la mise à jour"
      return { success: false, message }
    }
  },

  deletePerson: async (personId) => {
    try {
      await api.delete(`/persons/${personId}`)
      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de la suppression"
      return { success: false, message }
    }
  },

  addRelationship: async (relationshipData) => {
    try {
      const { data } = await api.post("/relationships", relationshipData)
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de l'ajout de la relation"
      return { success: false, message }
    }
  },

  deleteRelationship: async (relationshipId) => {
    try {
      await api.delete(`/relationships/${relationshipId}`)
      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de la suppression"
      return { success: false, message }
    }
  },

  updateNodePositions: async (nodePositions) => {
    const treeId = get().currentTree?.id
    if (!treeId) return

    try {
      const { data } = await api.get(`/node-positions/tree/${treeId}`)
      const existing = data.nodePositions || []

      for (const pos of nodePositions) {
        const found = existing.find((p: { nodeId: string }) => p.nodeId === pos.id)
        if (found) {
          await api.put(`/node-positions/${found.id}`, { x: pos.position.x, y: pos.position.y })
        } else {
          await api.post("/node-positions", {
            nodeId: pos.id,
            treeId,
            x: pos.position.x,
            y: pos.position.y,
          })
        }
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
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de l'invitation"
      return { success: false, message }
    }
  },

  removeCollaborator: async (treeId, userId) => {
    try {
      await api.delete(`/family-trees/${treeId}/collaborators/${userId}`)
      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur"
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
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur"
      return { success: false, message }
    }
  },
}))
