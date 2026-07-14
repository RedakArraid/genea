import type { NormalizedPerson } from "@/types"
import type { buildConnections } from "@/utils/tree-layout"

const CANVAS_PADDING = 80
const VIEW_PADDING = 24

export function computeMarketingConnectionBounds(
  people: NormalizedPerson[],
  positions: Record<string, { x: number; y: number }>,
  cardW: number,
  cardH: number,
  connections: ReturnType<typeof buildConnections>
) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const include = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  for (const p of people) {
    const pos = positions[p.id]
    if (!pos) continue
    include(pos.x, pos.y)
    include(pos.x + cardW, pos.y + cardH)
  }

  for (const c of connections) {
    if (c.midX != null && c.midY != null) include(c.midX, c.midY)
  }

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, width: 800, height: 600 }
  }

  minX -= CANVAS_PADDING
  minY -= CANVAS_PADDING
  maxX += CANVAS_PADDING
  maxY += CANVAS_PADDING

  return {
    minX,
    minY,
    width: Math.max(400, maxX - minX),
    height: Math.max(300, maxY - minY),
  }
}

export function computeMarketingContentBounds(
  positions: Record<string, { x: number; y: number }>,
  personIds: Set<string>,
  cardW: number,
  cardH: number
) {
  const entries = Object.entries(positions).filter(([id]) => personIds.has(id))
  if (entries.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [, pos] of entries) {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + cardW)
    maxY = Math.max(maxY, pos.y + cardH)
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

export function computeMarketingFitScale(
  bounds: { width: number; height: number },
  availW: number,
  availH: number
) {
  if (bounds.width <= 0 || bounds.height <= 0) return 0.5
  const fitScale = Math.min(availW / bounds.width, availH / bounds.height)
  return Math.max(0.12, Math.min(1.25, fitScale))
}

export { VIEW_PADDING as MARKETING_VIEW_PADDING }
