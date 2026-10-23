/** Run with Node after npm ci --prefix frontend. No services or credentials. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const root = path.resolve(__dirname, '..')
let ts
try { ts = require(path.join(root, 'frontend/node_modules/typescript')) }
catch { ts = require(process.env.TYPESCRIPT_PATH || 'typescript') }
const cache = new Map()
function load(file) {
  file = path.resolve(root, file)
  if (!path.extname(file)) file += '.ts'
  if (cache.has(file)) return cache.get(file)
  const module = { exports: {} }; cache.set(file, module.exports)
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename: file })(name => load(path.resolve(path.dirname(file), name)), module, module.exports)
  return module.exports
}
const L = load('frontend/src/utils/tree-layout.ts'), G = load('frontend/src/lib/tree-geometry.ts')
const org = load('frontend/src/lib/org-layout.ts')
const person = (id, parentIds = [], spouseIds = [], generation = 1, occupation = '') => ({ id, given: id, sur: 'Family', parentIds, spouseIds, generation, occupation })
const family = [person('a', [], ['b']), person('b', [], ['a']), ...Array.from({length: 24}, (_, i) => person(`c${i}`, ['a','b'], [], 2)), person('grand', ['c0'], [], 3)]
const orgPeople = [person('boss', [], [], 1, 'Management, strategy and operations '.repeat(20)), ...Array.from({length: 12}, (_, i) => person(`team${i}`, ['boss'], [], 2, i % 2 ? 'Engineering '.repeat(20) : 'Sales'))]
function assertGeometry(people, layout, density, cardStyle, organization) {
  const opts = { organization, cardStyle }, a = L.computeLayout(people, layout, density, opts)
  const size = G.getCardDimensions(cardStyle, opts), heights = G.buildCardHeights(people, cardStyle, organization)
  for (const p of people) {
    const pos = a.positions[p.id]
    assert.ok(G.isFinitePoint(pos), `missing/invalid ${p.id}`)
    assert.ok(pos.x >= 0 && pos.y >= 0)
    assert.ok(pos.x + size.w <= a.canvasW + 0.01 && pos.y + heights[p.id] <= a.canvasH + 0.01)
    for (const q of people) if (p.id < q.id) {
      const other = a.positions[q.id]
      const overlap = pos.x < other.x + size.w - 0.01 && pos.x + size.w > other.x + 0.01 && pos.y < other.y + heights[q.id] - 0.01 && pos.y + heights[p.id] > other.y + 0.01
      assert.equal(overlap, false, `overlap ${p.id}/${q.id}`)
    }
  }
  const edges = L.buildConnections(people, a.positions, 'elbow', layout, size.w, size.h, heights)
  assert.ok(edges.every(e => !/NaN|Infinity/.test(e.path)))
  for (const p of people.filter(p => p.parentIds.length)) assert.ok(edges.some(e => e.childId === p.id), `missing child ${p.id}`)
}
for (const organization of [false, true]) for (const layout of ['vertical', 'horizontal', 'radial']) for (const density of ['spacious', 'compact']) for (const cardStyle of ['square','round','minimal','horizontal']) {
  test(`geometry ${organization ? 'org' : 'family'} ${layout} ${density} ${cardStyle}`, () => assertGeometry(organization ? orgPeople : family, layout, density, cardStyle, organization))
}
test('horizontal sibling bus connects the full range, independent of child input order', () => {
  const p = [person('parent'), person('c1',['parent'],[],2), person('c2',['parent'],[],2), person('c3',['parent'],[],2)]
  const pos = { parent:{x:0,y:80}, c1:{x:400,y:400}, c2:{x:400,y:0}, c3:{x:400,y:200} }
  const paths = L.buildConnections(p,pos,'elbow','horizontal')
  const bus = paths.find(e => e.points.length === 2 && e.points[0].x === e.points[1].x && Math.abs(e.points[1].y - e.points[0].y) >= 400)
  assert.ok(bus)
  assert.ok(bus.points[0].y <= 75 && bus.points[1].y >= 475)
})
for (const style of ['straight','curve']) test(`${style} is honored for more than one child`, () => {
  const p = [person('p'), person('a',['p'],[],2), person('b',['p'],[],2)]
  const {positions} = L.computeLayout(p)
  const edges = L.buildConnections(p,positions,style)
  assert.equal(edges.length, 2)
  assert.ok(edges.every(e => style === 'curve' ? e.path.includes(' C ') : e.points.length === 2))
})
test('far spouses retain their link and union anchor', () => {
  const p = [person('a',[],['b']),person('b',[],['a']),person('c',['a','b'],[],2)]
  const e = L.buildConnections(p,{a:{x:0,y:0},b:{x:2000,y:0},c:{x:1000,y:500}})
  assert.equal(e.filter(c=>c.kind==='spouse').length,1)
})
test('missing first parent does not discard the known second parent', () => {
  const e = L.buildConnections([person('p'),person('c',['missing','p'])],{p:{x:0,y:0},c:{x:0,y:400}})
  assert.ok(e.some(c=>c.childId==='c'))
})
test('three parents are all represented without inventing spouse relationships', () => {
  const p = [person('a'),person('b'),person('c'),person('d',['a','b','c'],[],2)]
  const e = L.buildConnections(p,L.computeLayout(p).positions)
  assert.equal(e.filter(c=>c.kind==='spouse').length,0)
  for (const id of ['a','b','c']) assert.ok(e.some(c=>c.parentIds?.includes(id)))
})
test('normalization merges API links with empty embedded relations and removes duplicate/self/unknown links', () => {
  const p = [{id:'a',firstName:'A',lastName:'',treeId:'t',relations:[]},{id:'b',firstName:'B',lastName:'',treeId:'t'}]
  const r = [{type:'parent',sourceId:'a',targetId:'b'}, {type:'child',sourceId:'b',targetId:'a'}, {type:'parent',sourceId:'b',targetId:'b'}, {type:'parent',sourceId:'missing',targetId:'a'}]
  const n = L.normalizePersons(p,r)
  assert.deepEqual(n[1].parentIds,['a']); assert.deepEqual(n[0].parentIds,[]); assert.ok(n[1].generation>n[0].generation)
})
test('cycles terminate and keep all records at finite levels', () => {
  const p = ['root','a','b','child'].map(id=>({id,firstName:id,lastName:'',treeId:'t'}))
  const r = [['root','a'],['a','b'],['b','a'],['b','child']].map(([sourceId,targetId])=>({type:'parent',sourceId,targetId}))
  const n = L.normalizePersons(p,r)
  assert.equal(n.length,4); assert.ok(n.every(p=>Number.isFinite(p.generation)))
  assert.ok(n.find(p=>p.id==='child').generation>n.find(p=>p.id==='a').generation)
})
test('normalization is independent of API ordering', () => {
  const p = ['root','a','b','child'].map(id=>({id,firstName:id,lastName:'',treeId:'t'}))
  const r = [{type:'spouse',sourceId:'a',targetId:'b'},{type:'parent',sourceId:'root',targetId:'a'},{type:'parent',sourceId:'b',targetId:'child'}]
  const levels = values => Object.fromEntries(values.sort((a,b)=>a.id.localeCompare(b.id)).map(p=>[p.id,p.generation]))
  assert.deepEqual(levels(L.normalizePersons(p,r)),levels(L.normalizePersons([...p].reverse(),[...r].reverse())))
})
test('manual positions including negative coordinates survive stale detection', () => {
  const p = [person('a',[],['b']),person('b',[],['a'])], positions={a:{x:-2000,y:100},b:{x:4000,y:1200}}
  assert.equal(L.layoutNeedsRecompute(p,positions),false); assert.deepEqual(G.separateOverlappingCards(p,positions,200,{a:248,b:248}),positions)
  assert.equal(L.layoutNeedsOrgRecompute(p,{a:positions.a}),true)
})
test('fit contains every card on narrow/short viewports, without double-counting a panel', () => {
  const b=G.contentBounds({a:{x:-300,y:-100},b:{x:15000,y:8000}},['a','b'],200,300)
  for(const [w,h] of [[320,480],[375,260],[800,600],[1440,900]]) {
    const v=G.fitViewport(b,w,h,56,24)
    assert.ok(v.pan.x+b.minX*v.scale >= 24-0.001)
    assert.ok(v.pan.x+b.maxX*v.scale <= w-24+0.001)
    assert.ok(v.pan.y+b.minY*v.scale >= 80-0.001)
    assert.ok(v.pan.y+b.maxY*v.scale <= h-24+0.001)
  }
})
test('zoom and paste use exactly the same world/screen origin', () => {
  const pan={x:80,y:100}, scale=.7, anchor={x:225,y:150}
  const world=G.screenToWorld(anchor,pan,scale), after=G.zoomAt(pan,scale,1.2,anchor)
  const actual=G.screenToWorld(anchor,after.pan,after.scale)
  assert.ok(Math.abs(actual.x-world.x)<1e-9 && Math.abs(actual.y-world.y)<1e-9)
})
test('search and generation filters produce one visible graph, including accent-insensitive search', () => {
  const p=[{...person('a'),given:'\u00c9lodie',generation:1},{...person('b'),given:'Elodie',generation:2}]
  assert.deepEqual(G.visiblePeople(p,'elodie','1').map(p=>p.id),['a'])
})
test('SVG bounds include outlying routes and control points', () => {
  const b=G.drawingBounds(null,[{path:'M -600 -500 C -1200 100 1800 500 900 900'}],0)
  assert.equal(b.minX,-1200); assert.equal(b.maxX,1800); assert.equal(b.minY,-500)
})
test('square organization cards use the same text metric as the established organization layout', () => {
  for(const p of orgPeople) assert.equal(G.getPersonCardHeight(p,'square',true),org.estimateOrgCardHeight(p))
})
test('empty and single-person trees are valid in all views', () => {
  for(const mode of ['vertical','horizontal','radial']) {
    assert.deepEqual(L.computeLayout([],mode).positions,{})
    assertGeometry([person('solo')],mode,'compact','square',false)
  }
})

test('text growth and inserted cards are separated without moving unrelated manual cards', () => {
  const people = [person('a'), person('b', ['a'], [], 2), person('c', [], [], 2)]
  const source = { a: { x: 40, y: 40 }, b: { x: 40, y: 240 }, c: { x: 800, y: 600 } }
  const repaired = G.separateOverlappingCards(people, source, 200, { a: 400, b: 248, c: 248 })
  assert.deepEqual(repaired.a, source.a)
  assert.ok(repaired.b.y >= repaired.a.y + 400)
  assert.deepEqual(repaired.c, source.c)
  assert.deepEqual(source.b, { x: 40, y: 240 }, 'input is immutable')
})
