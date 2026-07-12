import api from "@/lib/api"
import type { PersonDocument, StorageConfig } from "@/types"

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "")

export interface UploadPhotoResult {
  url: string
  key: string
}

/** Normalise une URL média (proxy API ou MinIO direct) pour affichage dans le navigateur */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("data:")) return url
  if (url.startsWith("blob:")) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("/api/")) return `${API_BASE}${url}`
  return url
}

/** URLs servies par le proxy API - nécessitent le JWT (pas envoyé par <img>) */
export function isProtectedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const resolved = resolveMediaUrl(url) || url
  return resolved.includes("/uploads/file/")
}

export async function uploadPersonPhoto(
  file: File,
  treeId: string,
  personId?: string
): Promise<UploadPhotoResult> {
  const form = new FormData()
  form.append("photo", file)
  form.append("treeId", treeId)
  if (personId) form.append("personId", personId)

  const { data } = await api.post<UploadPhotoResult>("/uploads/photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export async function uploadTreeBackground(file: File, treeId: string): Promise<UploadPhotoResult> {
  const form = new FormData()
  form.append("background", file)
  form.append("treeId", treeId)

  const { data } = await api.post<UploadPhotoResult>("/uploads/tree-background", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export async function setPersonPhoto(personId: string, photoUrl: string): Promise<void> {
  await api.patch(`/persons/${personId}/photo`, { photoUrl })
}

export async function getStorageConfig(): Promise<StorageConfig> {
  const { data } = await api.get<StorageConfig>("/uploads/status")
  return data
}

export async function fetchPersonDocuments(personId: string): Promise<PersonDocument[]> {
  const { data } = await api.get<{ documents: PersonDocument[] }>(`/persons/${personId}/documents`)
  return data.documents
}

export async function uploadPersonDocument(
  personId: string,
  file: File,
  title: string,
  category: string
): Promise<PersonDocument> {
  const form = new FormData()
  form.append("file", file)
  form.append("title", title)
  form.append("category", category)

  const { data } = await api.post<{ document: PersonDocument }>(
    `/persons/${personId}/documents`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return data.document
}

export async function deletePersonDocument(personId: string, docId: string): Promise<void> {
  await api.delete(`/persons/${personId}/documents/${docId}`)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  birth: "Acte de naissance",
  marriage: "Acte de mariage",
  death: "Acte de décès",
  census: "Recensement / archive",
  photo: "Photo / scan",
  other: "Autre",
}

export type { StorageConfig } from "@/types"
