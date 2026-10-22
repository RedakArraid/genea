/** Deterministic, bounded graph layout shared by all browser tree views. */
import type { NormalizedPerson, Person, Relationship, PersonTone } from '../types'
import * as orgLayout from '../lib/org-layout'
import { CARD_W, CARD_H, getCardDimensions, buildCardHeights, isFinitePoint, contentBounds } from '../lib/tree-geometry'
import type { Point, Positions } from '../lib/tree-geometry'
import { familyKey, familyDepthGap, hasMultipleFamilies, unionRoute, familyBusLane } from './family-routing'
export { CARD_W, CARD_H, getCardDimensions, buildCardHeights }
export { buildOrgCardHeights, estimateOrgCardHeight } from '../lib/org-layout'
export interface LayoutOptions { organization?: boolean; cardStyle?: string }
export interface LayoutResult { positions: Positions; canvasW: number; canvasH: number; cardHeights?: Record<string, number> }
export interface LayoutPerson { id: string; generation?: number; parentIds?: string[]; spouseIds?: string[]; given?: string; sur?: string; occupation?: string | null }
export interface Connection {
  kind: 'spouse' | 'child'; path: string; ids: string[]; points: Point[]
  midX?: number; midY?: number; childId?: string; parentIds?: string[]
}
const tones: PersonTone[] = ['ocean', 'plum', 'rose', 'sage', 'amber', 'stone']
const unique = (ids: string[]) => [...new Set(ids)]
const meanExtent = (values: number[]) => (Math.min(...values) + Math.max(...values)) / 2

function components(ids: string[], pairs: Array<[string, string]>) {
  const leader = new Map(ids.map(id => [id, id]))
  const find = (id: string): string => {
    let p = id
    while (leader.get(p) !== p) p = leader.get(p)!
    return p
  }
  for (const [a, b] of pairs) {
    if (!leader.has(a) || !leader.has(b)) continue
    const x = find(a), y = find(b)
    if (x !== y) leader.set(x < y ? y : x, x < y ? x : y)
  }
  return new Map(ids.map(id => [id, find(id)]))
}

/** Collapse cycles before the topological pass; malformed imports cannot freeze rendering. */
function generations(people: LayoutPerson[]) {
  const ids = people.map(p => p.id)
  const family = components(ids, people.flatMap(p => (p.spouseIds || []).map(s => [p.id, s] as [string, string])))
  const graph = new Map(unique([...family.values()]).map(id => [id, new Set<string>()]))
  for (const p of people) for (const parent of p.parentIds || []) {
    const a = family.get(parent), b = family.get(p.id)!
    if (a && a !== b) graph.get(a)!.add(b)
  }
  let serial = 0
  const indices = new Map<string, number>(), low = new Map<string, number>()
  const stack: string[] = [], active = new Set<string>(), component = new Map<string, number>()
  let count = 0
  function visit(id: string) {
    indices.set(id, serial); low.set(id, serial++); stack.push(id); active.add(id)
    for (const to of [...graph.get(id)!].sort()) {
      if (!indices.has(to)) { visit(to); low.set(id, Math.min(low.get(id)!, low.get(to)!)) }
      else if (active.has(to)) low.set(id, Math.min(low.get(id)!, indices.get(to)!))
    }
    if (low.get(id) === indices.get(id)) {
      let next: string
      do { next = stack.pop()!; active.delete(next); component.set(next, count) } while (next !== id)
      count++
    }
  }
  for (const id of [...graph.keys()].sort()) if (!indices.has(id)) visit(id)
  const dag = Array.from({ length: count }, () => new Set<number>())
  const indegree = Array(count).fill(0), level = Array(count).fill(1)
  for (const [id, targets] of graph) for (const to of targets) {
    const a = component.get(id)!, b = component.get(to)!
    if (a !== b && !dag[a].has(b)) { dag[a].add(b); indegree[b]++ }
  }
  const queue = indegree.flatMap((n, i) => n === 0 ? [i] : [])
  for (let i = 0; i < queue.length; i++) for (const child of dag[queue[i]]) {
    level[child] = Math.max(level[child], level[queue[i]] + 1)
    if (--indegree[child] === 0) queue.push(child)
  }
  return Object.fromEntries(ids.map(id => [id, level[component.get(family.get(id)!)!]]))
}

