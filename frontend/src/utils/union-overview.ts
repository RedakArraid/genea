/** A complete genealogy projection with explicit parental junctions.
 * People are never cloned. Positions belong to this view, not to saved manual layout.
 * Spatial ordering is deterministic, not an inferred chronology of partnerships.
 */
import type { NormalizedPerson } from '../types'
import type { Point, Positions, Bounds } from '../lib/tree-geometry'
import { boundsFromPoints, buildCardHeights, getCardDimensions } from '../lib/tree-geometry'
import { readingFamilies, type ReadingFamily } from '../lib/family-reading'
import { personName } from '../lib/family-model'
import type { Connection } from './tree-layout'
import { detour, segmentHitsCard, segmentsOverlap, type CardObstacle } from './readable-connections'

export interface UnionBox { x: number; y: number; width: number; height: number }
export interface UnionPanel extends UnionBox {
  family: ReadingFamily
  label: UnionBox
  unknown?: UnionBox
  color: number
}
export interface UnionConnection extends Connection { role: 'parent' | 'child'; family: string }
export interface UnionOverview {
  positions: Positions
  panels: UnionPanel[]
  connections: UnionConnection[]
  shared: Array<{ person: NormalizedPerson; count: number }>
  unlinked: NormalizedPerson[]
  unlinkedBox?: UnionBox
  bounds: Bounds
  unresolved: number
}
interface Unit {
  id: string; members: NormalizedPerson[]; families: ReadingFamily[]; shared: NormalizedPerson[]
  children: Set<Unit>; incoming: ReadingFamily[]; owner?: ReadingFamily; level: number
  width: number; left: number; top: number; depth: number; widths: Map<string, number>
}
interface LogicalBox { u: number; v: number; cross: number; depth: number }
const GAP = 32, PAD = 24, UNIT_GAP = 64, LABEL_W = 244
const path = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
const compare = (a: NormalizedPerson, b: NormalizedPerson) => personName(a).localeCompare(personName(b), 'fr') || a.id.localeCompare(b.id)
const chronologicalChildren = (a: NormalizedPerson, b: NormalizedPerson) => {
  const aa = a.birthDate ? Date.parse(a.birthDate) : NaN, bb = b.birthDate ? Date.parse(b.birthDate) : NaN
  if (Number.isFinite(aa) && Number.isFinite(bb) && aa !== bb) return aa - bb
  return compare(a, b)
}

