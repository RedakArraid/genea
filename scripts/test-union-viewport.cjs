/** Exact viewport regressions for compact 4x7 trees. No API or production data. */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const ts = require(path.join(root, 'frontend/node_modules/typescript'))
const cache = new Map()
function load(file) {
  file = path.resolve(root, file)
  if (!path.extname(file)) file += '.ts'
  if (cache.has(file)) return cache.get(file)
  const module = { exports: {} }
  cache.set(file, module.exports)
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(
    name => load(path.resolve(path.dirname(file), name)), module, module.exports)
  return module.exports
}
const { computeUnionOverview } = load('frontend/src/utils/union-overview.ts')
const { unionReadingView } = load('frontend/src/utils/union-viewport.ts')
function fixture() {
  const person = (id, parentIds = [], spouseIds = []) => ({
    id, given: id, sur: 'Test', parentIds, spouseIds, generation: parentIds.length ? 2 : 1,
    born: null, died: null, birthDate: null, deathDate: null, isAlive: true,
    place: '', bio: { fr: '', en: '' }, tone: 'stone', photoUrl: null,
  })
  const partners = ['a', 'b', 'c', 'd']
  return [person('father', [], partners), ...partners.flatMap(id => [
    person(id, [], ['father']), ...Array.from({ length: 7 }, (_, i) => person(`${id}-${i}`, ['father', id])),
  ])]
}
function screenBox(scene, view, id) {
  const p = scene.positions[id], size = scene.cardSizes[id]
  return { left: p.x * view.scale + view.pan.x, right: (p.x + size.w) * view.scale + view.pan.x,
    top: p.y * view.scale + view.pan.y, bottom: (p.y + size.h) * view.scale + view.pan.y }
}
for (const [width, height, top] of [[375, 766, 185], [390, 766, 185], [375, 766, 172]]) {
  test(`4x7 ${width}x${height}, toolbar ${top}: parents anchor one aligned child row`, () => {
    const people = fixture(), initial = computeUnionOverview(people, 'vertical', 'square', { narrow: true })
    for (const panel of initial.panels) {
      const scene = computeUnionOverview(people, 'vertical', 'square', { narrow: true, focusedFamily: panel.family.key })
      const view = unionReadingView(scene, width, height, top, panel.family.key)
      assert.ok(view.scale >= .85, 'Do not shrink names below the existing readable threshold')
      assert.equal(Object.keys(scene.positions).length, 33, 'No filtering or duplicate father')
      for (const person of panel.family.parents) {
        const r = screenBox(scene, view, person.id)
        assert.ok(r.left >= 0 && r.right <= width, `${person.id} parent anchor is clipped horizontally`)
        assert.ok(r.top >= top && r.bottom <= height - 60, `${person.id} parent anchor is clipped vertically`)
      }
      assert.equal(new Set(panel.family.children.map(person => scene.positions[person.id].y)).size, 1, 'One generation must use one row')
      assert.ok(panel.family.children.some(person => {
        const r = screenBox(scene, view, person.id)
        return r.right > 0 && r.left < width && r.bottom > top && r.top < height - 60
      }), 'The aligned child row remains reachable from the opening frame')
    }
  })
}
test('4x7 desktop keeps the common parent above aligned partners and children', () => {
  const people = fixture(), scene = computeUnionOverview(people), view = unionReadingView(scene, 1600, 906, 141)
  assert.ok(view.scale >= .85)
  assert.equal(Object.keys(scene.positions).length, 33)
  const father = screenBox(scene, view, 'father')
  assert.ok(father.left >= 0 && father.right <= 1600 && father.top >= 141 && father.bottom <= 846)
  const partners = ['a','b','c','d']
  assert.equal(new Set(partners.map(id => scene.positions[id].y)).size, 1)
  const children = people.filter(person => person.parentIds.length)
  assert.equal(new Set(children.map(person => scene.positions[person.id].y)).size, 1)
  assert.ok(scene.positions.father.y < scene.positions.a.y)
  assert.ok(scene.positions.a.y < scene.positions['a-0'].y)
})
test('short screens retain a readable common parent, not an illegible automatic overview', () => {
  const scene = computeUnionOverview(fixture(), 'vertical', 'square', { narrow: true })
  const view = unionReadingView(scene, 375, 620, 185)
  assert.ok(view.scale >= .85)
  const father = screenBox(scene, view, 'father')
  assert.ok(father.left >= 0 && father.right <= 375 && father.top >= 185 && father.bottom <= 560)
  assert.equal(Object.keys(scene.positions).length, 33)
})
