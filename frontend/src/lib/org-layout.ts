/**
 * Moteur de layout organigramme (ESM) - miroir de shared/org-layout.js pour le navigateur.
 */

export const ORG_CARD_W = 200
export const ORG_CARD_H = 248
export const H_GAP_ORG_SPACIOUS = 72
export const H_GAP_ORG_COMPACT = 48
export const V_GAP_ORG_SPACIOUS = 148
export const V_GAP_ORG_COMPACT = 104
export const LAYOUT_ORIGIN_X = 40
export const LAYOUT_ORIGIN_Y = 40
export const STALE_LAYOUT_TOLERANCE = 12

const LAYOUT_PADDING = 80

/** Dimensions CSS des cartes org (person-card) — garder aligné avec le frontend. */
const ORG_PHOTO_H = 128
const ORG_META_PAD_Y = 16
const ORG_META_GAP = 2
const ORG_NAME_LINE_H = 16
const ORG_ROLE_LINE_H = 14
const ORG_HEIGHT_BUFFER = 12
const ORG_CONTENT_W = ORG_CARD_W - 16
/** Largeurs de glyphe volontairement larges → plus de lignes → hauteur légèrement surestimée. */
const ORG_NAME_CHAR_W = 7
const ORG_ROLE_CHAR_W = 5.5

type OrgPersonLike = {
  id: string
  generation?: number
  parentIds?: string[]
  given?: string
  sur?: string
  firstName?: string
  lastName?: string
  occupation?: string | null
}

function countWrappedLines(text: string, maxWidth: number, charWidth: number) {
  const raw = String(text || "").trim()
  if (!raw) return 1
  let total = 0
  for (const paragraph of raw.split(/\n/)) {
    const t = paragraph.trim()
    if (!t) {
      total += 1
      continue
    }
    const words = t.split(/\s+/)
    let lines = 1
    let lineWidth = 0
    for (const word of words) {
      const wordW = Math.max(charWidth, word.length * charWidth)
      if (wordW > maxWidth) {
        if (lineWidth > 0) {
          lines += 1
          lineWidth = 0
        }
        const chunks = Math.ceil(wordW / maxWidth)
        lines += chunks - 1
        lineWidth = wordW - (chunks - 1) * maxWidth
        continue
      }
      if (lineWidth === 0) {
        lineWidth = wordW
        continue
      }
      if (lineWidth + charWidth + wordW > maxWidth) {
        lines += 1
        lineWidth = wordW
      } else {
        lineWidth += charWidth + wordW
      }
    }
    total += lines
  }
  return Math.max(1, total)
}

/** Hauteur estimée d'une carte org (photo + nom + poste multi-lignes). */
export function estimateOrgCardHeight(person: OrgPersonLike) {
  const given = person.given || person.firstName || ""
  const sur = person.sur || person.lastName || ""
  const name =
    sur && sur !== "-"
      ? `${given} ${sur}`.trim()
      : String(given).trim() || "?"
  const role = String(person.occupation || "").trim()

  const nameLines = countWrappedLines(name, ORG_CONTENT_W, ORG_NAME_CHAR_W)
  const roleLines = role
    ? countWrappedLines(role, ORG_CONTENT_W, ORG_ROLE_CHAR_W)
    : 1

  const h =
    ORG_PHOTO_H +
    ORG_META_PAD_Y +
    nameLines * ORG_NAME_LINE_H +
    ORG_META_GAP +
    roleLines * ORG_ROLE_LINE_H +
    ORG_HEIGHT_BUFFER

  return Math.max(ORG_CARD_H, Math.ceil(h))
}

export function buildOrgCardHeights(people: OrgPersonLike[]) {
  const heights: Record<string, number> = {}
  for (const p of people) {
    heights[p.id] = estimateOrgCardHeight(p)
  }
  return heights
}

