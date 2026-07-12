/**
 * Tests unitaires du moteur de layout (frontend)
 */
import { computeLayout, buildConnections, normalizePersons, layoutNeedsRecompute, layoutNeedsOrgRecompute, getCardDimensions } from '../frontend/src/utils/tree-layout.ts'
import { formatGenerationBadge, getMaxGeneration, toOrgLevel } from '../frontend/src/lib/generation-level.ts'
import { isTreeBackgroundActive, getDefaultBackgroundOpacity, buildViewportBackgroundStyle } from '../frontend/src/lib/tree-background.ts'

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

console.log('=== geneamap — Tests layout engine ===\n')

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

const multiSpouse = [
  { id: 'hub', generation: 1, parentIds: [], spouseIds: ['s1', 's2'], given: 'Khadara', sur: 'D' },
  { id: 's1', generation: 1, parentIds: [], spouseIds: ['hub'], given: 'Adja', sur: 'D' },
  { id: 's2', generation: 1, parentIds: [], spouseIds: ['hub'], given: '2eme', sur: 'D' },
]

console.log('\n--- Multi-conjoints sans enfants ---')
const { positions: msPos } = computeLayout(multiSpouse, 'vertical', 'spacious')
ok('multi-conjoints — toutes placées', multiSpouse.every((p) => msPos[p.id]))
ok(
  'multi-conjoints — hub au centre (x entre les conjoint·es)',
  msPos.hub.x > msPos.s1.x && msPos.hub.x < msPos.s2.x
)
ok(
  'multi-conjoints — même génération alignée (y identique)',
  msPos.hub.y === msPos.s1.y && msPos.hub.y === msPos.s2.y
)
ok(
  'multi-conjoints — ordre [s1][hub][s2]',
  msPos.s1.x < msPos.hub.x && msPos.hub.x < msPos.s2.x
)

const polygamyFamily = [
  { id: 'dad', generation: 1, parentIds: [], spouseIds: ['m1', 'm2', 'm3'], given: 'Amadou', sur: 'D' },
  { id: 'm1', generation: 1, parentIds: [], spouseIds: ['dad'], given: 'Mariam', sur: 'D' },
  { id: 'm2', generation: 1, parentIds: [], spouseIds: ['dad'], given: 'Makeme', sur: 'D' },
  { id: 'm3', generation: 1, parentIds: [], spouseIds: ['dad'], given: 'Autre', sur: 'D' },
  { id: 'c1', generation: 2, parentIds: ['dad', 'm1'], spouseIds: [], given: 'Khadara', sur: 'D' },
  { id: 'c2', generation: 2, parentIds: ['dad', 'm1'], spouseIds: [], given: 'Youssouf', sur: 'D' },
]

console.log('\n--- Polygamie avec enfants ---')
const { positions: polyPos } = computeLayout(polygamyFamily, 'vertical', 'spacious')
const dadMariamDist = Math.hypot(polyPos.dad.x - polyPos.m1.x, polyPos.dad.y - polyPos.m1.y)
ok('polygamie — conjoint·es proches (< 500px)', dadMariamDist < 500)
ok('polygamie — toutes les épouses placées', ['m1', 'm2', 'm3'].every((id) => polyPos[id]))
ok('polygamie — pas de ligne conjugale aberrante', dadMariamDist < 480)

ok(
  'layoutNeedsRecompute — détecte positions éloignées',
  layoutNeedsRecompute(polygamyFamily, { dad: { x: 3000, y: 40 }, m1: { x: 860, y: 40 } })
)
ok(
  'layoutNeedsRecompute — ignore positions saines',
  !layoutNeedsRecompute(polygamyFamily, polyPos)
)