export function computeUnionOverview(people: NormalizedPerson[], orientation = 'vertical', style = 'square'): UnionOverview | null {
  if (!people.length || orientation === 'radial') return null
  const horizontal = orientation === 'horizontal'
  const { w } = getCardDimensions(style)
  const heights = buildCardHeights(people, style)
  const cross = (p: NormalizedPerson) => horizontal ? heights[p.id] : w
  const depth = (p: NormalizedPerson) => horizontal ? w : heights[p.id]
  const screen = (u: number, v: number): Point => horizontal ? { x: v, y: u } : { x: u, y: v }
  const box = ({ u, v, cross: c, depth: d }: LogicalBox): UnionBox => horizontal ? { x: v, y: u, width: d, height: c } : { x: u, y: v, width: c, height: d }
  const data = readingFamilies(people)
  const isolated = new Set(data.unlinked.map(p => p.id))
  const active = people.filter(p => !isolated.has(p.id))
  const leader = new Map(active.map(p => [p.id, p.id]))
  const find = (id: string): string => { let root = id; while (leader.get(root) !== root) root = leader.get(root)!; return root }
  for (const f of data.groups) for (const p of f.parents.slice(1)) {
    const a = find(f.parents[0].id), b = find(p.id)
    if (a !== b) leader.set(a < b ? b : a, a < b ? a : b)
  }
  const units = new Map<string, Unit>(), unitOf = new Map<string, Unit>()
  for (const p of active) {
    const id = find(p.id)
    if (!units.has(id)) units.set(id, { id, members: [], families: [], shared: [], children: new Set(), incoming: [], level: 0, width: 0, left: 0, top: 0, depth: 0, widths: new Map() })
    const unit = units.get(id)!; unit.members.push(p); unitOf.set(p.id, unit)
  }
  const familyUnit = new Map<string, Unit>()
  for (const f of data.groups) {
    const unit = unitOf.get(f.parents[0].id)!
    unit.families.push(f); familyUnit.set(f.key, unit)
    for (const child of f.children) {
      const target = unitOf.get(child.id)!
      // Invalid ancestry or a partnership to an ancestor cannot be laid out as a DAG.
      if (unit === target) return null
      unit.children.add(target)
      if (!target.incoming.includes(f)) target.incoming.push(f)
    }
  }
  const degree = (p: NormalizedPerson, unit: Unit) => unit.families.filter(f => f.parents.some(parent => parent.id === p.id)).length
  for (const unit of units.values()) {
    unit.members.sort(compare)
    unit.shared = unit.members.filter(p => degree(p, unit) > 1)
    // Prefer the ancestor family of the central member for spatial ownership.
    // Other recorded filiations remain edges, including pedigree collapse.
    const central = [...unit.members].sort((a, b) => degree(b, unit) - degree(a, unit) || compare(a, b))[0]
    unit.owner = unit.incoming.find(f => f.children.some(c => c.id === central.id)) || unit.incoming[0]
  }
  const indegrees = new Map([...units.values()].map(u => [u, new Set(u.incoming.map(f => familyUnit.get(f.key))).size]))
  const queue = [...units.values()].filter(u => !indegrees.get(u)).sort((a, b) => compare(a.members[0], b.members[0]))
  for (let i = 0; i < queue.length; i++) for (const child of queue[i].children) {
    child.level = Math.max(child.level, queue[i].level + 1)
    indegrees.set(child, indegrees.get(child)! - 1)
    if (!indegrees.get(child)) queue.push(child)
  }
  if (queue.length !== units.size) return null
  const ownedChildren = (f: ReadingFamily) => [...new Set([...f.children].sort(chronologicalChildren).map(p => unitOf.get(p.id)!))].filter(u => u.owner?.key === f.key)
  const labelHeight = (f: ReadingFamily) => 38 + f.parents.reduce((n, p) => n + Math.max(1, Math.ceil(personName(p).length / 27)) * 19, 0) + (f.parents.length === 1 ? 22 : 0)
  const labelCross = (f: ReadingFamily) => horizontal ? labelHeight(f) : LABEL_W
  const labelDepth = (f: ReadingFamily) => horizontal ? LABEL_W : labelHeight(f)
  for (const unit of [...queue].reverse()) {
    for (const f of unit.families) {
      const exclusive = f.parents.filter(p => !unit.shared.includes(p))
      const parentWidth = exclusive.reduce((n, p) => n + cross(p), 0) + GAP * Math.max(0, exclusive.length - 1)
      const children = ownedChildren(f)
      const childWidth = children.reduce((n, u) => n + u.width, 0) + GAP * Math.max(0, children.length - 1)
      unit.widths.set(f.key, Math.max(labelCross(f) + PAD * 2, parentWidth + PAD * 2, childWidth + PAD * 2))
    }
    unit.width = unit.families.length ? [...unit.widths.values()].reduce((n, v) => n + v, 0) + GAP * (unit.families.length - 1) : cross(unit.members[0])
    unit.width = Math.max(unit.width, unit.shared.reduce((n, p) => n + cross(p) + GAP, 0))
    const sharedDepth = unit.shared.length ? Math.max(...unit.shared.map(depth)) + 64 + unit.families.length * 10 : 0
    const exclusiveDepth = Math.max(0, ...unit.members.filter(p => !unit.shared.includes(p)).map(depth), ...unit.families.filter(f => f.parents.length === 1).map(() => horizontal ? w : Math.max(...Object.values(heights))))
    unit.depth = unit.families.length ? sharedDepth + exclusiveDepth + 28 + Math.max(...unit.families.map(labelDepth)) + 76 : depth(unit.members[0]) + 64
  }
  const levels = [...new Set(queue.map(u => u.level))].sort((a, b) => a - b)
  const logical = new Map<string, Point>() // x is cross-axis, y is generation-axis.
  const familyCenters = new Map<string, number>(), slots = new Map<Unit, number>()
  const positions: Positions = {}, panels: UnionPanel[] = []
  const unionNodes = new Map<string, LogicalBox>(), laneOf = new Map<string, { left: number; width: number; parentTop: number }>()
  let rowTop = 64
  for (const level of levels) {
    const row = queue.filter(u => u.level === level)
    row.sort((a, b) => (slots.get(a) ?? Infinity) - (slots.get(b) ?? Infinity) || compare(a.members[0], b.members[0]))
    let end = 32
    for (const unit of row) {
      unit.left = Math.max(end, slots.has(unit) ? slots.get(unit)! - unit.width / 2 : end)
      unit.top = rowTop; end = unit.left + unit.width + UNIT_GAP
      if (!unit.families.length) {
        const p = unit.members[0]; logical.set(p.id, { x: unit.left, y: rowTop }); continue
      }
      let lane = unit.left
      const sharedDepth = unit.shared.length ? Math.max(...unit.shared.map(depth)) + 64 + unit.families.length * 10 : 0
      const parentTop = rowTop + sharedDepth
      const exclusiveDepth = Math.max(0, ...unit.members.filter(p => !unit.shared.includes(p)).map(depth), ...unit.families.filter(f => f.parents.length === 1).map(() => horizontal ? w : Math.max(...Object.values(heights))))
      const labelsTop = parentTop + exclusiveDepth + 28
      for (const f of unit.families) {
        const width = unit.widths.get(f.key)!, center = lane + width / 2
        familyCenters.set(f.key, center)
        laneOf.set(f.key, { left: lane, width, parentTop })
        const node: LogicalBox = { u: center - labelCross(f) / 2, v: labelsTop, cross: labelCross(f), depth: labelDepth(f) }
        unionNodes.set(f.key, node)
        const exclusive = f.parents.filter(p => !unit.shared.includes(p))
        const parentsWidth = exclusive.reduce((n, p) => n + cross(p), 0) + GAP * Math.max(0, exclusive.length - 1)
        let x = center - parentsWidth / 2
        for (const p of exclusive) { logical.set(p.id, { x, y: parentTop }); x += cross(p) + GAP }
        const children = ownedChildren(f), total = children.reduce((n, u) => n + u.width, 0) + GAP * Math.max(0, children.length - 1)
        let childLeft = center - total / 2
        for (const child of children) { slots.set(child, childLeft + child.width / 2); childLeft += child.width + GAP }
        const unknown = f.parents.length === 1 && unit.shared.length ? box({ u: center - cross(f.parents[0]) / 2, v: parentTop, cross: cross(f.parents[0]), depth: exclusiveDepth }) : undefined
        panels.push({ family: f, color: panels.length % 6, label: box(node), unknown, ...box({ u: lane + 4, v: parentTop - 18, cross: width - 8, depth: labelsTop + labelDepth(f) - parentTop + 36 }) })
        lane += width + GAP
      }
      const hubs = [...unit.shared].sort((a, b) => {
        const center = (p: NormalizedPerson) => { const f = unit.families.filter(f => f.parents.includes(p)); return f.reduce((n, f) => n + familyCenters.get(f.key)!, 0) / f.length }
        return center(a) - center(b) || compare(a, b)
      })
      const totalHubWidth = hubs.reduce((n, p) => n + cross(p), 0) + GAP * Math.max(0, hubs.length - 1)
      let hubX = unit.left + (unit.width - totalHubWidth) / 2
      for (const p of hubs) { logical.set(p.id, { x: hubX, y: rowTop }); hubX += cross(p) + GAP }
    }
    rowTop += Math.max(...row.map(u => u.depth))
  }
  for (const [id, p] of logical) positions[id] = screen(p.x, p.y)
  // Isolated records live outside all parental frames, never on a family trunk.
  let unlinkedBox: UnionBox | undefined
  if (data.unlinked.length) {
    let v = rowTop + 32
    const total = data.unlinked.reduce((n, p) => n + cross(p) + GAP, 0) - GAP
    const mainWidth = Math.max(320, ...queue.map(u => u.left + u.width))
    let u = Math.max(32, (mainWidth - total) / 2)
    const firstRoot = queue.find(unit => unit.level === 0 && unit.shared.length)
    const freeBeforeHub = firstRoot ? Math.min(...firstRoot.shared.map(p => logical.get(p.id)!.x)) - firstRoot.left : 0
    if (firstRoot && freeBeforeHub >= total + 64) { u = firstRoot.left + 20; v = firstRoot.top }
    unlinkedBox = box({ u: u - 20, v: v - 36, cross: total + 40, depth: Math.max(...data.unlinked.map(depth)) + 56 })
    for (const p of data.unlinked) { positions[p.id] = screen(u, v); u += cross(p) + GAP }
  }
  // Extend a simple parental lane through its leaf children; descendants with
  // their own unions get a new panel, rather than overlapping family backgrounds.
  for (const panel of panels) {
    const f = panel.family
    if (f.children.length && f.children.every(c => !unitOf.get(c.id)!.families.length && unitOf.get(c.id)!.owner?.key === f.key)) {
      const bottom = Math.max(...f.children.map(c => logical.get(c.id)!.y + depth(c))) + 18
      if (horizontal) panel.width = bottom - panel.x
      else panel.height = bottom - panel.y
    }
  }
  const connections: UnionConnection[] = []
  const add = (f: ReadingFamily, role: 'parent' | 'child', points: Point[], ids: string[], childId?: string) => connections.push({ kind: role === 'parent' ? 'spouse' : 'child', role, family: f.key, points, path: path(points), ids, parentIds: f.parents.map(p => p.id), childId })
  for (const f of data.groups) {
    const unit = familyUnit.get(f.key)!, node = unionNodes.get(f.key)!, lane = laneOf.get(f.key)!
    const fIndex = unit.families.indexOf(f)
    for (const [index, p] of f.parents.entries()) {
      const pos = logical.get(p.id)!
      const all = unit.families.filter(f => f.parents.includes(p)), port = (all.indexOf(f) + 1) / (all.length + 1)
      const start = { x: pos.x + cross(p) * port, y: pos.y + depth(p) }
      const input = { x: node.u + node.cross * (index + 1) / (f.parents.length + 1), y: node.v }
      if (unit.shared.includes(p)) {
        const corridor = unit.top + Math.max(...unit.shared.map(depth)) + 18 + fIndex * 10
        const side = lane.left + 12 + index * 8
        add(f, 'parent', [start, { x: start.x, y: corridor }, { x: side, y: corridor }, { x: side, y: node.v - 12 }, { x: input.x, y: node.v - 12 }, input].map(p => screen(p.x, p.y)), [p.id])
      } else add(f, 'parent', [start, { x: start.x, y: node.v - 12 }, { x: input.x, y: node.v - 12 }, input].map(p => screen(p.x, p.y)), [p.id])
    }
    const output = { x: node.u + node.cross / 2, y: node.v + node.depth }
    const childTop = Math.min(...f.children.map(c => logical.get(c.id)!.y))
    const bus = output.y + Math.max(20, (childTop - output.y) * .5)
    for (const c of f.children) {
      const pos = logical.get(c.id)!, end = { x: pos.x + cross(c) / 2, y: pos.y }
      add(f, 'child', [output, { x: output.x, y: bus }, { x: end.x, y: bus }, end].map(p => screen(p.x, p.y)), [...f.parents.map(p => p.id), c.id], c.id)
    }
  }
  const obstacles: CardObstacle[] = people.map(p => ({ id: p.id, left: positions[p.id].x, right: positions[p.id].x + w, top: positions[p.id].y, bottom: positions[p.id].y + heights[p.id] }))
  for (const p of panels) for (const [suffix, r] of [['label', p.label], ['unknown', p.unknown]] as const) if (r) obstacles.push({ id: `${suffix}:${p.family.key}`, left: r.x, right: r.x + r.width, top: r.y, bottom: r.y + r.height })
  const used: Array<{ a: Point; b: Point; family: string }> = [], safe: UnionConnection[] = []
  let unresolved = 0
  for (const connection of connections) {
    const other = used.filter(s => s.family !== connection.family)
    const blocked = connection.points.slice(1).some((p, i) => obstacles.some(r => segmentHitsCard(connection.points[i], p, r)) || other.some(s => segmentsOverlap(connection.points[i], p, s.a, s.b)))
    const points = blocked ? detour(connection.points[0], connection.points[connection.points.length - 1], obstacles, other) : connection.points
    if (!points) { unresolved++; continue }
    safe.push({ ...connection, points, path: path(points) })
    points.slice(1).forEach((b, i) => used.push({ a: points[i], b, family: connection.family }))
  }
  const extent: Point[] = people.flatMap(p => [positions[p.id], { x: positions[p.id].x + w, y: positions[p.id].y + heights[p.id] }])
  for (const r of [...panels, ...(unlinkedBox ? [unlinkedBox] : [])]) extent.push({ x: r.x, y: r.y - 32 }, { x: r.x + r.width, y: r.y + r.height })
  // The fixed-width common-parent badge is part of the drawing, not an overlay.
  for (const unit of queue) for (const p of unit.shared) {
    const pos = positions[p.id]
    extent.push({ x: pos.x - 12, y: pos.y - 32 }, { x: pos.x + 208, y: pos.y })
  }
  for (const c of safe) extent.push(...c.points)
  return { positions, panels, connections: safe, shared: queue.flatMap(u => u.shared.map(person => ({ person, count: degree(person, u) }))), unlinked: data.unlinked, unlinkedBox, bounds: boundsFromPoints(extent)!, unresolved }
}
