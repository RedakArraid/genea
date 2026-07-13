import { useEffect } from "react"
import { isEditableElement, isModKey } from "@/lib/keyboard"

export interface TreeKeyboardShortcutHandlers {
  onCopyBranch?: () => void
  onCopyEntire?: () => void
  onPasteAsChild?: () => void
  onPasteAsSpouse?: () => void
  onStartCanvasPaste?: () => void
  onCancelPasteMode?: () => void
  onDeselect?: () => void
}

export interface UseTreeKeyboardShortcutsOptions extends TreeKeyboardShortcutHandlers {
  enabled?: boolean
  blocked?: boolean
  pasteMode?: boolean
  canCopy?: boolean
  canPaste?: boolean
  hasSelection?: boolean
}

export function useTreeKeyboardShortcuts({
  enabled = true,
  blocked = false,
  pasteMode = false,
  canCopy = false,
  canPaste = false,
  hasSelection = false,
  onCopyBranch,
  onCopyEntire,
  onPasteAsChild,
  onPasteAsSpouse,
  onStartCanvasPaste,
  onCancelPasteMode,
  onDeselect,
}: UseTreeKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled || blocked) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target)) return

      if (event.key === "Escape") {
        if (pasteMode) {
          event.preventDefault()
          onCancelPasteMode?.()
        } else if (hasSelection) {
          event.preventDefault()
          onDeselect?.()
        }
        return
      }

      if (!isModKey(event)) return
      const key = event.key.toLowerCase()

      if (key === "c" && !event.altKey && canCopy && hasSelection) {
        event.preventDefault()
        if (event.shiftKey) onCopyEntire?.()
        else onCopyBranch?.()
        return
      }

      if (key === "v" && canPaste) {
        if (event.shiftKey && !event.altKey) {
          event.preventDefault()
          onStartCanvasPaste?.()
          return
        }
        if (event.altKey && hasSelection) {
          event.preventDefault()
          onPasteAsSpouse?.()
          return
        }
        if (!event.shiftKey && !event.altKey) {
          event.preventDefault()
          if (hasSelection) onPasteAsChild?.()
          else onStartCanvasPaste?.()
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    enabled,
    blocked,
    pasteMode,
    canCopy,
    canPaste,
    hasSelection,
    onCopyBranch,
    onCopyEntire,
    onPasteAsChild,
    onPasteAsSpouse,
    onStartCanvasPaste,
    onCancelPasteMode,
    onDeselect,
  ])
}