console.log('\n--- Racine avec parents ---')
const rootWithParents = normalizePersons(
  [
    { id: 'root', firstName: 'Root', lastName: 'X', treeId: 't' },
    { id: 'p1', firstName: 'Pere', lastName: 'X', treeId: 't' },
    { id: 'p2', firstName: 'Mere', lastName: 'X', treeId: 't' },
  ],
  [
    { id: 'r1', type: 'parent', sourceId: 'p1', targetId: 'root' },
    { id: 'r2', type: 'child', sourceId: 'root', targetId: 'p1' },
    { id: 'r3', type: 'spouse', sourceId: 'p1', targetId: 'p2' },
  ]
)
const { positions: rwpPos } = computeLayout(rootWithParents, 'vertical', 'spacious')
ok('parents au-dessus de la racine (y plus petit)', rwpPos.p1.y < rwpPos.root.y && rwpPos.p2.y < rwpPos.root.y)
ok(
  'générations cohérentes (parents G1, enfant G2)',
  rootWithParents.find((p) => p.id === 'p1')?.generation === 1 &&
    rootWithParents.find((p) => p.id === 'root')?.generation === 2
)

console.log('\n--- Organigramme entreprise ---')
const orgPeople = [
  { id: 'ceo', generation: 1, parentIds: [], spouseIds: [], given: 'Alice', sur: 'Martin', occupation: 'CEO' },
  { id: 'dir1', generation: 2, parentIds: ['ceo'], spouseIds: [], given: 'Bob', sur: 'Lee', occupation: 'CTO' },
  { id: 'dir2', generation: 2, parentIds: ['ceo'], spouseIds: [], given: 'Carol', sur: 'Kim', occupation: 'CFO' },
  { id: 'emp1', generation: 3, parentIds: ['dir1'], spouseIds: [], given: 'Dan', sur: 'Ng', occupation: 'Dev' },
  { id: 'emp2', generation: 3, parentIds: ['dir2'], spouseIds: [], given: 'Eve', sur: 'Wu', occupation: 'Analyst' },
]
const orgOpts = { organization: true }
const { positions: orgPos } = computeLayout(orgPeople, 'vertical', 'spacious', orgOpts)
const orgCard = getCardDimensions('square', orgOpts)
ok('org — toutes les personnes placées', orgPeople.every((p) => orgPos[p.id]))
ok('org — directeurs espacés (gap >= carte + marge)', orgPos.dir2.x - orgPos.dir1.x >= orgCard.w + 40)
ok(
  'layoutNeedsOrgRecompute — détecte grille serrée',
  layoutNeedsOrgRecompute(orgPeople, { dir1: { x: 0, y: 200 }, dir2: { x: 120, y: 200 } })
)
ok(
  'layoutNeedsOrgRecompute — ignore layout org sain',
  !layoutNeedsOrgRecompute(orgPeople, orgPos)
)
ok('org — CEO au sommet = niveau max', formatGenerationBadge(1, { isOrg: true, maxGeneration: 4 }) === 'N4')
ok('org — base = N1', formatGenerationBadge(4, { isOrg: true, maxGeneration: 4 }) === 'N1')
ok('org — toOrgLevel cohérent', toOrgLevel(2, getMaxGeneration(orgPeople)) === 2)

console.log('\n--- Arrière-plan organigramme ---')
const bgConfig = { imageUrl: 'https://example.com/logo.png', mode: 'REPEAT', opacity: 0.2, overlay: true, tileSize: 120 }
ok('background actif', isTreeBackgroundActive(bgConfig))
ok('background inactif sans image', !isTreeBackgroundActive({ ...bgConfig, imageUrl: null }))
ok('opacité repeat par défaut', getDefaultBackgroundOpacity('REPEAT') === 0.15)
const bgStyle = buildViewportBackgroundStyle(bgConfig, 'https://example.com/logo.png')
ok('style repeat plein écran', bgStyle.backgroundRepeat === 'repeat' && bgStyle.backgroundSize === '120px')
const coverStyle = buildViewportBackgroundStyle({ ...bgConfig, mode: 'COVER' }, 'https://example.com/cover.jpg')
ok('style cover plein écran', coverStyle.backgroundSize === 'cover' && coverStyle.backgroundRepeat === 'no-repeat')

console.log(`\n=== Résultat layout : ${pass} passés, ${fail} échoués ===`)
process.exit(fail > 0 ? 1 : 0)
