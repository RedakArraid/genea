import type { CSSProperties } from "react"
import type { TreeBackgroundMode } from "@/types"

export interface TreeBackgroundConfig {
  imageUrl: string | null
  mode: TreeBackgroundMode
  opacity: number
  overlay: boolean
  tileSize: number
}

export function isTreeBackgroundActive(config?: TreeBackgroundConfig | null): boolean {
  return Boolean(config?.imageUrl && config.mode !== "NONE")
}

export function getDefaultBackgroundOpacity(mode: TreeBackgroundMode): number {
  return mode === "REPEAT" ? 0.15 : 0.35
}

/** Styles pour couvrir toute la zone canvas visible (sous la barre d'outils). */
export function buildViewportBackgroundStyle(
  config: TreeBackgroundConfig,
  displayUrl: string
): CSSProperties {
  const repeat = config.mode === "REPEAT"

  return {
    backgroundImage: `url("${displayUrl}")`,
    backgroundRepeat: repeat ? "repeat" : "no-repeat",
    backgroundSize: repeat ? `${config.tileSize}px` : "cover",
    backgroundPosition: "center",
    backgroundAttachment: "local",
    opacity: config.opacity,
  }
}
