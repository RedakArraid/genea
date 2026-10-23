import type { Connection } from './tree-layout'
import type { Point, Positions } from '../lib/tree-geometry'
import { familyKey } from './family-routing'

export interface CardObstacle { id: string; left: number; top: number; right: number; bottom: number }
type Segment = { a: Point; b: Point; family: string }
const EPS = 0.01
const same = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < EPS
const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const linePath = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
const inside = (p: Point, r: CardObstacle) => p.x > r.left + EPS && p.x < r.right - EPS && p.y > r.top + EPS && p.y < r.bottom - EPS

/** Open-rectangle intersection: a legitimate endpoint on its own card is not a collision. */
export function segmentHitsCard(a: Point, b: Point, rect: CardObstacle) {
  const r = { left: rect.left + EPS, right: rect.right - EPS, top: rect.top + EPS, bottom: rect.bottom - EPS }
  let low = 0, high = 1
  for (const [start, delta, min, max] of [[a.x, b.x - a.x, r.left, r.right], [a.y, b.y - a.y, r.top, r.bottom]]) {
    if (Math.abs(delta) < 1e-8) { if (start <= min || start >= max) return false; continue }
    const t1 = (min - start) / delta, t2 = (max - start) / delta
    low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2))
    if (high < low) return false
  }
  return high - low > 1e-7
}

/** A crossing is allowed; sharing a length of line between different families is not. */
export function segmentsOverlap(a: Point, b: Point, c: Point, d: Point) {
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy)
  if (length < EPS) return false
  if (Math.abs(dx * (c.y - a.y) - dy * (c.x - a.x)) / length > .1 ||
      Math.abs(dx * (d.y - a.y) - dy * (d.x - a.x)) / length > .1) return false
  const project = (p: Point) => ((p.x - a.x) * dx + (p.y - a.y) * dy) / length
  return Math.min(length, Math.max(project(c), project(d))) - Math.max(0, Math.min(project(c), project(d))) > 1
}

export function sampledPoints(connection: Connection): Point[] {
  if (!connection.path.includes(' C ') || connection.points.length !== 4) return connection.points
  const [a, b, c, d] = connection.points
  return Array.from({ length: 49 }, (_, i) => {
    const t = i / 48, u = 1 - t
    return { x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
      y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y }
  })
}
function onSegment(p: Point, a: Point, b: Point) {
  return Math.abs(Math.hypot(p.x - a.x, p.y - a.y) + Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(b.x - a.x, b.y - a.y)) < EPS
}
function simplify(points: Point[]) {
  const result: Point[] = []
  for (const p of points) {
    if (result.length && same(p, result[result.length - 1])) continue
    while (result.length >= 2 && onSegment(result[result.length - 1], result[result.length - 2], p)) result.pop()
    result.push(p)
  }
  return result
}

class MinHeap {
  private items: Array<{ id: number; score: number }> = []
  get length() { return this.items.length }
  push(item: { id: number; score: number }) {
    this.items.push(item)
    let i = this.items.length - 1
    while (i > 0) { const p = (i - 1) >> 1; if (this.items[p].score <= item.score) break; this.items[i] = this.items[p]; i = p }
    this.items[i] = item
  }
  pop() {
    const first = this.items[0], last = this.items.pop()!
    if (!this.items.length) return first
    let i = 0
    while (i * 2 + 1 < this.items.length) {
      let c = i * 2 + 1
      if (c + 1 < this.items.length && this.items[c + 1].score < this.items[c].score) c++
      if (this.items[c].score >= last.score) break
      this.items[i] = this.items[c]; i = c
    }
    this.items[i] = last
    return first
  }
}

