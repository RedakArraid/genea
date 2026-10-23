import type { NormalizedPerson } from '../types'

type Relative = Pick<NormalizedPerson, 'id' | 'parentIds' | 'spouseIds'>
export const parentKey = (ids: readonly string[]) => JSON.stringify([...new Set(ids)].sort())
export const personName = (person: { given: string; sur: string }) => `${person.given} ${person.sur === '-' ? '' : person.sur}`.trim()

/** Do not infer a half sibling when either second parent is unknown. */
export function siblingKind(a: Relative, b: Relative): 'full' | 'half' | 'uncertain' | null {
  if (a.id === b.id) return null
  const ap = new Set(a.parentIds), bp = new Set(b.parentIds)
  const common = [...ap].filter(id => bp.has(id))
  if (!common.length) return null
  if (ap.size === 2 && bp.size === 2) return common.length === 2 ? 'full' : 'half'
  return 'uncertain'
}
export function siblingGroups<T extends Relative>(person: T, people: T[]) {
  const groups: Record<'full' | 'half' | 'uncertain', T[]> = { full: [], half: [], uncertain: [] }
  for (const other of people) {
    const kind = siblingKind(person, other)
    if (kind) groups[kind].push(other)
  }
  return groups
}
export function childrenByParents<T extends Relative>(personId: string, people: T[]) {
  const groups = new Map<string, { otherParentIds: string[]; children: T[] }>()
  for (const child of people) {
    if (!child.parentIds.includes(personId)) continue
    const otherParentIds = [...new Set(child.parentIds.filter(id => id !== personId))].sort()
    const key = parentKey(otherParentIds)
    if (!groups.has(key)) groups.set(key, { otherParentIds, children: [] })
    groups.get(key)!.children.push(child)
  }
  return [...groups.values()].sort((a, b) => parentKey(a.otherParentIds).localeCompare(parentKey(b.otherParentIds)))
}
export function descendants(id: string, people: Relative[]): Set<string> {
  const seen = new Set<string>(), queue = [id]
  for (let i = 0; i < queue.length; i++) {
    if (seen.has(queue[i])) continue
    seen.add(queue[i])
    queue.push(...people.filter(p => p.parentIds.includes(queue[i])).map(p => p.id))
  }
  return seen
}
export function canLinkChild(child: Relative, parents: string[], people: Relative[], organization = false) {
  if (parents.includes(child.id) || parents.every(id => child.parentIds.includes(id))) return false
  const below = descendants(child.id, people)
  if (parents.some(id => below.has(id))) return false
  // Preserve existing parentage: never silently turn two known parents into three.
  return organization || new Set([...child.parentIds, ...parents]).size <= Math.max(2, new Set(child.parentIds).size)
}
