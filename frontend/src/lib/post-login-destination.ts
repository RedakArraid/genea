import api from "@/lib/api"

export const LAST_TREE_STORAGE_KEY = "geneamap_last_tree_id"

/** Où envoyer l'utilisateur après connexion (évite un dashboard vide). */
export async function resolvePostLoginPath(requestedRedirect: string): Promise<string> {
  if (requestedRedirect && requestedRedirect !== "/dashboard") {
    return requestedRedirect.startsWith("/") ? requestedRedirect : "/dashboard"
  }

  try {
    const { data } = await api.get("/family-trees")
    const owned = data.trees ?? []
    const shared = data.sharedTrees ?? []
    const all = [...owned, ...shared] as Array<{ id: string }>

    const lastId = localStorage.getItem(LAST_TREE_STORAGE_KEY)
    if (lastId && all.some((t) => t.id === lastId)) {
      return `/family-tree/${lastId}`
    }
    if (all.length === 1) {
      return `/family-tree/${all[0].id}`
    }
  } catch {
    // fallback dashboard
  }

  return "/dashboard"
}

export function rememberLastTreeId(treeId: string) {
  localStorage.setItem(LAST_TREE_STORAGE_KEY, treeId)
}
