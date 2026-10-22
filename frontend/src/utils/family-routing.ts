/** Dedicated corridors for multiple parental unions; no hidden add-child handles. */
import type { Point, Positions } from '../lib/tree-geometry'
export interface RoutingPerson { id: string; parentIds?: string[]; spouseIds?: string[] }
export const familyKey = (ids: string[]) => JSON.stringify([...new Set(ids)].sort())

export function parentalFamilies(people: RoutingPerson[]) {
  return [...new Set(people.filter(p => p.parentIds?.length).map(p => familyKey(p.parentIds!)))].sort()
}
export function hasMultipleFamilies(people: RoutingPerson[]) {
  const keys = parentalFamilies(people)
  const sets = keys.map(key => new Set<string>(JSON.parse(key)))
  return people.some(p => (p.spouseIds?.length || 0) > 1) || sets.some((set, i) => sets.some((other, j) => i < j && [...set].some(id => other.has(id))))
}
export function familyDepthGap(people: RoutingPerson[], normal: number) {
  if (!hasMultipleFamilies(people)) return normal
  return Math.max(normal, 56 + parentalFamilies(people).length * 32)
}

/** Allocate a separate spouse corridor in the first half of the generation gap. */
export function unionRoute(
  parents: [string, string], people: RoutingPerson[], positions: Positions,
  width: number, heightOf: (id: string) => number, layout: string,
  rank: number, count: number, direct: [Point, Point]
): { points: Point[]; anchor: Point } {
  const [a, b] = parents
  const horizontal = layout === 'horizontal'
  if (layout === 'radial') {
    // Preserve radial edges. Pick a visible point on the actual path for its action.
    const point = (t: number) => ({ x: direct[0].x * (1 - t) + direct[1].x * t, y: direct[0].y * (1 - t) + direct[1].y * t })
    const clear = (p: Point) => people.every(person => {
      const pos = positions[person.id]
      return !pos || p.x < pos.x - 12 || p.x > pos.x + width + 12 || p.y < pos.y - 12 || p.y > pos.y + heightOf(person.id) + 12
    })
    const anchor = [.5, .35, .65, .2, .8].map(point).find(clear)
    if (anchor) return { points: direct, anchor }
    // No safe chord handle: detour outside the entire drawing rather than hide it in a card.
    const top = Math.min(...Object.values(positions).map(p => p.y)) - 32 * (rank + 1)
    const start = { x: positions[a].x + width / 2, y: positions[a].y }
    const end = { x: positions[b].x + width / 2, y: positions[b].y }
    return { points: [start, { x: start.x, y: top }, { x: end.x, y: top }, end], anchor: { x: (start.x + end.x) / 2, y: top } }
  }
  const start = horizontal ? { x: positions[a].x + width, y: positions[a].y + heightOf(a) / 2 } : { x: positions[a].x + width / 2, y: positions[a].y + heightOf(a) }
  const end = horizontal ? { x: positions[b].x + width, y: positions[b].y + heightOf(b) / 2 } : { x: positions[b].x + width / 2, y: positions[b].y + heightOf(b) }
  const bottom = horizontal ? Math.max(start.x, end.x) : Math.max(start.y, end.y)
  const children = people.filter(p => p.parentIds?.includes(a) || p.parentIds?.includes(b))
  const next = Math.min(...children.map(p => horizontal ? positions[p.id]?.x : positions[p.id]?.y).filter((v): v is number => Number.isFinite(v) && v! > bottom))
  const gutter = Number.isFinite(next) ? next - bottom : 80 + count * 24
  const lane = bottom + Math.min(gutter * .42, 16 + (rank + 1) * gutter * .35 / (count + 1))
  const points = horizontal
    ? [start, { x: lane, y: start.y }, { x: lane, y: end.y }, end]
    : [start, { x: start.x, y: lane }, { x: end.x, y: lane }, end]
  return { points, anchor: horizontal ? { x: lane, y: (start.y + end.y) / 2 } : { x: (start.x + end.x) / 2, y: lane } }
}

export function familyBusLane(parentEdge: number, childEdge: number, rank: number, count: number) {
  return parentEdge + (childEdge - parentEdge) * (.55 + .35 * (rank + 1) / (count + 1))
}