function groupByGeneration(people: Array<{ generation?: number; id: string }>) {
  const map = new Map<number, typeof people>()
  for (const p of people) {
    const g = p.generation ?? 1
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(p)
  }
  return map
}

function orgRowHubs<T extends { id: string }>(row: T[], people: Array<{ id: string; parentIds?: string[] }>): T[] {
  return row.filter((p) => people.some((c) => (c.parentIds || []).includes(p.id)))
}

export function orderOrgRow<T extends { id: string }>(row: T[], people: Array<{ id: string; parentIds?: string[] }>) {
  const hubs = orgRowHubs(row, people)
  if (hubs.length !== 1) return [...row].sort((a, b) => a.id.localeCompare(b.id))

  const hub = hubs[0]
  const others = row.filter((p) => p.id !== hub.id).sort((a, b) => a.id.localeCompare(b.id))
  const centerIdx = Math.floor(row.length / 2)
  const ordered = new Array<T | undefined>(row.length)
  ordered[centerIdx] = hub
  let left = centerIdx - 1
  let right = centerIdx + 1
  for (let i = 0; i < others.length; i++) {
    if (i % 2 === 0) {
      if (left >= 0) ordered[left--] = others[i]
      else if (right < row.length) ordered[right++] = others[i]
    } else if (right < row.length) {
      ordered[right++] = others[i]
    } else if (left >= 0) {
      ordered[left--] = others[i]
    }
  }
  return ordered.filter(Boolean) as T[]
}

function shiftGenerationX(
  positions: Record<string, { x: number; y: number }>,
  people: Array<{ id: string; generation?: number }>,
  generation: number,
  delta: number
) {
  if (!delta) return
  for (const p of people) {
    if ((p.generation ?? 1) === generation && positions[p.id]) {
      positions[p.id].x += delta
    }
  }
}

/** Écarte les cartes qui se chevauchent sur une même ligne (après centrage managers). */
function resolveOrgRowOverlaps(
  positions: Record<string, { x: number; y: number }>,
  people: Array<{ id: string; generation?: number }>,
  cardW: number,
  hGap: number
) {
  const byGen = groupByGeneration(people)
  const minStep = cardW + hGap

  for (const row of byGen.values()) {
    const ids = row
      .map((p) => p.id)
      .filter((id) => positions[id])
      .sort((a, b) => positions[a].x - positions[b].x)

    for (let i = 1; i < ids.length; i++) {
      const prevId = ids[i - 1]
      const curId = ids[i]
      const minX = positions[prevId].x + minStep
      if (positions[curId].x < minX) {
        const delta = minX - positions[curId].x
        for (let j = i; j < ids.length; j++) {
          positions[ids[j]].x += delta
        }
      }
    }
  }
}

function normalizeOrgLayoutOrigin(positions: Record<string, { x: number; y: number }>) {
  const xs = Object.values(positions).map((p) => p.x)
  if (!xs.length) return
  const shift = LAYOUT_ORIGIN_X - Math.min(...xs)
  if (shift === 0) return
  for (const pos of Object.values(positions)) {
    pos.x += shift
  }
}

