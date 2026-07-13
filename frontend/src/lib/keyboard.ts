export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}

export function isModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/** Affiche un raccourci type « ⌘C » ou « Ctrl+C ». */
export function modShortcutLabel(
  key: string,
  options: { shift?: boolean; alt?: boolean } = {}
): string {
  const mac = isMacPlatform()
  const mod = mac ? "⌘" : "Ctrl"
  const parts: string[] = [mod]
  if (options.shift) parts.push(mac ? "⇧" : "Shift")
  if (options.alt) parts.push(mac ? "⌥" : "Alt")
  parts.push(key.toUpperCase())
  return mac ? parts.join("") : parts.join("+")
}
