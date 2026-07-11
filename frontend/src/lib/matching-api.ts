import api from "@/lib/api"

export interface TreeMatch {
  treeId: string
  treeName: string
  ownerName: string
  region: string
  sharedCount: number
  confidence: number
  via: string
}

export async function fetchTreeMatches(treeId: string) {
  const { data } = await api.get<{ matches: TreeMatch[]; matchingOptIn: boolean }>(
    `/family-trees/${treeId}/matches`,
  )
  return data
}

export async function updateMatchingOptIn(treeId: string, matchingOptIn: boolean) {
  const { data } = await api.put<{ matchingOptIn: boolean }>(
    `/family-trees/${treeId}/matching-opt-in`,
    { matchingOptIn },
  )
  return data
}
