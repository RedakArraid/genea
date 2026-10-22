import type { UnionOverview } from './union-overview'
import { boundsFromPoints, fitViewport, type Bounds } from '../lib/tree-geometry'

/** Frame a readable graph, never an arbitrary first lane with its parent offscreen. */
export function unionReadingView(scene: UnionOverview, width: number, height: number, top: number, familyKey?: string) {
  const bottom = 60 // Zoom controls and the person counter must not cover a card.
  const availableHeight = Math.max(top + 1, height - bottom)
  const fit = (bounds: Bounds, padding = 12) => {
    const fitted = fitViewport(bounds, width, availableHeight, top, padding)
    const scale = Math.min(1, fitted.scale)
    return { scale, pan: { x: width / 2 - bounds.centerX * scale, y: top + (availableHeight - top) / 2 - bounds.centerY * scale } }
  }
  const overview = fit(scene.bounds)
  if (!familyKey && overview.scale >= .85) return overview
  const family = scene.panels.find(panel => panel.family.key === familyKey) || scene.panels[0]
  if (!family) return overview
  const boundsOf = (ids: string[]) => boundsFromPoints(ids.flatMap(id => {
    const p = scene.positions[id], size = scene.cardSizes[id]
    const shared = scene.shared.some(s => s.person.id === id)
    return [{ x: p.x - (shared ? 12 : 0), y: p.y - (shared ? 32 : 0) },
      { x: p.x + Math.max(size.w, shared ? 208 : 0), y: p.y + size.h }]
  }))!
  const relatives = boundsOf([...family.family.parents, ...family.family.children].map(p => p.id))
  const framed = fit(relatives)
  if (framed.scale >= .85) return framed
  // A wrapping toolbar can consume the last few pixels of decorative margin.
  // Try a tighter frame before discarding the children from the initial view;
  // keep the same readable scale and the reserved space for zoom controls.
  const snug = fit(relatives, 4)
  if (snug.scale >= .85) return snug
  // Horizontal/nested graphs may need panning. Start on the recorded parents,
  // not on a child disconnected from its context; the full graph remains mounted.
  const parents = boundsOf(family.family.parents.map(p => p.id))
  const parentView = fit(parents)
  const scale = Math.max(.85, Math.min(1, parentView.scale))
  const anchor = scene.shared.find(s => family.family.parents.some(p => p.id === s.person.id))?.person || family.family.parents[0]
  const position = scene.positions[anchor.id], size = scene.cardSizes[anchor.id]
  if (parentView.scale >= .85) return { ...parentView, scale }
  return { scale, pan: { x: width / 2 - (position.x + size.w / 2) * scale, y: top + 44 - position.y * scale } }
}
