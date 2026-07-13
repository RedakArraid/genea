import api from "@/lib/api"
import type { SubtreeAttachAs, SubtreeClipboardMode, SubtreeClipboardPayload } from "@/lib/subtree-clipboard"

export interface ExtractSubtreeResponse {
  sourceTreeId: string
  rootPersonId: string
  mode: SubtreeClipboardMode
  personCount: number
  clipboard: SubtreeClipboardPayload
}

export interface PasteSubtreeResponse {
  message: string
  pastedPersonCount: number
  pastedRootId: string | null
  idMap: Record<string, string>
  demoForkTreeId?: string
}

export async function extractSubtree(
  treeId: string,
  rootPersonId: string,
  mode: SubtreeClipboardMode = "branch"
) {
  const { data } = await api.post<ExtractSubtreeResponse>(`/family-trees/${treeId}/subtrees/extract`, {
    rootPersonId,
    mode,
  })
  return data
}

export async function pasteSubtree(
  targetTreeId: string,
  body: {
    clipboard: SubtreeClipboardPayload
    rootPersonId: string
    sourceTreeId?: string
    anchor?: { x: number; y: number }
    attachToPersonId?: string
    attachAs?: SubtreeAttachAs
  }
) {
  const { data } = await api.post<PasteSubtreeResponse>(`/family-trees/${targetTreeId}/subtrees/paste`, body)
  return data
}
