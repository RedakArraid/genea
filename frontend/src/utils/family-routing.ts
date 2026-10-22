/** Dedicated corridors for multiple parental unions; no hidden add-child handles. */
import type { Point, Positions } from '../lib/tree-geometry'
export interface RoutingPerson { id: string; generation?: number; parentIds?: string[]; spouseIds?: string[] }
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
  const rows = new Map<number, Set<string>>()
  for (const p of people) {
    if (!p.parentIds?.length) continue
    const level = p.generation ?? 1
    if (!rows.has(level)) rows.set(level, new Set())
    rows.get(level)!.add(familyKey(p.parentIds))
  }
  const maximum = Math.max(0, ...[...rows.values()].map(row => row.size))
  return Math.max(normal, 56 + maximum * 32)
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
    const point = (t: number) => ({ x: direct[0].x * (1 - t) + direct[1].x * t, y: direct[0].y * (1 - t) + direct[1].y * t })
    const clear = (p: Point) => people.every(person => {
      const pos = positions[person.id]
      return !pos || p.x < pos.x - 12 || p.x > pos.x + width + 12 || p.y < pos.y - 12 || p.y > pos.y + heightOf(person.id) + 12
    })
    const anchor = [.5, .35, .65, .2, .8].map(point).find(clear)
    if (anchor) return { points: direct, anchor }
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
  return parentEdge + (childEdge - parentEdge) * (.1 + .8 * (rank + 1) / (count + 1))
}

/** All fratries on a level share one corridor, including a child with only one known parent.
 * Computing each bus from its own union anchor can make unrelated buses nearly coincide.
 */
export function planFamilyBuses(
  people: RoutingPerson[], positions: Positions, width: number,
  heightOf: (id: string) => number, layout: string, unions: Map<string, Point>
): Map<string, number> {
  const horizontal = layout === 'horizontal'
  type Family = { key: string; start: number; end: number }
  const rows = new Map<number, Map<string, Family>>()
  for (const child of people) {
    if (!positions[child.id]) continue
    const parents = [...new Set(child.parentIds || [])].filter(id => id !== child.id && positions[id]).sort()
    if (!parents.length) continue
    const key = familyKey(parents), union = unions.get(key)
    const edge = Math.max(...parents.map(id => horizontal ? positions[id].x + width : positions[id].y + heightOf(id)))
    const start = Math.max(edge, union ? horizontal ? union.x : union.y : edge + (parents.length > 1 ? 16 : 0))
    const end = horizontal ? positions[child.id].x : positions[child.id].y
    if (end <= start) continue
    const level = child.generation ?? 1
    if (!rows.has(level)) rows.set(level, new Map())
    const family = rows.get(level)!.get(key)
    rows.get(level)!.set(key, { key, start: Math.max(start, family?.start ?? start), end: Math.min(end, family?.end ?? end) })
  }
  const result = new Map<string, number>()
  for (const families of rows.values()) {
    const ordered = [...families.values()].sort((a, b) => a.key.localeCompare(b.key))
    const commonStart = Math.max(...ordered.map(f => f.start))
    const commonEnd = Math.min(...ordered.map(f => f.end))
    ordered.forEach((family, rank) => result.set(family.key,
      commonEnd > commonStart
        ? familyBusLane(commonStart, commonEnd, rank, ordered.length)
        : familyBusLane(family.start, family.end, rank, ordered.length)))
  }
  return result
}
