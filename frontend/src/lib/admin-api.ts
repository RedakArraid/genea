import api from "@/lib/api"
import type { PlanId } from "@/types"

export type UserRole = "USER" | "ADMIN"

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  plan: PlanId
  role: UserRole
  createdAt: string
  updatedAt?: string
  treeCount?: number
}

export interface AdminStats {
  usersTotal: number
  treesTotal: number
  personsTotal: number
  documentsTotal: number
  photosTotal: number
  demoTrees: number
  publicTrees: number
  privateTrees: number
  newUsersWeek: number
  planDistribution: { plan: PlanId; count: number }[]
  recentUsers: AdminUser[]
}

export interface AdminTree {
  id: string
  name: string
  description?: string | null
  isPublic: boolean
  visibility: string
  isDemo: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
  User: { id: string; email: string; name?: string | null }
  _count: { Person: number }
}

export interface AdminStorageInfo {
  storage: {
    enabled: boolean
    ready: boolean
    proxyUrl?: string | null
    publicConfig?: Record<string, unknown>
  }
  counts: { documents: number; photos: number }
  recentDocuments: Array<{
    id: string
    title: string
    fileName: string
    mimeType: string
    sizeBytes: number
    category: string
    createdAt: string
    Person: { firstName: string; lastName: string }
  }>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats")
  return data
}

export interface AdminUserTree {
  id: string
  name: string
  isDemo: boolean
  visibility: string
  createdAt: string
  _count: { Person: number }
}

export interface AdminUserDetail extends AdminUser {
  FamilyTree?: AdminUserTree[]
  _count?: { FamilyTree: number; TreeCollaborator: number }
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  const { data } = await api.get<{ user: AdminUserDetail }>(`/admin/users/${id}`)
  return data.user
}

export async function fetchAdminUsers(params?: {
  search?: string
  plan?: string
  page?: number
}): Promise<{ users: AdminUser[]; pagination: Pagination }> {
  const { data } = await api.get("/admin/users", { params })
  return data
}

export async function updateAdminUser(
  id: string,
  payload: { name?: string; plan?: PlanId; role?: UserRole }
): Promise<AdminUser> {
  const { data } = await api.patch<{ user: AdminUser }>(`/admin/users/${id}`, payload)
  return data.user
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}

export async function fetchAdminTrees(params?: {
  isDemo?: string
  visibility?: string
  page?: number
}): Promise<{ trees: AdminTree[]; pagination: Pagination }> {
  const { data } = await api.get("/admin/trees", { params })
  return data
}

export async function deleteAdminTree(id: string): Promise<void> {
  await api.delete(`/admin/trees/${id}`)
}

export async function fetchDemoInfo(): Promise<{ tree: AdminTree | null }> {
  const { data } = await api.get("/admin/demo")
  return data
}

export async function resetDemoTree(): Promise<{ tree: AdminTree }> {
  const { data } = await api.post<{ tree: AdminTree }>("/admin/demo/reset")
  return data
}

export async function fetchAdminStorage(): Promise<AdminStorageInfo> {
  const { data } = await api.get<AdminStorageInfo>("/admin/storage")
  return data
}

export async function fetchAdminPlans(): Promise<{
  plans: Array<Record<string, unknown>>
  userCountByPlan: Record<string, number>
  usersTotal: number
}> {
  const { data } = await api.get("/admin/plans")
  return data
}

export interface PromoCode {
  id: string
  code: string
  description?: string | null
  discountType: "PERCENT" | "FIXED"
  discountValue: number
  maxUses?: number | null
  usedCount: number
  validFrom?: string | null
  validUntil?: string | null
  applicablePlans: PlanId[]
  active: boolean
  createdAt: string
}

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const { data } = await api.get<{ promoCodes: PromoCode[] }>("/admin/promo-codes")
  return data.promoCodes
}

export async function createPromoCode(payload: Record<string, unknown>): Promise<PromoCode> {
  const { data } = await api.post<{ promoCode: PromoCode }>("/admin/promo-codes", payload)
  return data.promoCode
}

export async function updatePromoCode(id: string, payload: Record<string, unknown>): Promise<PromoCode> {
  const { data } = await api.patch<{ promoCode: PromoCode }>(`/admin/promo-codes/${id}`, payload)
  return data.promoCode
}

export async function deletePromoCode(id: string): Promise<void> {
  await api.delete(`/admin/promo-codes/${id}`)
}
