/** Tests for what is actually rendered, not just the underlying family data. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const ts = require(path.join(root, 'frontend/node_modules/typescript'))
const cache = new Map()
function load(file) {
  file = path.resolve(root, file)
  if (!path.extname(file)) file += '.ts'
  if (cache.has(file)) return cache.get(file)
  const module = { exports: {} }; cache.set(file, module.exports)
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(name => load(path.resolve(path.dirname(file), name)), module, module.exports)
  return module.exports
}
const L = load('frontend/src/utils/tree-layout.ts'), G = load('frontend/src/lib/tree-geometry.ts')
const R = load('frontend/src/utils/readable-connections.ts'), F = load('frontend/src/lib/family-reading.ts')
const ids = ['father', 'mother-a', 'mother-b', 'mother-c', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'unknown', 'isolated']
const rels = ['a', 'b', 'c'].flatMap(m => [{ type:'spouse', sourceId:'father', targetId:`mother-${m}` }, ...[1,2].flatMap(i => ['father', `mother-${m}`].map(parent => ({ type:'parent', sourceId:parent, targetId:`${m}${i}` })))])
rels.push({ type:'parent', sourceId:'father', targetId:'unknown' })
const people = L.normalizePersons(ids.map(id => ({ id, firstName:id, lastName:'Test', treeId:'t' })), rels)

test('reading groups preserve exact parent sets and every person without invented marriages', () => {
  const { groups, unlinked, occurrences } = F.readingFamilies(people)
  assert.equal(groups.length, 4)
  assert.deepEqual(unlinked.map(p => p.id), ['isolated'])
  assert.equal(occurrences.get('father'), 4)
  for (const child of people.filter(p => p.parentIds.length)) {
    const matching = groups.filter(g => g.children.some(p => p.id === child.id))
    assert.equal(matching.length, 1)
    assert.deepEqual(matching[0].parents.map(p => p.id).sort(), child.parentIds)
  }
})
test('search retains exact parental context and stable family labels', () => {
  const { groups } = F.readingFamilies(people)
  const filtered = F.filterReadingFamilies(groups, new Set(['b1']))
  assert.equal(filtered.length, 1)
  assert.deepEqual(filtered[0].parents.map(p => p.id).sort(), ['father', 'mother-b'])
  assert.equal(filtered[0].label, groups.find(g => g.children.some(p => p.id === 'b1')).label)
})
test('reading groups are independent of input order', () => assert.deepEqual(F.readingFamilies([...people].reverse()), F.readingFamilies(people)))
for (const mode of ['vertical','horizontal','radial']) for (const cardStyle of ['square','round','minimal','horizontal']) for (const density of ['compact','spacious']) for (const connStyle of ['elbow','straight','curve']) {
  test(`rendered lines avoid unrelated cards and shared segments: ${mode}/${cardStyle}/${density}/${connStyle}`, () => {
    const positions = L.computeLayout(people, mode, density, { cardStyle }).positions
    const size = G.getCardDimensions(cardStyle), heights = G.buildCardHeights(people, cardStyle)
    const original = L.buildConnections(people, positions, connStyle, mode, size.w, size.h, heights)
    const routed = R.readableConnections(original, positions, size.w, heights)
    assert.equal(routed.unresolved, 0, 'all fixture relationships must remain visible')
    assert.equal(routed.connections.length, original.length)
    const segments = []
    for (const edge of routed.connections) {
      const points = R.sampledPoints(edge), family = JSON.stringify([...(edge.parentIds || edge.ids)].sort())
      points.slice(1).forEach((b,i) => {
        const a = points[i]
        for (const p of people) {
          const pos = positions[p.id]
          assert.equal(R.segmentHitsCard(a, b, { id:p.id, left:pos.x, right:pos.x+size.w, top:pos.y, bottom:pos.y+heights[p.id] }), false, `line passes through ${p.id}`)
        }
        for (const old of segments) if (old.family !== family) assert.equal(R.segmentsOverlap(a,b,old.a,old.b),false,'two families share a segment')
        segments.push({ a,b,family })
      })
    }
  })
}

for (const style of ['elbow', 'curve', 'straight']) test(`manual blocker on a ${style} connection is bypassed, not hidden`, () => {
  const p = L.normalizePersons(['p', 'c', 'blocker'].map(id => ({id,firstName:id,lastName:'',treeId:'t'})), [{type:'parent',sourceId:'p',targetId:'c'}])
  const positions = {p:{x:0,y:0},c:{x:0,y:600},blocker:{x:0,y:290}}, heights={p:150,c:150,blocker:150}
  const raw=L.buildConnections(p,positions,style)
  const routed=R.readableConnections(raw,positions,120,heights)
  assert.equal(routed.unresolved,0)
  for(const c of routed.connections) {
    const points=R.sampledPoints(c)
    for(let i=1;i<points.length;i++) assert.equal(R.segmentHitsCard(points[i-1],points[i],{id:'blocker',left:0,right:120,top:290,bottom:440}),false)
  }
})