type LegacyRelation = { relationType?: string; type?: string; relatedPersonId?: string; personAId?: string; personBId?: string; sourceId?: string; targetId?: string }
type InputPerson = Person & { given?: string; sur?: string; place?: string; relations?: LegacyRelation[] }
export function normalizePersons(apiPersons: Person[], apiRelationships: Relationship[] = []): NormalizedPerson[] {
  const valid = new Set(apiPersons.map(p => p.id))
  const parents = new Map([...valid].map(id => [id, new Set<string>()]))
  const spouses = new Map([...valid].map(id => [id, new Set<string>()]))
  const add = (a: string | undefined, b: string | undefined, kind: string | undefined) => {
    if (!a || !b || a === b || !valid.has(a) || !valid.has(b)) return
    if (kind === 'parent' || kind === 'PARENT_OF') parents.get(b)!.add(a)
    if (kind === 'child' || kind === 'CHILD_OF') parents.get(a)!.add(b)
    if (kind === 'spouse' || kind === 'SPOUSE_OF') { spouses.get(a)!.add(b); spouses.get(b)!.add(a) }
  }
  for (const r of apiRelationships || []) add(r.sourceId, r.targetId, r.type)
  for (const p of apiPersons as InputPerson[]) for (const r of p.relations || []) {
    if (r.relatedPersonId) add(p.id, r.relatedPersonId, r.relationType || r.type)
    else add(r.sourceId || r.personAId || p.id, r.targetId || r.personBId, r.relationType || r.type)
  }
  const year = (date?: string | null) => {
    const value = date ? new Date(date).getUTCFullYear() : NaN
    return Number.isFinite(value) ? value : null
  }
  const result: NormalizedPerson[] = (apiPersons as InputPerson[]).map(p => ({
    id: p.id, given: p.firstName || p.given || '?', sur: p.lastName || p.sur || '-',
    born: year(p.birthDate), died: year(p.deathDate), birthDate: p.birthDate || null, deathDate: p.deathDate || null,
    place: p.birthPlace || p.place || '', bio: { fr: p.biography || '', en: p.biography || '' },
    generation: 1, tone: tones[[...p.id].reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length],
    parentIds: [...parents.get(p.id)!].sort(), spouseIds: [...spouses.get(p.id)!].sort(),
    photoUrl: p.photoUrl || null, isAlive: !p.deathDate, occupation: p.occupation || '',
  }))
  const levels = generations(result)
  for (const p of result) p.generation = levels[p.id]
  return result
}