/** Bounded orthogonal visibility search, only used when an existing segment is ambiguous. */
export function detour(start: Point, end: Point, cards: CardObstacle[], used: Segment[]): Point[] | null {
  const padding = 8
  const port = (p: Point) => {
    for (const r of cards) {
      if (p.x < r.left - EPS || p.x > r.right + EPS || p.y < r.top - EPS || p.y > r.bottom + EPS) continue
      if (Math.abs(p.x - r.left) < EPS) return { x: r.left - padding, y: p.y }
      if (Math.abs(p.x - r.right) < EPS) return { x: r.right + padding, y: p.y }
      if (Math.abs(p.y - r.top) < EPS) return { x: p.x, y: r.top - padding }
      if (Math.abs(p.y - r.bottom) < EPS) return { x: p.x, y: r.bottom + padding }
    }
    return p
  }
  const a = port(start), b = port(end)
  if (cards.some(r => segmentHitsCard(start, a, r) || segmentHitsCard(b, end, r))) return null
  const blockers = cards.map(r => ({ ...r, left: r.left - padding, right: r.right + padding, top: r.top - padding, bottom: r.bottom + padding }))
  if (blockers.some(r => inside(a, r) || inside(b, r))) return null
  const left = Math.min(a.x, b.x) - 64, right = Math.max(a.x, b.x) + 64
  const top = Math.min(a.y, b.y) - 64, bottom = Math.max(a.y, b.y) + 64
  const nearby = blockers.filter(r => r.right >= left && r.left <= right && r.bottom >= top && r.top <= bottom)
  const previous = used.filter(s => Math.max(s.a.x, s.b.x) >= left && Math.min(s.a.x, s.b.x) <= right && Math.max(s.a.y, s.b.y) >= top && Math.min(s.a.y, s.b.y) <= bottom)
  const coordinates = (axis: 'x' | 'y') => [...new Set([
    a[axis], b[axis], axis === 'x' ? left : top, axis === 'x' ? right : bottom,
    ...nearby.flatMap(r => axis === 'x' ? [r.left, r.right] : [r.top, r.bottom]),
    ...previous.flatMap(s => [s.a[axis] - 8, s.a[axis] + 8, s.b[axis] - 8, s.b[axis] + 8]),
  ])].sort((x, y) => x - y)
  const xs = coordinates('x'), ys = coordinates('y'), columns = xs.length
  const node = (p: Point) => ys.indexOf(p.y) * columns + xs.indexOf(p.x)
  const point = (n: number) => ({ x: xs[n % columns], y: ys[Math.floor(n / columns)] })
  const from = node(a) * 3, target = node(b)
  const queue = new MinHeap(), costs = new Map<number, number>([[from, 0]]), parents = new Map<number, number>(), visited = new Set<number>()
  const free = new Map<number, boolean>()
  const allowed = (n: number) => {
    if (!free.has(n)) free.set(n, !blockers.some(r => inside(point(n), r)))
    return free.get(n)!
  }
  queue.push({ id: from, score: distance(a, b) })
  let finish: number | undefined
  while (queue.length && visited.size < 20000) {
    const { id } = queue.pop()
    if (visited.has(id)) continue
    visited.add(id)
    const n = Math.floor(id / 3), direction = id % 3
    if (n === target) { finish = id; break }
    const x = n % columns, y = Math.floor(n / columns), p = point(n)
    for (const [nx, ny, dir] of [[x - 1, y, 1], [x + 1, y, 1], [x, y - 1, 2], [x, y + 1, 2]]) {
      if (nx < 0 || nx >= columns || ny < 0 || ny >= ys.length) continue
      const nextNode = ny * columns + nx, nextId = nextNode * 3 + dir, q = point(nextNode)
      if (visited.has(nextId) || !allowed(nextNode)) continue
      if (blockers.some(r => segmentHitsCard(p, q, r)) || previous.some(s => segmentsOverlap(p, q, s.a, s.b))) continue
      const cost = costs.get(id)! + distance(p, q) + (direction && direction !== dir ? 10 : 0)
      if (cost >= (costs.get(nextId) ?? Infinity)) continue
      costs.set(nextId, cost); parents.set(nextId, id)
      queue.push({ id: nextId, score: cost + distance(q, b) })
    }
  }
  if (finish === undefined) return null
  const route: Point[] = []
  for (let id: number | undefined = finish; id !== undefined; id = parents.get(id)) route.push(point(Math.floor(id / 3)))
  return simplify([start, ...route.reverse(), end])
}

