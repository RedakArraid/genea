import api from "@/lib/api"

export interface PersonRevision {
  id: string
  personId: string
  action: string
  snapshot: Record<string, unknown>
  createdAt: string
}

export async function fetchPersonRevisions(personId: string) {
  const { data } = await api.get<{ revisions: PersonRevision[] }>(`/persons/${personId}/revisions`)
  return data.revisions
}

export async function restorePersonRevision(personId: string, revisionId: string) {
  const { data } = await api.post<{ person: unknown }>(
    `/persons/${personId}/revisions/${revisionId}/restore`,
  )
  return data
}