function clusterOrder(row: LayoutPerson[]) {
  if (row.length <= 2) return [...row].sort((a, b) => a.id.localeCompare(b.id))
  const ids = new Set(row.map(p => p.id))
  const sorted = [...row].sort((a, b) => (b.spouseIds || []).filter(id => ids.has(id)).length - (a.spouseIds || []).filter(id => ids.has(id)).length || a.id.localeCompare(b.id))
  const hub = sorted[0], rest = sorted.slice(1).sort((a, b) => a.id.localeCompare(b.id))
  return [...rest.filter((_, i) => i % 2 === 0), hub, ...rest.filter((_, i) => i % 2 === 1)]
}
function finishLayout(positions: Positions, w: number, h: number, heights: Record<string, number>) {
  const bounds = contentBounds(positions, Object.keys(positions), w, h, heights)
  if (!bounds) return { positions: {}, canvasW: 800, canvasH: 600 }
  for (const p of Object.values(positions)) { p.x += 40 - bounds.minX; p.y += 40 - bounds.minY }
  return { positions, canvasW: bounds.width + 80, canvasH: bounds.height + 80 }
}
export function computeLayout(people: LayoutPerson[], layout = 'vertical', density = 'spacious', options: LayoutOptions = {}): LayoutResult {
  if (!people?.length) return { positions: {}, canvasW: 800, canvasH: 600 }
  const org = options.organization === true, style = options.cardStyle || 'square'
  const { w, h } = getCardDimensions(style, options)
  const heights = buildCardHeights(people, style, org)
  const gap = org ? density === 'compact' ? 48 : 72 : density === 'compact' ? 20 : 40
  const normalDepthGap = org ? density === 'compact' ? 104 : 148 : density === 'compact' ? 50 : 100
  const depthGap = org ? normalDepthGap : familyDepthGap(people, normalDepthGap)
  if (org && style === 'square' && layout === 'vertical') return orgLayout.computeVerticalOrg(people, density === 'compact' ? 'compact' : 'spacious')
  const rows = new Map<number, LayoutPerson[]>()
  for (const p of people) {
    const g = Number.isFinite(p.generation) ? p.generation! : 1
    if (!rows.has(g)) rows.set(g, [])
    rows.get(g)!.push(p)
  }
  const levels = [...rows.keys()].sort((a, b) => a - b)
  const positions: Positions = {}
  if (layout === 'radial') {
    let previousRadius = 0, previousHalf = 0
    for (let index = 0; index < levels.length; index++) {
      const row = [...rows.get(levels[index])!].sort((a, b) => familyKey(a.parentIds || []).localeCompare(familyKey(b.parentIds || [])) || a.id.localeCompare(b.id))
      const diameter = Math.max(...row.map(p => Math.hypot(w, heights[p.id])))
      const n = row.length
      const chordRadius = n > 1 ? (diameter + gap) / (2 * Math.sin(Math.PI / n)) : 0
      const radius = index === 0 && n === 1 ? 0 : Math.max(chordRadius, index === 0 ? 0 : previousRadius + previousHalf + diameter / 2 + depthGap)
      row.forEach((p, i) => {
        const angle = -Math.PI / 2 + 2 * Math.PI * i / n
        positions[p.id] = { x: radius * Math.cos(angle) - w / 2, y: radius * Math.sin(angle) - heights[p.id] / 2 }
      })
      previousRadius = radius; previousHalf = diameter / 2
    }
    return finishLayout(positions, w, h, heights)
  }
  const horizontal = layout === 'horizontal'
  type Group = { members: LayoutPerson[]; width: number; left: number; children: Set<Group>; parents: Set<Group> }
  const groupsByLevel: Group[][] = [], groupOf = new Map<string, Group>()
  for (const g of levels) {
    const row = rows.get(g)!
    const ids = row.map(p => p.id)
    const roots = components(ids, org ? [] : row.flatMap(p => (p.spouseIds || []).map(s => [p.id, s] as [string, string])))
    const clusters = new Map<string, LayoutPerson[]>()
    for (const p of row) { const id = roots.get(p.id)!; if (!clusters.has(id)) clusters.set(id, []); clusters.get(id)!.push(p) }
    const groups = [...clusters.values()].map(members => {
      const ordered = org ? members : clusterOrder(members)
      const width = ordered.reduce((sum, p) => sum + (horizontal ? heights[p.id] : w), 0) + gap * (ordered.length - 1)
      const group: Group = { members: ordered, width, left: 0, children: new Set(), parents: new Set() }
      ordered.forEach(p => groupOf.set(p.id, group))
      return group
    })
    groupsByLevel.push(groups)
  }
  for (const p of people) for (const parent of p.parentIds || []) {
    const a = groupOf.get(parent), b = groupOf.get(p.id)!
    if (a && a !== b) { a.children.add(b); b.parents.add(a) }
  }
  const center = (g: Group) => g.left + g.width / 2
  const groupFamily = (g: Group) => familyKey(g.members.flatMap(p => p.parentIds || []))
  const rowWidths = groupsByLevel.map(row => row.reduce((n, g) => n + g.width, 0) + gap * 2 * (row.length - 1))
  const maxWidth = Math.max(...rowWidths)
  groupsByLevel.forEach((row, index) => {
    row.sort((a, b) => {
      const ac = a.parents.size ? meanExtent([...a.parents].map(center)) : 0
      const bc = b.parents.size ? meanExtent([...b.parents].map(center)) : 0
      // A shared father does not make children of different mothers one sibling unit.
      return ac - bc || groupFamily(a).localeCompare(groupFamily(b)) || a.members[0].id.localeCompare(b.members[0].id)
    })
    let left = (maxWidth - rowWidths[index]) / 2
    for (const g of row) { g.left = left; left += g.width + gap * 2 }
  })
  for (let level = groupsByLevel.length - 1; level >= 0; level--) {
    const row = groupsByLevel[level]
    const targets = row.map(g => g.children.size ? meanExtent([...g.children].map(center)) - g.width / 2 : g.left)
    row.forEach((g, i) => { g.left = i === 0 ? targets[i] : Math.max(targets[i], row[i - 1].left + row[i - 1].width + gap * 2) })
  }
  let depth = 40
  groupsByLevel.forEach(row => {
    for (const group of row) {
      let cross = group.left
      for (const p of group.members) {
        positions[p.id] = horizontal ? { x: depth, y: cross } : { x: cross, y: depth }
        cross += (horizontal ? heights[p.id] : w) + gap
      }
    }
    depth += (horizontal ? w : Math.max(...row.flatMap(g => g.members.map(p => heights[p.id])))) + depthGap
  })
  return finishLayout(positions, w, h, heights)
}

