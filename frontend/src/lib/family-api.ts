import api from './api'
import type { Person } from '../types'
export interface FamilyLink { type: 'parent' | 'child' | 'spouse'; personId: string }
export async function createFamilyMember(treeId: string, fields: Record<string, unknown>, links: FamilyLink[]) {
  const { data } = await api.post<{ person: Person; created: boolean }>(`/persons/tree/${treeId}/family-member`, { ...fields, links })
  return data
}
export async function linkFamilyChild(treeId: string, childId: string, parentIds: string[]) {
  const { data } = await api.post(`/persons/tree/${treeId}/link-child`, { childId, parentIds })
  return data
}

import i18n from '@/i18n'
import { getApiErrorPayload, translateApiError } from './translate-error'
export function familyErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error)
  const code = payload?.code
  return code && i18n.exists(`family:errors.${code}`)
    ? String(i18n.t(`family:errors.${code}`))
    : translateApiError(payload, 'tree:store.addPersonError')
}