/** Keep real junctions while routing around unrelated cards and separating shared line segments. */
export function readableConnections(connections: Connection[], positions: Positions, width: number, heights: Record<string, number>) {
  const cards = Object.entries(positions).filter(([, p]) => Number.isFinite(p.x) && Number.isFinite(p.y)).map(([id, p]) => ({ id, left: p.x, right: p.x + width, top: p.y, bottom: p.y + (heights[id] || 150) }))
  const key = (c: Connection) => familyKey(c.parentIds || c.ids)
  const junctions = new Map<string, Point[]>()
  for (const c of connections) {
    const family = key(c)
    if (!junctions.has(family)) junctions.set(family, [])
    junctions.get(family)!.push(c.points[0], c.points[c.points.length - 1])
    if (c.kind === 'spouse' && c.midX != null && c.midY != null) junctions.get(family)!.push({ x: c.midX, y: c.midY })
  }
  const result: Connection[] = [], used: Segment[] = []
  const failedFamilies = new Set<string>()
  for (const c of [...connections].sort((a, b) => key(a).localeCompare(key(b)))) {
    const family = key(c), samples = sampledPoints(c), other = used.filter(s => s.family !== family)
    const ambiguous = samples.slice(1).some((b, i) => cards.some(r => segmentHitsCard(samples[i], b, r)) || other.some(s => segmentsOverlap(samples[i], b, s.a, s.b)))
    let output = c
    if (ambiguous) {
      const route: Point[] = []
      let valid = true
      // Curves and bends are cosmetic; preserve only genuine shared endpoints.
      // Routing tiny curve samples separately would leave points inside an obstacle.
      const required = [samples[0]]
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1], b = samples[i]
        const joins = junctions.get(family)!.filter(p => !same(p, a) && onSegment(p, a, b)).sort((p, q) => distance(a, p) - distance(a, q))
        for (const p of joins) if (!same(required[required.length - 1], p)) required.push(p)
      }
      if (!same(required[required.length - 1], samples[samples.length - 1])) required.push(samples[samples.length - 1])
      for (let i = 1; i < required.length && valid; i++) {
        const a = required[i - 1], b = required[i]
        const stops = [a, ...junctions.get(family)!.filter(p => !same(p, a) && !same(p, b) && onSegment(p, a, b)), b].sort((p, q) => distance(a, p) - distance(a, q))
        for (let j = 1; j < stops.length; j++) {
          if (same(stops[j - 1], stops[j])) continue
          const blocked = cards.some(r => segmentHitsCard(stops[j - 1], stops[j], r)) || other.some(s => segmentsOverlap(stops[j - 1], stops[j], s.a, s.b))
          const part = blocked ? detour(stops[j - 1], stops[j], cards, other) : [stops[j - 1], stops[j]]
          if (!part) { valid = false; break }
          route.push(...part)
        }
      }
      if (!valid) { failedFamilies.add(family); continue }
      const points = simplify(route)
      output = { ...c, points, path: linePath(points) }
    }
    result.push(output)
    const points = sampledPoints(output)
    points.slice(1).forEach((b, i) => used.push({ a: points[i], b, family }))
  }
  // A manually moved card may cover a former bus junction. In that case draw
  // each known parent-child relation directly; never retain half a broken bus.
  const replacements: Connection[] = []
  const stillFailed = new Set<string>()
  const toward = (id: string, target: Point) => {
    const rect = cards.find(r => r.id === id)!
    const cx = (rect.left + rect.right) / 2, cy = (rect.top + rect.bottom) / 2
    const dx = target.x - cx, dy = target.y - cy
    const scale = Math.max(Math.abs(dx) / (width / 2), Math.abs(dy) / ((rect.bottom - rect.top) / 2)) || 1
    return { x: cx + dx / scale, y: cy + dy / scale }
  }
  const center = (id: string) => ({ x: positions[id].x + width / 2, y: positions[id].y + (heights[id] || 150) / 2 })
  for (const family of failedFamilies) {
    const original = connections.filter(c => key(c) === family)
    const fallback: Connection[] = []
    const children = new Map(original.filter(c => c.childId).map(c => [c.childId!, c]))
    const other = [...used.filter(s => s.family !== family && !failedFamilies.has(s.family)), ...replacements.flatMap(c => {
      const points = sampledPoints(c)
      return points.slice(1).map((b, i) => ({ a: points[i], b, family: key(c) }))
    })]
    let valid = true
    const add = (c: Connection, start: Point, end: Point) => {
      const points = detour(start, end, cards, other)
      if (!points) { valid = false; return }
      fallback.push({ ...c, points, path: linePath(points) })
    }
    for (const c of original.filter(c => c.kind === 'spouse')) {
      add(c, toward(c.ids[0], center(c.ids[1])), toward(c.ids[1], center(c.ids[0])))
    }
    for (const [child, c] of children) for (const parent of c.parentIds || []) {
      add({ ...c, ids: [parent, child] }, toward(parent, center(child)), toward(child, center(parent)))
    }
    if (valid && fallback.length) replacements.push(...fallback)
    else stillFailed.add(family)
  }
  return { connections: [...result.filter(c => !failedFamilies.has(key(c))), ...replacements], unresolved: stillFailed.size }
}
