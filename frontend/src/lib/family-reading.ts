import type { NormalizedPerson } from '../types'
import { parentKey, personName } from './family-model'

export interface ReadingFamily {
  key: string
  label: string
  parents: NormalizedPerson[]
  children: NormalizedPerson[]
  partnersOnly: boolean
}

/** Repeated parents are views of the same record, never duplicated people. */
export function readingFamilies(people: NormalizedPerson[]) {
  const byId = new Map(people.map(person => [person.id, person]))
  const groups = new Map<string, ReadingFamily>()
  for (const child of people) {
    const ids = [...new Set(child.parentIds)].filter(id => id !== child.id && byId.has(id)).sort()
    if (!ids.length) continue
    const key = parentKey(ids)
    if (!groups.has(key)) groups.set(key, { key, label: '', parents: ids.map(id => byId.get(id)!), children: [], partnersOnly: false })
    groups.get(key)!.children.push(child)
  }
  for (const person of people) for (const spouse of person.spouseIds) {
    if (person.id === spouse || !byId.has(spouse)) continue
    const ids = [person.id, spouse].sort(), key = parentKey(ids)
    if (!groups.has(key)) groups.set(key, { key, label: '', parents: ids.map(id => byId.get(id)!), children: [], partnersOnly: true })
  }
  const compare = (a: NormalizedPerson, b: NormalizedPerson) => personName(a).localeCompare(personName(b)) || a.id.localeCompare(b.id)
  const result = [...groups.values()].sort((a, b) =>
    Math.min(...a.parents.map(p => p.generation)) - Math.min(...b.parents.map(p => p.generation)) ||
    a.parents.map(personName).sort().join(' / ').localeCompare(b.parents.map(personName).sort().join(' / ')) || a.key.localeCompare(b.key))
  result.forEach((group, index) => {
    group.label = `F${index + 1}`
    group.parents.sort(compare)
    group.children.sort((a, b) => a.born != null && b.born != null && a.born !== b.born ? a.born - b.born : compare(a, b))
  })
  const included = new Set(result.flatMap(group => [...group.parents, ...group.children].map(p => p.id)))
  const unlinked = people.filter(person => !included.has(person.id)).sort(compare)
  const occurrences = new Map<string, number>()
  for (const group of result) for (const person of [...group.parents, ...group.children]) occurrences.set(person.id, (occurrences.get(person.id) || 0) + 1)
  return { groups: result, unlinked, occurrences }
}

/** Retain the exact parentage as context when searching or filtering a generation. */
export function filterReadingFamilies(groups: ReadingFamily[], visibleIds: Set<string>) {
  return groups.filter(group => [...group.parents, ...group.children].some(person => visibleIds.has(person.id)))
}
