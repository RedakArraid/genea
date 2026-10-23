/** Genealogy regressions. CI loads actual modules; local isolation may mock only the unused org engine. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let ts;
try { ts = require(path.join(root, 'frontend/node_modules/typescript')); }
catch { ts = require(process.env.TYPESCRIPT_PATH || 'typescript'); }
const cache = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file);
  if (process.env.GENEA_GENEALOGY_ONLY === '1' && file.endsWith('/org-layout.ts')) {
    return new Proxy({}, { get: () => () => { throw new Error('Organization is not part of this isolated test'); } });
  }
  const module = { exports: {} }; cache.set(file, module.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(name => load(path.resolve(path.dirname(file), name)), module, module.exports);
  return module.exports;
}
const L = load('frontend/src/utils/tree-layout.ts');
const G = load('frontend/src/lib/tree-geometry.ts');
const F = load('frontend/src/lib/family-model.ts');
const fixture = (maternal = false, married = true) => {
  const hub = maternal ? 'mother' : 'father';
  const partners = ['partner1', 'partner2', 'partner3'];
  const ids = [hub, ...partners, 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  const pairs = { a1: [hub, partners[0]], b2: [hub, partners[0]], b1: [hub, partners[1]], c2: [hub, partners[1]], c1: [hub, partners[2]], a2: [hub, partners[2]] };
  const people = ids.map(id => ({ id, firstName: id, lastName: 'Test', treeId: 't' }));
  const relations = Object.entries(pairs).flatMap(([child, parents]) => parents.flatMap(parent => [
    { id: `${parent}-${child}`, type: 'parent', sourceId: parent, targetId: child },
    { id: `${child}-${parent}`, type: 'child', sourceId: child, targetId: parent },
  ]));
  if (married) for (const partner of partners) relations.push({ id: `${hub}-${partner}`, type: 'spouse', sourceId: hub, targetId: partner });
  return { people: L.normalizePersons(people, relations), pairs };
};
for (const maternal of [false, true]) for (const mode of ['vertical', 'horizontal', 'radial']) for (const style of ['square', 'round', 'horizontal', 'minimal']) for (const density of ['spacious', 'compact']) for (const conn of ['elbow', 'curve', 'straight']) {
  test(`${maternal ? 'maternal' : 'paternal'} half siblings: ${mode}/${style}/${density}/${conn}`, () => {
    const { people, pairs } = fixture(maternal), opts = { cardStyle: style };
    const { positions } = L.computeLayout(people, mode, density, opts);
    const size = G.getCardDimensions(style), heights = G.buildCardHeights(people, style);
    const links = L.buildConnections(people, positions, conn, mode, size.w, size.h, heights);
    for (const [child, parents] of Object.entries(pairs)) {
      const branches = links.filter(l => l.childId === child);
      assert.ok(branches.length, `missing ${child}`);
      for (const branch of branches) assert.deepEqual(branch.parentIds, [...parents].sort());
    }
    for (const link of links.filter(l => l.kind === 'spouse')) for (const p of people) {
      const pos = positions[p.id];
      const covered = link.midX > pos.x - 10 && link.midX < pos.x + size.w + 10 && link.midY > pos.y - 10 && link.midY < pos.y + heights[p.id] + 10;
      assert.equal(covered, false, `union handle covered by ${p.id}`);
    }
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j], pa = positions[a.id], pb = positions[b.id];
      assert.equal(pa.x < pb.x + size.w - .001 && pa.x + size.w > pb.x + .001 && pa.y < pb.y + heights[b.id] - .001 && pa.y + heights[a.id] > pb.y + .001, false);
    }
    if (mode !== 'radial') {
      const children = Object.keys(pairs).sort((a, b) => mode === 'vertical' ? positions[a].x - positions[b].x : positions[a].y - positions[b].y);
      const keys = children.map(id => F.parentKey(pairs[id]));
      assert.equal(keys.filter((k, i) => !i || keys[i - 1] !== k).length, 3, 'full siblings must remain contiguous');
    }
    if (conn === 'elbow' && mode !== 'radial') {
      const buses = links.filter(l => l.kind === 'child' && !l.childId && l.points.length === 2 && (mode === 'vertical' ? l.points[0].y === l.points[1].y && l.points[0].x !== l.points[1].x : l.points[0].x === l.points[1].x && l.points[0].y !== l.points[1].y));
      assert.equal(buses.length, 3);
      const lane = l => mode === 'vertical' ? l.points[0].y : l.points[0].x;
      assert.equal(new Set(buses.map(lane)).size, 3, 'different parent sets cannot share a sibling bus');
    }
    assert.deepEqual(L.computeLayout([...people].reverse(), mode, density, opts).positions, positions, 'API order must not change placement');
  });
}
test('unmarried co-parents retain separate families without inventing a spouse link', () => {
  const { people, pairs } = fixture(false, false);
  const links = L.buildConnections(people, L.computeLayout(people).positions);
  assert.equal(links.filter(l => l.kind === 'spouse').length, 0);
  for (const [id, parents] of Object.entries(pairs)) assert.deepEqual(links.find(l => l.childId === id).parentIds, parents.sort());
});
test('full, half and incomplete parentage are distinguished without guessing unknown parents', () => {
  const person = (id, parents) => ({ id, parentIds: parents, spouseIds: [] });
  const a = person('a', ['father', 'm1']);
  assert.equal(F.siblingKind(a, person('full', ['m1', 'father'])), 'full');
  assert.equal(F.siblingKind(a, person('half', ['father', 'm2'])), 'half');
  assert.equal(F.siblingKind(a, person('unknown', ['father'])), 'uncertain');
  assert.equal(F.siblingKind(person('one', ['father']), person('two', ['father'])), 'uncertain');
  assert.equal(F.siblingKind(a, person('step', ['other', 'm2'])), null);
  assert.equal(F.siblingKind(a, a), null);
});
test('link picker excludes ancestors, self, existing complete links and accidental third parents', () => {
  const p = (id, parentIds = []) => ({ id, parentIds, spouseIds: [] });
  const people = [p('father'), p('m1'), p('m2'), p('child', ['father', 'm1']), p('unknown', ['father']), p('new')];
  assert.equal(F.canLinkChild(people[3], ['father', 'm2'], people), false);
  assert.equal(F.canLinkChild(people[4], ['father', 'm2'], people), true);
  assert.equal(F.canLinkChild(people[0], ['child'], people), false);
  assert.equal(F.canLinkChild(people[0], ['father'], people), false);
  assert.equal(F.canLinkChild(people[5], ['father', 'm2'], people), true);
});
for (const count of [2, 3, 6, 12]) for (const maternal of [false, true]) for (const mode of ['vertical', 'horizontal']) {
  test(`unknown co-parent plus ${count} unions (${maternal ? 'mother' : 'father'}, ${mode}) keeps separate bus corridors`, () => {
    const hub = maternal ? 'mother' : 'father';
    const partners = Array.from({ length: count }, (_, i) => `partner${i}`);
    const ids = [hub, ...partners, 'unknown', ...partners.flatMap((_, i) => [`child${i}a`, `child${i}b`])];
    const relations = [{ type: 'parent', sourceId: hub, targetId: 'unknown' }];
    partners.forEach((partner, i) => {
      relations.push({ type: 'spouse', sourceId: hub, targetId: partner });
      for (const child of [`child${i}a`, `child${i}b`]) for (const parent of [hub, partner]) relations.push({ type: 'parent', sourceId: parent, targetId: child });
    });
    const people = L.normalizePersons(ids.map(id => ({ id, firstName: id, lastName: '', treeId: 't' })), relations);
    const positions = L.computeLayout(people, mode, 'compact').positions;
    const links = L.buildConnections(people, positions, 'elbow', mode);
    const buses = links.filter(l => l.kind === 'child' && !l.childId && l.points.length === 2 && (mode === 'vertical' ? l.points[0].y === l.points[1].y && l.points[0].x !== l.points[1].x : l.points[0].x === l.points[1].x && l.points[0].y !== l.points[1].y));
    assert.equal(buses.length, count + 1);
    const lanes = buses.map(l => mode === 'vertical' ? l.points[0].y : l.points[0].x).sort((a, b) => a - b);
    for (let i = 1; i < lanes.length; i++) assert.ok(lanes[i] - lanes[i - 1] >= 10, `bus spacing too small: ${lanes[i] - lanes[i - 1]}`);
    assert.deepEqual(links.find(l => l.childId === 'unknown').parentIds, [hub]);
  });
}