function edgeToward(pos: Point, target: Point, w: number, h: number): Point {
  const center = { x: pos.x + w / 2, y: pos.y + h / 2 }
  const dx = target.x - center.x, dy = target.y - center.y
  const factor = Math.max(Math.abs(dx) / (w / 2), Math.abs(dy) / (h / 2))
  if (!factor) return center
  return { x: center.x + dx / factor, y: center.y + dy / factor }
}
const pathThrough = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
export function buildConnections(people: LayoutPerson[], positions: Positions, connStyle = 'elbow', layout = 'vertical', cardW = CARD_W, cardH = CARD_H, cardHeights?: Record<string, number> | null): Connection[] {
  const byId = new Map(people.filter(p => isFinitePoint(positions[p.id])).map(p => [p.id, p]))
  const h = (id: string) => cardHeights && Number.isFinite(cardHeights[id]) && cardHeights[id] > 0 ? cardHeights[id] : cardH
  const center = (id: string) => ({ x: positions[id].x + cardW / 2, y: positions[id].y + h(id) / 2 })
  const keyOf = familyKey
  const out: Connection[] = [], unions = new Map<string, Point>()
  const multiple = hasMultipleFamilies(people)
  const spouseKeys = unique(people.flatMap(p => (p.spouseIds || []).filter(id => id !== p.id && byId.has(id) && byId.has(p.id)).map(id => keyOf([p.id, id])))).sort()
  for (const [rank, key] of spouseKeys.entries()) {
    const [aId, bId] = JSON.parse(key) as [string, string]
    const a = edgeToward(positions[aId], center(bId), cardW, h(aId))
    const b = edgeToward(positions[bId], center(aId), cardW, h(bId))
    const route = multiple ? unionRoute([aId, bId], [...byId.values()], positions, cardW, h, layout, rank, spouseKeys.length, [a, b]) : { points: [a, b], anchor: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
    unions.set(key, route.anchor)
    out.push({ kind: 'spouse', path: pathThrough(route.points), points: route.points, ids: [aId, bId], midX: route.anchor.x, midY: route.anchor.y })
  }
  const groups = new Map<string, { parents: string[]; children: string[] }>()
  for (const p of people) {
    if (!byId.has(p.id)) continue
    const parents = unique((p.parentIds || []).filter(id => id !== p.id && byId.has(id))).sort()
    if (!parents.length) continue
    const key = keyOf(parents)
    if (!groups.has(key)) groups.set(key, { parents, children: [] })
    groups.get(key)!.children.push(p.id)
  }
  const horizontal = layout === 'horizontal', radial = layout === 'radial'
  const orderedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  for (const [rank, [, { parents, children }]] of orderedGroups.entries()) {
    children.sort((a, b) => (horizontal ? positions[a].y - positions[b].y : positions[a].x - positions[b].x) || a.localeCompare(b))
    const union = parents.length === 2 ? unions.get(keyOf(parents)) : undefined
    const parentEdges = parents.map(id => horizontal ? { x: positions[id].x + cardW, y: center(id).y } : { x: center(id).x, y: positions[id].y + h(id) })
    const anchor = union || (parents.length === 1 ? parentEdges[0] : horizontal
      ? { x: Math.max(...parentEdges.map(p => p.x)) + 16, y: meanExtent(parentEdges.map(p => p.y)) }
      : { x: meanExtent(parentEdges.map(p => p.x)), y: Math.max(...parentEdges.map(p => p.y)) + 16 })
    const push = (points: Point[], ids: string[], childId?: string, path?: string) => out.push({ kind: 'child', path: path || pathThrough(points), points, ids, parentIds: parents, ...(childId ? { childId } : {}) })
    const childEdges = children.map(id => horizontal ? { x: positions[id].x, y: center(id).y } : { x: center(id).x, y: positions[id].y })
    const forward = !radial && childEdges.every(p => horizontal ? p.x > Math.max(...parentEdges.map(e => e.x), anchor.x) : p.y > Math.max(...parentEdges.map(e => e.y), anchor.y))
    if (connStyle !== 'elbow' || !forward) {
      children.forEach((id, i) => {
        const sources = union ? [union] : parents.map(pid => edgeToward(positions[pid], center(id), cardW, h(pid)))
        sources.forEach(source => {
          const target = radial || !forward ? edgeToward(positions[id], source, cardW, h(id)) : childEdges[i]
          let points = [source, target], path: string | undefined
          if (connStyle === 'curve' && !radial) {
            const midX = (source.x + target.x) / 2, midY = (source.y + target.y) / 2
            const c1 = horizontal ? { x: midX, y: source.y } : { x: source.x, y: midY }
            const c2 = horizontal ? { x: midX, y: target.y } : { x: target.x, y: midY }
            points = [source, c1, c2, target]
            path = `M ${source.x} ${source.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${target.x} ${target.y}`
          }
          push(points, [...parents, id], id, path)
        })
      })
      continue
    }
    if (!union && parents.length > 1) parentEdges.forEach(p => push(horizontal ? [p, { x: anchor.x, y: p.y }, anchor] : [p, { x: p.x, y: anchor.y }, anchor], parents))
    const parentEdge = horizontal ? Math.max(anchor.x, ...parentEdges.map(p => p.x)) : Math.max(anchor.y, ...parentEdges.map(p => p.y))
    const childEdge = Math.min(...childEdges.map(p => horizontal ? p.x : p.y))
    const mid = multiple ? familyBusLane(parentEdge, childEdge, rank, groups.size) : (parentEdge + childEdge) / 2
    const min = Math.min(horizontal ? anchor.y : anchor.x, ...childEdges.map(p => horizontal ? p.y : p.x))
    const max = Math.max(horizontal ? anchor.y : anchor.x, ...childEdges.map(p => horizontal ? p.y : p.x))
    const trunk = horizontal ? [anchor, { x: mid, y: anchor.y }] : [anchor, { x: anchor.x, y: mid }]
    push(trunk, [...parents, ...children])
    push(horizontal ? [{ x: mid, y: min }, { x: mid, y: max }] : [{ x: min, y: mid }, { x: max, y: mid }], [...parents, ...children])
    childEdges.forEach((p, i) => push(horizontal ? [{ x: mid, y: p.y }, p] : [{ x: p.x, y: mid }, p], [...parents, children[i]], children[i]))
  }
  return out
}
export function layoutNeedsRecompute(people: LayoutPerson[], positions: Positions, _cardW = CARD_W) {
  return !!people?.length && people.some(p => !isFinitePoint(positions?.[p.id]))
}
export function layoutNeedsOrgRecompute(people: LayoutPerson[], positions: Positions, density: 'spacious' | 'compact' = 'spacious') {
  return orgLayout.layoutNeedsOrgRecompute(people, positions, density)
}
export function computeLineage(rootId: string, people: LayoutPerson[]): Set<string> {
  const byId = new Map(people.map(p => [p.id, p])), result = new Set<string>()
  const traverse = (parents: boolean) => {
    const queue = [rootId], visited = new Set<string>()
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i]
      if (visited.has(id) || !byId.has(id)) continue
      visited.add(id); result.add(id)
      queue.push(...(parents ? byId.get(id)!.parentIds || [] : people.filter(p => p.parentIds?.includes(id)).map(p => p.id)))
    }
  }
  traverse(true); traverse(false)
  for (const id of [...result]) for (const spouse of byId.get(id)?.spouseIds || []) if (byId.has(spouse)) result.add(spouse)
  return result
}
