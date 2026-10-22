/** Shared geometry for the editor, read-only trees and marketing previews. */
export interface Point { x: number; y: number }
export type Positions = Record<string, Point>
export interface Bounds {
  minX: number; minY: number; maxX: number; maxY: number
  width: number; height: number; centerX: number; centerY: number
}
export interface CardPerson {
  id: string; given?: string; sur?: string; firstName?: string; lastName?: string
  occupation?: string | null
}
export const CARD_W = 120
export const CARD_H = 150
/** A readable name and portrait, used explicitly by compact sibling groups. */
export const getCompactCardDimensions = () => ({ w: 148, h: 64 })
export const MIN_ZOOM = 0.001
export const MAX_ZOOM = 2.5

export function isFinitePoint(value: Point | undefined): value is Point {
  return !!value && Number.isFinite(value.x) && Number.isFinite(value.y)
}

/** Round describes the portrait, not a 90px container clipping all the metadata. */
export function getCardDimensions(style = 'square', options: { organization?: boolean } = {}) {
  const org = options.organization === true
  if (style === 'horizontal') return { w: org ? 280 : 200, h: 88 }
  if (style === 'minimal') return { w: org ? 200 : CARD_W, h: org ? 88 : 76 }
  if (style === 'round') return { w: org ? 200 : CARD_W, h: org ? 176 : CARD_H }
  return { w: org ? 200 : CARD_W, h: org ? 248 : CARD_H }
}

function wrappedLines(text: string, width: number, charWidth: number) {
  return String(text || '').split('\n').reduce((total, paragraph) => {
    let lines = 1
    let used = 0
    for (const word of paragraph.trim().split(/\s+/)) {
      const length = word.length * charWidth
      if (used && used + charWidth + length > width) { lines++; used = 0 }
      if (length > width) {
        lines += Math.ceil(length / width) - 1
        used = length % width || width
      } else { used += (used ? charWidth : 0) + length }
    }
    return total + lines
  }, 0)
}

export function getPersonCardHeight(person: CardPerson, style = 'square', organization = false) {
  const size = getCardDimensions(style, { organization })
  if (!organization) return size.h
  const name = `${person.given || person.firstName || '?'} ${person.sur || person.lastName || ''}`.replace(/ -$/, '').trim()
  // Matches 64px portrait + 8px gap + 16px padding in the horizontal card.
  const width = size.w - 16 - (style === 'horizontal' ? 72 : 0)
  const photo = style === 'minimal' || style === 'horizontal' ? 0 : style === 'round' ? 72 : 128
  const text = 16 + 2 + wrappedLines(name, width, 7) * 16 + wrappedLines(person.occupation || '-', width, 5.5) * 14 + 12
  return Math.max(size.h, Math.ceil(photo + text))
}

export function buildCardHeights(people: CardPerson[], style = 'square', organization = false) {
  return Object.fromEntries(people.map(p => [p.id, getPersonCardHeight(p, style, organization)]))
}

export function boundsFromPoints(points: Point[]): Bounds | null {
  const valid = points.filter(isFinitePoint)
  if (!valid.length) return null
  const minX = Math.min(...valid.map(p => p.x)), maxX = Math.max(...valid.map(p => p.x))
  const minY = Math.min(...valid.map(p => p.y)), maxY = Math.max(...valid.map(p => p.y))
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 }
}

export function contentBounds(positions: Positions, ids: Iterable<string>, cardW: number, cardH: number, heights?: Record<string, number> | null) {
  const points: Point[] = []
  for (const id of ids) {
    const p = positions[id]
    if (!isFinitePoint(p)) continue
    const h = heights?.[id] ?? cardH
    points.push(p, { x: p.x + cardW, y: p.y + h })
  }
  return boundsFromPoints(points)
}

/** Includes SVG control points and buses, not just cards and spouse midpoints. */
export function drawingBounds(bounds: Bounds | null, connections: Array<{ points?: Point[]; path: string }>, padding = 40): Bounds {
  const points: Point[] = bounds ? [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }] : []
  for (const connection of connections) {
    if (connection.points) points.push(...connection.points)
    else {
      const numbers = (connection.path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number)
      for (let i = 0; i + 1 < numbers.length; i += 2) points.push({ x: numbers[i], y: numbers[i + 1] })
    }
  }
  const b = boundsFromPoints(points) || { minX: 0, minY: 0, maxX: 200, maxY: 150 }
  return boundsFromPoints([{ x: b.minX - padding, y: b.minY - padding }, { x: b.maxX + padding, y: b.maxY + padding }])!
}

/** The viewport is already outside the side panel. Subtract only its own toolbar. */
export function fitViewport(bounds: Bounds, width: number, height: number, top = 0, padding = 24) {
  const availableW = Math.max(1, width - 2 * padding)
  const availableH = Math.max(1, height - top - 2 * padding)
  const scale = Math.min(MAX_ZOOM, availableW / Math.max(bounds.width, 1), availableH / Math.max(bounds.height, 1))
  return { scale, pan: { x: width / 2 - bounds.centerX * scale, y: top + (height - top) / 2 - bounds.centerY * scale } }
}

export function zoomAt(pan: Point, scale: number, next: number, anchor: Point) {
  const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
  return { scale: newScale, pan: { x: anchor.x - (anchor.x - pan.x) * newScale / scale, y: anchor.y - (anchor.y - pan.y) * newScale / scale } }
}
export function screenToWorld(point: Point, pan: Point, scale: number): Point {
  return { x: (point.x - pan.x) / scale, y: (point.y - pan.y) / scale }
}

export function visiblePeople<T extends { id: string; given: string; sur: string; occupation?: string; generation: number }>(people: T[], query: string, generation: string) {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()
  const needle = normalize(query)
  return people.filter(p => (generation === 'all' || p.generation === Number(generation)) && (!needle || normalize(`${p.given} ${p.sur} ${p.occupation || ''}`).includes(needle)))
}

/** Repair only actual intersections after a card grows or a person is inserted. */
export function separateOverlappingCards(people: Array<{ id: string; generation?: number }>, positions: Positions, width: number, heights: Record<string, number>, layout = 'vertical', gap = 24): Positions {
  const result: Positions = {}, placed: string[] = []
  const horizontal = layout === 'horizontal'
  const ordered = [...people].filter(p => isFinitePoint(positions[p.id])).sort((a, b) =>
    (a.generation ?? 1) - (b.generation ?? 1) || (horizontal ? positions[a.id].x - positions[b.id].x : positions[a.id].y - positions[b.id].y) || a.id.localeCompare(b.id))
  for (const person of ordered) {
    const pos = { ...positions[person.id] }, height = heights[person.id]
    for (let step = 0; step <= placed.length; step++) {
      const collisions = placed.filter(id => {
        const other = result[id]
        return pos.x < other.x + width && pos.x + width > other.x && pos.y < other.y + heights[id] && pos.y + height > other.y
      })
      if (!collisions.length) break
      if (horizontal) pos.x = Math.max(...collisions.map(id => result[id].x + width)) + gap
      else pos.y = Math.max(...collisions.map(id => result[id].y + heights[id])) + gap
    }
    result[person.id] = pos; placed.push(person.id)
  }
  return result
}
