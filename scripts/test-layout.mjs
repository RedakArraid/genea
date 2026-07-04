/**
 * Tests unitaires du moteur de layout (frontend)
 */
import { computeLayout, buildConnections } from '../frontend/src/utils/tree-layout.ts'

const people = [
  { id: 'a', generation: 1, parentIds: [], spouseIds: ['b'], given: 'Jean', sur: 'Dupont' },
  { id: 'b', generation: 1, parentIds: [], spouseIds: ['a'], given: 'Marie', sur: 'Dupont' },
  { id: 'c', generation: 2, parentIds: ['a', 'b'], spouseIds: ['d'], given: 'Pierre', sur: 'Dupont' },
  { id: 'd', generation: 2, parentIds: ['a', 'b'], spouseIds: ['c'], given: 'Sophie', sur: 'Dupont' },
  { id: 'e', generation: 3, parentIds: ['c', 'd'], spouseIds: [], given: 'Lucie', sur: 'Dupont' },
]

let pass = 0
let fail = 0

function ok(name, cond) {
  if (cond) { console.log(`  ✓ ${name}`); pass++ }
  else { console.log(`  ✗ ${name}`); fail++ }
}

console.log('=== GeneaIA — Tests layout engine ===\n')

for (const layout of ['vertical', 'horizontal', 'radial']) {
  const { positions } = computeLayout(people, layout, 'spacious')
  ok(`computeLayout ${layout} — toutes les personnes placées`, people.every((p) => positions[p.id]))
  const conns = buildConnections(people, positions, 'elbow', layout)
  ok(`buildConnections ${layout} — connexions générées`, conns.length > 0)
}

const { positions: vPos } = computeLayout(people, 'vertical', 'spacious')
const { positions: hPos } = computeLayout(people, 'horizontal', 'spacious')
ok('horizontal transpose vertical (Jean x/y inversés)', vPos.a.x === hPos.a.y && vPos.a.y === hPos.a.x)

const spouseConns = buildConnections(people, vPos, 'elbow', 'vertical').filter((c) => c.kind === 'spouse')
ok('liaison conjointe — midpoint défini', spouseConns.every((c) => typeof c.midX === 'number' && typeof c.midY === 'number'))

console.log(`\n=== Résultat layout : ${pass} passés, ${fail} échoués ===`)
process.exit(fail > 0 ? 1 : 0)
