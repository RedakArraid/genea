import type { Person, Relationship } from "@/types"

export type SubtreeClipboardMode = "branch" | "entire"
export type SubtreeAttachAs = "child" | "spouse"

export interface SubtreeClipboardPayload {
  persons: Array<
    Pick<
      Person,
      | "id"
      | "firstName"
      | "lastName"
      | "birthDate"
      | "birthPlace"
      | "deathDate"
      | "occupation"
      | "biography"
      | "gender"
    >
  >
  relationships: Array<Pick<Relationship, "type" | "sourceId" | "targetId">>
  positions: Array<{ nodeId: string; x: number; y: number }>
}

export interface SubtreeClipboardState {
  sourceTreeId: string
  sourceTreeName?: string
  rootPersonId: string
  mode: SubtreeClipboardMode
  personCount: number
  clipboard: SubtreeClipboardPayload
}

const STORAGE_KEY = "geneamap.subtreeClipboard"

export function loadSubtreeClipboard(): SubtreeClipboardState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SubtreeClipboardState
    if (!parsed?.clipboard?.persons?.length) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSubtreeClipboard(state: SubtreeClipboardState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearSubtreeClipboard() {
  sessionStorage.removeItem(STORAGE_KEY)
}