export function computeVerticalOrg(
  people: OrgPersonLike[],
  density: "spacious" | "compact" = "spacious"
) {
  const hGap = density === "compact" ? H_GAP_ORG_COMPACT : H_GAP_ORG_SPACIOUS
  const vGap = density === "compact" ? V_GAP_ORG_COMPACT : V_GAP_ORG_SPACIOUS
  const cardW = ORG_CARD_W
  const cardHeights = buildOrgCardHeights(people)
  const byGen = groupByGeneration(people)
  const gens = Array.from(byGen.keys()).sort((a, b) => a - b)
  const positions: Record<string, { x: number; y: number }> = {}

  const rowWidths = gens.map((g) => {
    const n = byGen.get(g)!.length
    return n * cardW + Math.max(0, n - 1) * hGap
  })
  const maxRowW = Math.max(...rowWidths, cardW)
  let canvasW = maxRowW + LAYOUT_PADDING

  let y = LAYOUT_ORIGIN_Y
  for (const g of gens) {
    const row = orderOrgRow(byGen.get(g)!, people)
    const rowH = Math.max(...row.map((p) => cardHeights[p.id]), ORG_CARD_H)
    const rowW = row.length * cardW + Math.max(0, row.length - 1) * hGap
    let x = LAYOUT_ORIGIN_X + (maxRowW - rowW) / 2
    for (const p of row) {
      positions[p.id] = { x, y }
      x += cardW + hGap
    }
    y += rowH + vGap
  }

  for (const p of [...people].sort((a, b) => (b.generation ?? 1) - (a.generation ?? 1))) {
    const childIds = people.filter((c) => (c.parentIds || []).includes(p.id)).map((c) => c.id)
    if (!childIds.length) continue
    const xs = childIds.map((id) => positions[id]?.x).filter((x): x is number => typeof x === "number")
    if (!xs.length) continue
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs) + cardW
    const targetX = (minX + maxX) / 2 - cardW / 2
    const delta = targetX - positions[p.id].x
    const row = byGen.get(p.generation ?? 1) || []
    const shiftWholeRow = orgRowHubs(row, people).length === 1
    if (shiftWholeRow) {
      shiftGenerationX(positions, people, p.generation ?? 1, delta)
    } else {
      positions[p.id].x = targetX
    }
  }

  resolveOrgRowOverlaps(positions, people, cardW, hGap)
  normalizeOrgLayoutOrigin(positions)

  const maxX = Math.max(...Object.values(positions).map((pos) => pos.x)) + cardW
  canvasW = Math.max(maxRowW, maxX - LAYOUT_ORIGIN_X) + LAYOUT_PADDING

  return { positions, canvasW, canvasH: y + LAYOUT_PADDING / 2, cardHeights }
}

export function translatePositions(
  positions: Record<string, { x: number; y: number }>,
  { originY = LAYOUT_ORIGIN_Y, centerX }: { originY?: number; centerX?: number } = {}
) {
  const entries = Object.entries(positions)
  if (!entries.length) return {}

  const xs = entries.map(([, pos]) => pos.x)
  const ys = entries.map(([, pos]) => pos.y)
  const layoutCenterX = (Math.min(...xs) + Math.max(...xs) + ORG_CARD_W) / 2
  const targetCenterX = centerX ?? layoutCenterX
  const dx = targetCenterX - layoutCenterX
  const dy = originY - Math.min(...ys)
  const out: Record<string, { x: number; y: number }> = {}
  for (const [id, pos] of entries) {
    out[id] = { x: pos.x + dx, y: pos.y + dy }
  }
  return out
}

export function layoutNeedsOrgRecompute(
  people: Array<{ id: string; generation?: number; parentIds?: string[] }>,
  positions: Record<string, { x?: number; y?: number }>,
  density: "spacious" | "compact" = "spacious"
) {
  if (!people?.length || !positions) return false

  const hGap = density === "compact" ? H_GAP_ORG_COMPACT : H_GAP_ORG_SPACIOUS
  const minGap = ORG_CARD_W + hGap - 8
  const byGen = groupByGeneration(people)

  for (const row of byGen.values()) {
    const xs = row
      .map((p) => positions[p.id]?.x)
      .filter((x): x is number => typeof x === "number")
      .sort((a, b) => a - b)
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] - xs[i - 1] < minGap) return true
    }
  }

  const fresh = computeVerticalOrg(people, density)
  for (const p of people) {
    const current = positions[p.id]
    const expected = fresh.positions[p.id]
    if (!current || !expected) return true
    if (
      Math.abs((current.x ?? 0) - expected.x) > STALE_LAYOUT_TOLERANCE ||
      Math.abs((current.y ?? 0) - expected.y) > STALE_LAYOUT_TOLERANCE
    ) {
      return true
    }
  }

  return false
}
